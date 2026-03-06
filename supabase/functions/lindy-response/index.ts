import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  const expectedSecret = Deno.env.get('LINDY_SECRET') || 'temp-secret-change-later'

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { user_id, agent_role, message, message_id } = body as Record<string, unknown>

    if (typeof user_id !== 'string' || user_id.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (typeof agent_role !== 'string' || agent_role.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid agent_role' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (typeof message !== 'string' || message.length === 0 || message.length > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid message (max 50000 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (message_id !== undefined && message_id !== null && (typeof message_id !== 'string' || message_id.length > 100)) {
      return new Response(JSON.stringify({ error: 'Invalid message_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.from('lindy_messages').insert({
      user_id,
      agent_role,
      sender: 'agent',
      message,
      metadata: message_id ? { reply_to: message_id } : {},
    })

    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ error: 'Failed to store message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
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
