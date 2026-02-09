import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_WALLET_ID = Deno.env.get('ASAAS_WALLET_ID') // ID da sua carteira para receber a comissão
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

    // 1. Buscar dados do contrato e do profissional
    const { data: contract, error: cError } = await supabaseClient
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(*)')
      .eq('id', contractId)
      .single()

    if (cError || !contract) throw new Error("Contrato não encontrado.")

    // 2. Calcular taxa
    const planTier = contract.pro?.plan_tier || 'free';
    const feePercentage = PLAN_FEES[planTier] || 0.15;
    const platformFee = Number(contract.value) * feePercentage;

    // 3. Buscar cartão
    const { data: card } = await supabaseClient
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .single()

    if (!card) throw new Error("Cartão não encontrado.")

    // 4. Criar/Buscar Cliente no Asaas
    const customerResponse = await fetch(`${ASAAS_URL}/customers?email=${user.email}`, {
      headers: { 'access_token': ASAAS_API_KEY! }
    })
    const customers = await customerResponse.json()
    let asaasCustomerId = customers.data?.[0]?.id

    if (!asaasCustomerId) {
      const newCust = await fetch(`${ASAAS_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY! },
        body: JSON.stringify({ 
          name: user.user_metadata.full_name || user.email, 
          email: user.email,
          externalReference: user.id
        })
      })
      const custData = await newCust.json()
      if (custData.errors) throw new Error(`Erro ao criar cliente Asaas: ${custData.errors[0].description}`)
      asaasCustomerId = custData.id
    }

    // 5. Criar Pagamento
    const paymentBody: any = {
      customer: asaasCustomerId,
      billingType: 'CREDIT_CARD',
      value: contract.value,
      dueDate: new Date().toISOString().split('T')[0],
      description: `Contratação DUSHOW: ${contract.event_name}`,
      externalReference: contract.id,
      creditCardToken: card.gateway_token
    }

    // Adicionar split apenas se o Wallet ID estiver configurado
    if (ASAAS_WALLET_ID && ASAAS_WALLET_ID !== 'PLATFORM_WALLET_ID') {
      paymentBody.split = [{
        walletId: ASAAS_WALLET_ID,
        fixedValue: platformFee,
        description: `Comissão DUSHOW (${(feePercentage * 100).toFixed(0)}%)`
      }]
    }

    console.log("[asaas-payment] Enviando cobrança:", JSON.stringify(paymentBody));

    const response = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY! },
      body: JSON.stringify(paymentBody)
    })

    const paymentData = await response.json()
    
    if (paymentData.errors) {
      console.error("[asaas-payment] Erro da API Asaas:", paymentData.errors);
      throw new Error(paymentData.errors[0].description);
    }

    // 6. Sucesso: Atualizar contrato e registrar no ledger
    await supabaseClient.from('contracts').update({ status: 'PAID' }).eq('id', contractId)
    
    return new Response(JSON.stringify({ success: true, paymentId: paymentData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[asaas-payment] Erro Crítico:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})