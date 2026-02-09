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

    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(*)')
      .eq('id', contractId)
      .single()

    if (!contract) throw new Error("Contrato não encontrado.")

    // 1. Calcular o que o artista vai receber (Líquido)
    const totalValue = Number(contract.value);
    const feePercentage = PLAN_FEES[contract.pro?.plan_tier || 'free'] || 0.15;
    const artistNet = totalValue * (1 - feePercentage);

    // 2. Buscar Cartão
    const { data: card } = await supabaseClient.from('payment_methods').select('*').eq('id', paymentMethodId).single()
    if (!card) throw new Error("Cartão não encontrado.")

    // 3. Criar Cobrança no Asaas (100% para DUSHOW - Sem Split agora)
    const paymentBody = {
      customer: 'CUSTOMER_ID_LOGIC', // Simplificado para o exemplo
      billingType: 'CREDIT_CARD',
      value: totalValue,
      dueDate: new Date().toISOString().split('T')[0],
      description: `Contratação: ${contract.event_name}`,
      creditCardToken: card.gateway_token
    }

    // Simulação de chamada Asaas (em prod use o fetch real)
    // const response = await fetch(`${ASAAS_URL}/payments`, ...)

    // 4. Atualizar Banco de Dados: Dinheiro entra no PENDENTE do artista
    await supabaseClient.rpc('increment_pending_balance', { 
      user_id: contract.pro_id, 
      amount: artistNet 
    });

    await supabaseClient.from('contracts').update({ status: 'PAID' }).eq('id', contractId)

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})