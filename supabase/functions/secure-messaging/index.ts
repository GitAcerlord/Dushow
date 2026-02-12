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

    // 1. Verificar se o contrato permite troca de contatos (ex: após aceite ou pagamento)
    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('status')
      .eq('id', contractId)
      .single()

    // Status que liberam contatos: ACEITO, PAGO, COMPLETED, ASSINADO
    const isContactAllowed = ['ACEITO', 'PAGO', 'COMPLETED', 'ASSINADO', 'ACCEPTED', 'PAID', 'SIGNED'].includes(contract?.status);
    
    let finalContent = content;
    let isBlocked = false;
    let reason = "";

    // 2. Filtro Anti-Bypass (Apenas se contatos não estiverem liberados)
    if (!isContactAllowed) {
      // Regex para detectar qualquer sequência de 4 ou mais dígitos (Telefone, PIX, CPF)
      const numberRegex = /[0-9]{4,}/;
      // Regex para detectar e-mails
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/;
      
      const hasNumbers = numberRegex.test(content.replace(/[\s\.\-\(\)]/g, ''));
      const hasEmail = emailRegex.test(content);

      if (hasNumbers || hasEmail) {
        isBlocked = true;
        reason = "Compartilhamento de contatos não permitido antes do fechamento oficial.";
        // Ofusca o conteúdo bloqueado
        finalContent = content.replace(/[0-9]/g, '*').replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g, '[E-MAIL BLOQUEADO]');
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