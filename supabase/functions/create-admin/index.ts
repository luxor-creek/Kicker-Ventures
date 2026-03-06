import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const { email, password, full_name } = body as Record<string, unknown>;

  // Input validation
  if (typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255) {
    return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6 || password.length > 72) {
    return new Response(JSON.stringify({ error: "Password must be 6-72 characters" }), { status: 400 });
  }
  if (typeof full_name !== "string" || full_name.trim().length === 0 || full_name.length > 255) {
    return new Response(JSON.stringify({ error: "Invalid full_name" }), { status: 400 });
  }

  // Create user
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  // Add admin role
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: user.user.id, role: "admin" });

  if (roleError) return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });

  // Create group channel
  const { data: channel } = await supabaseAdmin
    .from("channels")
    .insert({ name: "General", is_group: true })
    .select()
    .single();

  if (channel) {
    await supabaseAdmin
      .from("channel_members")
      .insert({ channel_id: channel.id, user_id: user.user.id });
  }

  return new Response(JSON.stringify({ success: true, user_id: user.user.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
