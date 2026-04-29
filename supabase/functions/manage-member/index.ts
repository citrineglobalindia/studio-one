// Manage organization users — every person in a studio is treated as one
// "user" record that may span three tables:
//   1. auth.users          (login + email)
//   2. organization_members (RBAC: role, login_surface)
//   3. team_members        (operational: rate, specialties, availability, …)
//
// Actions: invite | update | remove. Caller must be owner / admin / manager
// of the target organization (or a super admin).
//
// Service role is used so we can touch auth.users without leaking those keys
// to the browser.

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

interface TeamFields {
  phone?: string | null;
  daily_rate?: number | null;
  experience_years?: number | null;
  specialties?: string[] | null;
  notes?: string | null;
  availability?: string | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function genTempPassword() {
  return crypto.randomUUID().replace(/-/g, "") + "Aa1!";
}

/** Build the team_members upsert payload, only including fields the caller passed. */
function buildTeamPatch(body: TeamFields): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.daily_rate !== undefined && body.daily_rate !== null) patch.daily_rate = body.daily_rate;
  if (body.experience_years !== undefined && body.experience_years !== null) patch.experience_years = body.experience_years;
  if (body.specialties !== undefined && body.specialties !== null) patch.specialties = body.specialties;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.availability !== undefined && body.availability !== null) patch.availability = body.availability;
  return patch;
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

    // Authorize caller
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
      (callerMembership && ["owner", "admin", "manager"].includes(callerMembership.role));

    if (!isAuthorized) {
      return json({ error: "Only org owners/admins/managers can manage members." }, 403);
    }

    // ─── INVITE ───────────────────────────────────────────────────────────
    if (action === "invite") {
      const email = (body.email as string | undefined)?.trim().toLowerCase() || null;
      const role = body.role as string | undefined;
      const loginSurface = (body.login_surface as Surface | undefined) ?? "both";
      const displayName = (body.display_name as string | undefined)?.trim();
      const sendInvite = body.send_invite !== false; // default true

      if (!role || !VALID_ROLES.has(role)) return json({ error: "Invalid role" }, 400);
      if (!VALID_SURFACES.has(loginSurface)) return json({ error: "Invalid login_surface" }, 400);

      let targetUserId: string | null = null;
      let wasExistingUser = false;

      // If caller provided email, create or attach an auth user
      if (email) {
        const { data: existingList } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        const existing = existingList?.users?.find(
          (u) => u.email?.toLowerCase() === email
        );
        if (existing) {
          targetUserId = existing.id;
          wasExistingUser = true;
        } else {
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

        // Profile
        await supabaseAdmin.from("profiles").upsert({
          user_id: targetUserId!,
          display_name: displayName || email,
          role,
        });

        // organization_members (idempotent)
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

        // Optional invitation email
        if (sendInvite && !wasExistingUser) {
          try {
            await supabaseAdmin.auth.admin.generateLink({
              type: "recovery",
              email,
            });
          } catch (_) { /* non-fatal */ }
        }
      }

      // team_members row — created for everyone (with or without auth)
      // so they can be assigned to events. If user_id is null, they're a
      // contractor record only.
      const teamPatch = buildTeamPatch(body);
      const teamRow: Record<string, unknown> = {
        organization_id: organizationId,
        user_id: targetUserId,
        full_name: displayName || email || "Unnamed user",
        role,
        email,
        availability: "available",
        ...teamPatch,
      };

      // If a row with this user_id already exists in this org, update; else insert
      let teamMemberId: string | null = null;
      if (targetUserId) {
        const { data: existingTeam } = await supabaseAdmin
          .from("team_members")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("user_id", targetUserId)
          .maybeSingle();
        if (existingTeam) {
          const { data: upd } = await supabaseAdmin
            .from("team_members")
            .update(teamRow)
            .eq("id", existingTeam.id)
            .select("id")
            .single();
          teamMemberId = upd?.id ?? existingTeam.id;
        }
      }
      if (!teamMemberId) {
        const { data: ins, error: insErr } = await supabaseAdmin
          .from("team_members")
          .insert(teamRow)
          .select("id")
          .single();
        if (insErr) return json({ error: `team_members: ${insErr.message}` }, 400);
        teamMemberId = ins.id;
      }

      return json({
        success: true,
        user_id: targetUserId,
        team_member_id: teamMemberId,
        email,
        role,
        login_surface: loginSurface,
        was_existing_user: wasExistingUser,
        has_login: !!targetUserId,
      });
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────
    if (action === "update") {
      const memberId = body.member_id as string | undefined;       // organization_members.id
      const teamMemberId = body.team_member_id as string | undefined; // team_members.id
      const role = body.role as string | undefined;
      const loginSurface = body.login_surface as Surface | undefined;
      const displayName = (body.display_name as string | undefined)?.trim();

      // Update organization_members if memberId present
      if (memberId) {
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
        if (Object.keys(updates).length > 0) {
          const { data: member, error: updErr } = await supabaseAdmin
            .from("organization_members")
            .update(updates)
            .eq("id", memberId)
            .eq("organization_id", organizationId)
            .select()
            .maybeSingle();
          if (updErr) return json({ error: updErr.message }, 400);
          if (!member) return json({ error: "Member not found" }, 404);
          if (updates.role && member.user_id) {
            await supabaseAdmin
              .from("profiles")
              .update({ role: updates.role })
              .eq("user_id", member.user_id);
            if (displayName) {
              await supabaseAdmin
                .from("profiles")
                .update({ display_name: displayName })
                .eq("user_id", member.user_id);
            }
          }
        }
      }

      // Update team_members if teamMemberId present
      if (teamMemberId) {
        const teamUpdates = buildTeamPatch(body);
        if (role) teamUpdates.role = role;
        if (displayName) teamUpdates.full_name = displayName;
        if (Object.keys(teamUpdates).length > 0) {
          const { error: teamErr } = await supabaseAdmin
            .from("team_members")
            .update(teamUpdates)
            .eq("id", teamMemberId)
            .eq("organization_id", organizationId);
          if (teamErr) return json({ error: `team_members: ${teamErr.message}` }, 400);
        }
      }

      return json({ success: true });
    }

    // ─── REMOVE ───────────────────────────────────────────────────────────
    if (action === "remove") {
      const memberId = body.member_id as string | undefined;
      const teamMemberId = body.team_member_id as string | undefined;

      // Owner-protection on org membership
      if (memberId) {
        const { data: existing } = await supabaseAdmin
          .from("organization_members")
          .select("user_id, role")
          .eq("id", memberId)
          .eq("organization_id", organizationId)
          .maybeSingle();
        if (existing?.role === "owner") {
          return json({ error: "Cannot remove the studio owner." }, 400);
        }
        if (existing) {
          await supabaseAdmin
            .from("organization_members")
            .delete()
            .eq("id", memberId)
            .eq("organization_id", organizationId);
        }
      }

      if (teamMemberId) {
        await supabaseAdmin
          .from("team_members")
          .delete()
          .eq("id", teamMemberId)
          .eq("organization_id", organizationId);
      }

      if (!memberId && !teamMemberId) {
        return json({ error: "member_id or team_member_id required" }, 400);
      }

      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
