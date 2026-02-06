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

    const { contractId, action, userId, metadata } = await req.json()

    // 1. Buscar estado atual do contrato
    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) throw new Error("Contrato não localizado.")

    let nextStatus = contract.status;
    const currentStatus = contract.status;

    // 2. MÁQUINA DE ESTADOS - Validação de Transições
    switch (action) {
      case 'ACCEPT':
        if (currentStatus !== 'CREATED' && currentStatus !== 'PENDING') throw new Error("Transição inválida: Apenas contratos CREATED podem ser aceitos.");
        if (userId !== contract.pro_id) throw new Error("Não autorizado: Apenas o profissional pode aceitar.");
        nextStatus = 'ACCEPTED';
        break;

      case 'REJECT':
        if (currentStatus !== 'CREATED' && currentStatus !== 'PENDING') throw new Error("Transição inválida.");
        nextStatus = 'REJECTED';
        break;

      case 'SIGN':
        if (currentStatus !== 'ACCEPTED') throw new Error("Contrato precisa ser aceito antes de assinar.");
        // Lógica de assinatura digital (Hash)
        const signatureHash = crypto.randomUUID(); // Simplificado para o exemplo
        await supabaseClient.from('contracts').update({ 
          signature_hash: signatureHash,
          signed_by_pro: userId === contract.pro_id ? true : contract.signed_by_pro,
          signed_by_client: userId === contract.client_id ? true : contract.signed_by_client
        }).eq('id', contractId);
        
        nextStatus = 'PENDING_SIGNATURE';
        break;

      case 'COMPLETE':
        if (currentStatus !== 'PAID' && currentStatus !== 'PENDING_SIGNATURE') throw new Error("Apenas contratos pagos ou assinados podem ser concluídos.");
        nextStatus = 'COMPLETED';
        
        // 💰 LÓGICA FINANCEIRA (LEDGER)
        const gross = Number(contract.value);
        const feeRate = 0.15; // 15% padrão
        const platformFee = gross * feeRate;
        const artistNet = gross - platformFee;

        // Inserir no Ledger (Auditável)
        await supabaseClient.from('financial_ledger').insert([
          { contract_id: contractId, user_id: contract.client_id, amount: -gross, type: 'GROSS_PAYMENT', description: `Pagamento Evento: ${contract.event_name}` },
          { contract_id: contractId, user_id: contract.pro_id, amount: artist_net, type: 'ARTIST_NET', description: `Recebimento Líquido: ${contract.event_name}` },
          { contract_id: contractId, user_id: null, amount: platformFee, type: 'PLATFORM_FEE', description: `Comissão DUSHOW: ${contract.event_name}` }
        ]);

        // Atualizar XP do Artista
        const { data: proProfile } = await supabaseClient.from('profiles').select('xp_total').eq('id', contract.pro_id).single();
        await supabaseClient.from('profiles').update({ xp_total: (proProfile?.xp_total || 0) + 100 }).eq('id', contract.pro_id);
        break;

      default:
        throw new Error("Ação desconhecida.");
    }

    // 3. Persistência Real no Banco
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({ status: nextStatus })
      .eq('id', contractId);

    if (updateError) throw updateError;

    console.log(`[contract-state-machine] Success: ${contractId} | ${currentStatus} -> ${nextStatus}`);

    return new Response(JSON.stringify({ success: true, status: nextStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[contract-state-machine] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders
    })
  }
})