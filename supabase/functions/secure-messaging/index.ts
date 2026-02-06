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

    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('status, client_id, pro_id')
      .eq('id', contractId)
      .single()

    if (!contract || (contract.client_id !== senderId && contract.pro_id !== senderId)) {
      throw new Error("Acesso negado ao chat deste contrato.")
    }

    const isAccepted = contract?.status === 'ACCEPTED' || contract?.status === 'PAID' || contract?.status === 'COMPLETED';
    
    let finalContent = content;
    let isBlocked = false;
    let reason = "";

    if (!isAccepted) {
      const normalized = content.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

      const patterns = {
        phone: /(\d{2,4}[-.\s]?\d{4,5}[-.\s]?\d{4})|(\d{10,11})/,
        email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
        links: /(https?:\/\/|www\.)[^\s]+/,
        disguised: /(zap|wpp|whats|contato|meu numero|me chama|insta|@|arroba|ponto com|com br|nove nove|oito oito)/i
      };

      const hasPhone = patterns.phone.test(content) || /(\d{1}.*?){10,}/.test(content);
      const hasEmail = patterns.email.test(content);
      const hasLinks = patterns.links.test(content);
      const hasDisguised = patterns.disguised.test(content) || /([0-9].*?){8,}/.test(normalized);

      if (hasPhone || hasEmail || hasLinks || hasDisguised) {
        isBlocked = true;
        reason = "Tentativa de bypass detectada (contato externo).";
        finalContent = "🚫 Por segurança, dados de contato só podem ser enviados após a proposta ser aceita.";
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