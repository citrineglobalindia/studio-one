import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const email = "superadmin@studio.com";
  const password = "SuperAdmin@123";

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError && !userError.message.includes("already been registered")) {
    return new Response(JSON.stringify({ error: userError.message }), { status: 400 });
  }

  const userId = userData?.user?.id;
  if (!userId) {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users?.find((u: any) => u.email === email);
    if (!existing) return new Response(JSON.stringify({ error: "Could not find or create user" }), { status: 400 });
    
    await supabase.from("super_admins").insert({ user_id: existing.id });
    return new Response(JSON.stringify({ success: true, email, password }));
  }

  await supabase.from("super_admins").insert({ user_id: userId });
  return new Response(JSON.stringify({ success: true, email, password }));
});
