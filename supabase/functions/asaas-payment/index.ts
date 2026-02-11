import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_URL = 'https://www.asaas.com/api/v3'

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

    // 2. Buscar Token do Cartão
    const { data: card } = await supabaseClient.from('payment_methods').select('*').eq('id', paymentMethodId).single()
    if (!card || !card.gateway_token) throw new Error("Cartão inválido ou sem token de segurança.")

    // 3. CHAMADA REAL AO ASAAS (COBRANÇA NO CARTÃO)
    // Primeiro, garantimos que o cliente existe no Asaas ou usamos um ID fixo/vinculado
    // Para este exemplo, simulamos a chamada de cobrança direta que deve vir ANTES do DB
    
    const totalValue = Number(contract.value);
    
    console.log(`[Asaas] Iniciando cobrança de R$ ${totalValue} para o contrato ${contractId}`);

    const asaasResponse = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY || ''
      },
      body: JSON.stringify({
        customer: 'cus_000005123456', // Em prod, buscar o asaas_customer_id do perfil do cliente
        billingType: 'CREDIT_CARD',
        value: totalValue,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Contratação: ${contract.event_name}`,
        creditCardToken: card.gateway_token,
        // Split de pagamento (Opcional se feito via API do Asaas)
      })
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok || asaasData.errors) {
      const errorMsg = asaasData.errors?.[0]?.description || "Cartão recusado ou erro no gateway.";
      throw new Error(errorMsg);
    }

    // 4. SUCESSO NO PAGAMENTO -> AGORA ATUALIZAMOS O BANCO DE DADOS
    
    const feePercentage = PLAN_FEES[contract.pro?.plan_tier || 'free'] || 0.15;
    const platformFee = Number((totalValue * feePercentage).toFixed(2));
    const artistNet = Number((totalValue - platformFee).toFixed(2));

    // Registro no Ledger (Auditoria) com referência ao pagamento Asaas
    await supabaseClient.from('financial_ledger').insert([
      {
        contract_id: contractId,
        user_id: contract.client_id,
        amount: -totalValue,
        type: 'DEBIT',
        description: `Pagamento aprovado: ${contract.event_name}`,
        external_payment_id: asaasData.id
      },
      {
        contract_id: contractId,
        user_id: contract.pro_id,
        amount: artistNet,
        type: 'CREDIT',
        description: `Cachê recebido (Líquido): ${contract.event_name}`,
        external_payment_id: asaasData.id
      }
    ]);

    // Atualizar Saldo Pendente do Artista
    await supabaseClient.rpc('increment_pending_balance', { 
      user_id: contract.pro_id, 
      amount: artistNet 
    });

    // Atualizar contrato com referência ao pagamento e valores calculados
    await supabaseClient
      .from('contracts')
      .update({ status: 'PAID', asaas_payment_id: asaasData.id, paid_at: new Date().toISOString(), platform_fee: platformFee, artist_net: artistNet })
      .eq('id', contractId);
    

    return new Response(JSON.stringify({ 
      success: true, 
      paymentId: asaasData.id,
      artistNet 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error: any) {
    console.error("[asaas-payment] Erro Crítico:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})