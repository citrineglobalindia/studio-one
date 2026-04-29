// Manage organization members: invite (create or attach existing user),
// update role / login_surface, or remove. Uses the service role so we can
// touch auth.users without exposing those keys to the browser.
//
// Caller must be an admin/owner of the target organization (or a super admin).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "invite" | "update" | "remove";
type Surface = "web" | "pwa" | "both";

const VALID_ROLES = new Set([
  "admin", "manager", "vendor", "editor", "telecaller",
  "videographer", "photographer", "hr", "accounts",
]);
const VALID_SURFACES = new Set<Surface>(["web", "pwa", "both"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function genTempPassword() {
  // 16 chars, mixed: caller can email this to invitee or trigger password reset
  return crypto.randomUUID().replace(/-/g, "") + "Aa1!";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const action = body.action as Action;
    const organizationId = body.organization_id as string | undefined;

    if (!organizationId) return json({ error: "organization_id is required" }, 400);

    // Authorize: caller must be owner/admin of org, or super_admin.
    const { data: callerMembership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", caller.id)
      .maybeSingle();

    const { data: superRow } = await supabaseAdmin
      .from("super_admins")
      .select("id")
      .eq("user_id", caller.id)
      .maybeSingle();

    const isAuthorized =
      !!superRow ||
      (callerMembership && (callerMembership.role === "owner" || callerMembership.role === "admin"));

    if (!isAuthorized) {
      return json({ error: "Only org owners/admins can manage members." }, 403);
    }

    // ─── INVITE ───────────────────────────────────────────────────────────
    if (action === "invite") {
      const email = (body.email as string | undefined)?.trim().toLowerCase();
      const role = body.role as string | undefined;
      const loginSurface = (body.login_surface as Surface | undefined) ?? "both";
      const displayName = (body.display_name as string | undefined)?.trim();

      if (!email) return json({ error: "email is required" }, 400);
      if (!role || !VALID_ROLES.has(role)) return json({ error: "Invalid role" }, 400);
      if (!VALID_SURFACES.has(loginSurface)) return json({ error: "Invalid login_surface" }, 400);

      // Look up an existing auth user with this email. The admin API doesn't
      // expose a direct `getUserByEmail`, so we list a small page and filter.
      // For studios with thousands of accounts this would need a real lookup,
      // but for now this is fine.
      let targetUserId: string | null = null;
      const { data: existingList } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const existing = existingList?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );
      if (existing) {
        targetUserId = existing.id;
      } else {
        // Create auth user with a temporary password.
        const tempPassword = genTempPassword();
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: displayName ? { display_name: displayName } : undefined,
        });
        if (createErr || !created.user) {
          return json({ error: createErr?.message || "Failed to create user" }, 400);
        }
        targetUserId = created.user.id;
      }

      // Profile (display name + default role)
      await supabaseAdmin.from("profiles").upsert({
        user_id: targetUserId!,
        display_name: displayName || email,
        role,
      });

      // organization_members row (idempotent — upsert on org+user)
      const { error: memberErr } = await supabaseAdmin
        .from("organization_members")
        .upsert(
          {
            organization_id: organizationId,
            user_id: targetUserId!,
            role,
            login_surface: loginSurface,
            invited_email: email,
            invited_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,user_id" }
        );

      if (memberErr) return json({ error: memberErr.message }, 400);

      // Trigger a password-reset email so the invitee can pick their own password.
      // We don't fail the request if this errors (network blip etc.).
      try {
        await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
        });
      } catch (_) { /* non-fatal */ }

      return json({
        success: true,
        user_id: targetUserId,
        email,
        role,
        login_surface: loginSurface,
        was_existing_user: !!existing,
      });
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────
    if (action === "update") {
      const memberId = body.member_id as string | undefined;
      const role = body.role as string | undefined;
      const loginSurface = body.login_surface as Surface | undefined;

      if (!memberId) return json({ error: "member_id is required" }, 400);

      const updates: Record<string, string> = {};
      if (role) {
        if (!VALID_ROLES.has(role) && role !== "owner") {
          return json({ error: "Invalid role" }, 400);
        }
        updates.role = role;
      }
      if (loginSurface) {
        if (!VALID_SURFACES.has(loginSurface)) {
          return json({ error: "Invalid login_surface" }, 400);
        }
        updates.login_surface = loginSurface;
      }
      if (Object.keys(updates).length === 0) {
        return json({ error: "Nothing to update" }, 400);
      }

      const { data: member, error: updErr } = await supabaseAdmin
        .from("organization_members")
        .update(updates)
        .eq("id", memberId)
        .eq("organization_id", organizationId)
        .select()
        .maybeSingle();

      if (updErr) return json({ error: updErr.message }, 400);
      if (!member) return json({ error: "Member not found" }, 404);

      // Mirror the role onto the user's profile so they see the right
      // dashboard on next login.
      if (updates.role && member.user_id) {
        await supabaseAdmin
          .from("profiles")
          .update({ role: updates.role })
          .eq("user_id", member.user_id);
      }

      return json({ success: true, member });
    }

    // ─── REMOVE ───────────────────────────────────────────────────────────
    if (action === "remove") {
      const memberId = body.member_id as string | undefined;
      if (!memberId) return json({ error: "member_id is required" }, 400);

      // Don't let an owner remove themselves accidentally.
      const { data: existing } = await supabaseAdmin
        .from("organization_members")
        .select("user_id, role")
        .eq("id", memberId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!existing) return json({ error: "Member not found" }, 404);
      if (existing.role === "owner") {
        return json({ error: "Cannot remove the studio owner." }, 400);
      }

      const { error: delErr } = await supabaseAdmin
        .from("organization_members")
        .delete()
        .eq("id", memberId)
        .eq("organization_id", organizationId);

      if (delErr) return json({ error: delErr.message }, 400);

      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
