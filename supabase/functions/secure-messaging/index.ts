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

    const { senderId, receiverId, content, contractId } = await req.json()

    // 1. Verificar estado do contrato
    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('status')
      .eq('id', contractId)
      .single()

    const isAccepted = contract?.status === 'ACCEPTED' || contract?.status === 'PAID' || contract?.status === 'COMPLETED';
    
    let finalContent = content;
    let isBlocked = false;
    let reason = "";

    if (!isAccepted) {
      // NORMALIZAÇÃO: Remove caracteres especiais e espaços para pegar escrita disfarçada
      const normalized = content.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9]/g, ""); // Remove tudo que não é letra ou número

      // REGEX PATTERNS
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

    // 2. Persistência com Auditoria
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

    console.log(`[secure-messaging] Message processed. Blocked: ${isBlocked}`);

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