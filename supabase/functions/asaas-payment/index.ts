import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLAN_FEES: Record<string, number> = {
  'free': 0.15,
  'pro': 0.10,
  'premium': 0.07,
  'elite': 0.02
};

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
    if (authError || !user) throw new Error("Não autorizado")

    const { contractId, paymentMethodId } = await req.json()

    // 1. Buscar Contrato e Dados do Artista
    const { data: contract, error: contractError } = await supabaseClient
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(*)')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) throw new Error("Contrato não encontrado.")
    if (contract.status === 'PAID') throw new Error("Este contrato já foi pago.")

    // 2. Calcular Split (Taxa DUSHOW vs Líquido Artista)
    const totalValue = Number(contract.value);
    const feePercentage = PLAN_FEES[contract.pro?.plan_tier || 'free'] || 0.15;
    const platformFee = totalValue * feePercentage;
    const artistNet = totalValue - platformFee;

    // 3. Buscar Token do Cartão
    const { data: card } = await supabaseClient.from('payment_methods').select('*').eq('id', paymentMethodId).single()
    if (!card) throw new Error("Método de pagamento inválido.")

    // --- AQUI ENTRARIA A CHAMADA REAL PARA O ASAAS ---
    // console.log(`[Asaas] Cobrando R$ ${totalValue} no cartão final ${card.last4}`);
    // ------------------------------------------------

    // 4. REGISTRO DE MOVIMENTAÇÃO (LEDGER) - CRÍTICO PARA VISIBILIDADE
    await supabaseClient.from('financial_ledger').insert([
      {
        contract_id: contractId,
        user_id: contract.client_id,
        amount: -totalValue,
        type: 'DEBIT',
        description: `Pagamento do evento: ${contract.event_name}`
      },
      {
        contract_id: contractId,
        user_id: contract.pro_id,
        amount: artistNet,
        type: 'CREDIT',
        description: `Cachê recebido (Líquido): ${contract.event_name}`
      }
    ]);

    // 5. Atualizar Saldo Pendente do Artista (Escrow)
    const { error: rpcError } = await supabaseClient.rpc('increment_pending_balance', { 
      user_id: contract.pro_id, 
      amount: artistNet 
    });
    if (rpcError) throw rpcError;

    // 6. Marcar Contrato como PAGO
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({ status: 'PAID' })
      .eq('id', contractId);
    
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, artistNet, platformFee }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error: any) {
    console.error("[asaas-payment] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})