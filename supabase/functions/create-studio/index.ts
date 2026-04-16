import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is super admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: superAdmin } = await supabaseAdmin
      .from("super_admins")
      .select("id")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!superAdmin) {
      return new Response(JSON.stringify({ error: "Not a super admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = await req.json();
    const { email, password, studioName, city, phone, teamSize, planId } = body;

    if (!email || !password || !studioName) {
      return new Response(JSON.stringify({ error: "Email, password, and studio name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create user
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // 2. Create slug from studio name
    const slug = studioName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // 3. Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: studioName,
        slug: slug + "-" + Date.now().toString(36),
        owner_id: userId,
        city: city || null,
        phone: phone || null,
        team_size: teamSize || "solo",
      })
      .select()
      .single();

    if (orgError) {
      // Cleanup: delete created user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Failed to create organization: " + orgError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Create owner profile and add owner as org member
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        user_id: userId,
        display_name: studioName,
        role: "admin",
      });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
    }

    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: "owner",
        invited_email: email,
      });

    if (memberError) {
      console.error("Member insert error:", memberError);
    }

    // 5. Create subscription if plan provided
    if (planId) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      await supabaseAdmin.from("subscriptions").insert({
        organization_id: org.id,
        plan_id: planId,
        status: "trial",
        trial_ends_at: trialEnd.toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        organizationId: org.id,
        studio: { id: org.id, name: org.name, slug: org.slug },
        credentials: { email, password },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
