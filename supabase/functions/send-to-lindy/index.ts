import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const AGENT_WEBHOOKS: Record<string, string> = {
  marketing: 'https://public.lindy.ai/api/v1/webhooks/lindy/19eac8e5-b987-43eb-8d30-2bf97203de30',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { agent_role, message, task_id, message_id } = await req.json()

    if (!agent_role || !message) {
      return new Response(JSON.stringify({ error: 'Missing agent_role or message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const webhookUrl = AGENT_WEBHOOKS[agent_role]
    if (!webhookUrl) {
      console.log(`No webhook configured for agent "${agent_role}" — message stored locally only.`)
      return new Response(JSON.stringify({ success: true, delivered: false, reason: 'No webhook configured for this agent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/lindy-response`
    const lindyApiKey = Deno.env.get('LINDY_API_KEY')

    // Flat body format per Lindy webhook spec
    const lindyResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(lindyApiKey ? { 'Authorization': `Bearer ${lindyApiKey}` } : {}),
      },
      body: JSON.stringify({
        message,
        userId: user.id,
        agent_role,
        task_id: task_id || null,
        message_id: message_id || null,
        callbackUrl,
      }),
    })

    const responseText = await lindyResponse.text()
    console.log(`Lindy response: ${lindyResponse.status} ${responseText}`)

    if (!lindyResponse.ok) {
      console.error('Lindy webhook error:', lindyResponse.status, responseText)
      return new Response(JSON.stringify({ error: `Lindy returned ${lindyResponse.status}: ${responseText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, delivered: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
