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

    // 1. Verificar status do contrato
    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('status')
      .eq('id', contractId)
      .single()

    // Status que permitem troca de contato
    const isSafeStatus = ['ACEITO', 'PAGO', 'COMPLETED', 'ACCEPTED', 'PAID', 'SIGNED', 'ASSINADO'].includes(contract?.status);
    
    let finalContent = content;
    let isBlocked = false;
    let reason = "";

    // 2. Filtro Anti-Bypass (Bloqueio de números)
    if (!isSafeStatus) {
      // Detecta sequências de 8 ou mais números (com ou sem espaços/traços)
      const phoneRegex = /(\d[\s-]*){8,}/;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      
      if (phoneRegex.test(content) || emailRegex.test(content)) {
        isBlocked = true;
        reason = "Bloqueio de segurança: Compartilhamento de contatos não permitido nesta fase.";
        // Ofusca números e e-mails
        finalContent = content.replace(/[0-9]/g, '*').replace(/@/g, '[at]');
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