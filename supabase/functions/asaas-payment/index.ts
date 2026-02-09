import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_URL = 'https://www.asaas.com/api/v3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de taxas por plano
const PLAN_FEES: Record<string, number> = {
  'free': 0.15,    // 15%
  'pro': 0.10,     // 10%
  'premium': 0.07, // 7%
  'elite': 0.02    // 2%
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

    // 1. Buscar dados do contrato e do perfil do profissional (para ver o plano)
    const { data: contract, error: cError } = await supabaseClient
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(*)')
      .eq('id', contractId)
      .single()

    if (cError || !contract) throw new Error("Contrato não encontrado.")

    // 2. Calcular taxa baseada no plano do profissional
    const planTier = contract.pro?.plan_tier || 'free';
    const feePercentage = PLAN_FEES[planTier] || 0.15;
    const platformFee = Number(contract.value) * feePercentage;

    // 3. Buscar token do cartão
    const { data: card } = await supabaseClient
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .single()

    if (!card) throw new Error("Método de pagamento inválido.")

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
        body: JSON.stringify({ name: user.user_metadata.full_name, email: user.email })
      })
      const custData = await newCust.json()
      asaasCustomerId = custData.id
    }

    // 5. Criar Pagamento com SPLIT DINÂMICO
    const paymentBody = {
      customer: asaasCustomerId,
      billingType: 'CREDIT_CARD',
      value: contract.value,
      dueDate: new Date().toISOString().split('T')[0],
      description: `Contratação DUSHOW: ${contract.event_name}`,
      externalReference: contract.id,
      creditCardToken: card.gateway_token,
      split: [
        {
          walletId: 'PLATFORM_WALLET_ID', // ID da carteira master da DUSHOW no Asaas
          fixedValue: platformFee,
          description: `Taxa de Intermediação (${(feePercentage * 100).toFixed(0)}% - Plano ${planTier.toUpperCase()})`
        }
      ]
    }

    const response = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY! },
      body: JSON.stringify(paymentBody)
    })

    const paymentData = await response.json()
    if (paymentData.errors) throw new Error(paymentData.errors[0].description)

    // 6. Atualizar contrato para PAID
    await supabaseClient.from('contracts').update({ status: 'PAID' }).eq('id', contractId)

    return new Response(JSON.stringify({ success: true, paymentId: paymentData.id, feeApplied: feePercentage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[asaas-payment] Erro:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})