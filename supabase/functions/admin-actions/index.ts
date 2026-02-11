import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error("Unauthorized")

    // Verify the caller is an admin
    const { data: callerProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (callerProfile?.role !== 'ADMIN') throw new Error("Forbidden: Admin access required.");

    const { targetUserId, updates } = await req.json()

    const timestampFields = new Set([
      'blocked_until',
      'suspended_until',
      'deleted_at',
      'updated_at',
      'created_at',
    ])

    const sanitizedUpdates = Object.entries(updates || {}).reduce((acc, [key, value]) => {
      if (timestampFields.has(key) && value === '') {
        acc[key] = null
      } else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, unknown>)

    // SECURITY FIX: Use service_role client to bypass tr_protect_profile_fields trigger
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders
    })
  }
})
