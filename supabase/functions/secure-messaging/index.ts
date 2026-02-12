// @ts-nocheck
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

    const { receiverId, content, contractId } = await req.json()
    const senderId = user.id

    // REGRA DE NEGÓCIO: Bloquear qualquer caractere numérico (0-9)
    if (/[0-9]/.test(content)) {
      return new Response(JSON.stringify({ 
        error: "Não é permitido enviar números nas mensagens por motivos de segurança." 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        contract_id: contractId,
        content: content,
        is_blocked: false
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})