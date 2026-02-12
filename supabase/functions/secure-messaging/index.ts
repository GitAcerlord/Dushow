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

    // SECURITY: Verify JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error("Unauthorized")

    const { receiverId, content, contractId } = await req.json()
    const senderId = user.id

    // 1. Verificar se o contrato permite troca de contatos (ex: após aceite)
    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('status')
      .eq('id', contractId)
      .single()

    const isAccepted = contract?.status === 'ACEITO' || contract?.status === 'PAGO' || contract?.status === 'COMPLETED' || contract?.status === 'ACCEPTED' || contract?.status === 'PAID';
    
    let finalContent = content;
    let isBlocked = false;
    let reason = "";

    // 2. Filtro Anti-Bypass (Apenas se não estiver aceito)
    if (!isAccepted) {
      // Bloqueia qualquer sequência de números (0-9) que possa ser telefone/pix
      const hasNumbers = /[0-9]{4,}/.test(content.replace(/\s/g, ''));
      
      if (hasNumbers) {
        isBlocked = true;
        reason = "Compartilhamento de contatos não permitido antes do aceite.";
        finalContent = content.replace(/[0-9]/g, '*');
      }
    }

    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        contract_id: contractId,
        content: finalContent,
        is_blocked: isBlocked,
        block_reason: reason,
        original_content_hidden: isBlocked ? content : null
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
      headers: corsHeaders
    })
  }
})