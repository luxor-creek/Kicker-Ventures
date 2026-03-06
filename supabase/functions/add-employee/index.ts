import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
  if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  // Check admin role
  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
  if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
  }

  const { email, password, full_name } = body as Record<string, unknown>;

  // Input validation
  if (typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255) {
    return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400, headers: corsHeaders });
  }
  if (typeof password !== "string" || password.length < 6 || password.length > 72) {
    return new Response(JSON.stringify({ error: "Password must be 6-72 characters" }), { status: 400, headers: corsHeaders });
  }
  if (typeof full_name !== "string" || full_name.trim().length === 0 || full_name.length > 255) {
    return new Response(JSON.stringify({ error: "Invalid full_name" }), { status: 400, headers: corsHeaders });
  }

  // Create user
  const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });

  // Add employee role
  await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: "employee" });

  // Add to general channel
  const { data: channels } = await supabaseAdmin.from("channels").select("id").eq("is_group", true).limit(1);
  if (channels?.[0]) {
    await supabaseAdmin.from("channel_members").insert({ channel_id: channels[0].id, user_id: newUser.user.id });
  }

  // Create DM channel
  const { data: dmChannel } = await supabaseAdmin.from("channels").insert({ name: null, is_group: false }).select().single();
  if (dmChannel) {
    await supabaseAdmin.from("channel_members").insert([
      { channel_id: dmChannel.id, user_id: caller.id },
      { channel_id: dmChannel.id, user_id: newUser.user.id },
    ]);
  }

  return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
