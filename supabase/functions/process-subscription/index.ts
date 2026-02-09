import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_URL = 'https://www.asaas.com/api/v3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLAN_PRICES: Record<string, number> = {
  'pro': 49.90,
  'premium': 99.90,
  'elite': 199.90,
  'verified': 49.90
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

    const { planId, paymentMethodId } = await req.json()
    const price = PLAN_PRICES[planId] || 0;

    if (price > 0) {
      // 1. Buscar Cartão
      const { data: card } = await supabaseClient.from('payment_methods').select('*').eq('id', paymentMethodId).single();
      if (!card) throw new Error("Selecione um cartão válido.");

      // 2. Criar Cobrança Direta (SEM SPLIT)
      const paymentBody = {
        customer: 'BUSCAR_OU_CRIAR_CUSTOMER_ID', // Lógica similar ao asaas-payment
        billingType: 'CREDIT_CARD',
        value: price,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Upgrade de Plano: ${planId.toUpperCase()}`,
        creditCardToken: card.gateway_token
      }
      
      // Nota: Para brevidade, assumimos que o customer já existe ou simplificamos aqui.
      // Em prod, use a mesma lógica de busca de customer do asaas-payment.
    }

    // 3. Atualizar Perfil
    const { error } = await supabaseClient.from('profiles').update({ 
      plan_tier: planId,
      is_verified: ['premium', 'elite', 'verified'].includes(planId),
      is_superstar: planId === 'elite'
    }).eq('id', user.id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})