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

    const { proId, eventName, eventDate, location } = await req.json()

    // SECURITY FIX: Fetch the artist's actual price from the database
    const { data: artist, error: artistError } = await supabaseClient
      .from('profiles')
      .select('price')
      .eq('id', proId)
      .single();

    if (artistError || !artist) throw new Error("Artist not found.");

    // Create contract with the verified price
    const { data: contract, error: contractError } = await supabaseClient
      .from('contracts')
      .insert({
        client_id: user.id,
        pro_id: proId,
        event_name: eventName,
        event_date: eventDate,
        event_location: location,
        value: artist.price, // Use server-side price
        status: 'PENDING'
      })
      .select()
      .single();

    if (contractError) throw contractError;

    return new Response(JSON.stringify(contract), {
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