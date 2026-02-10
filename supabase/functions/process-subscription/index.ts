import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
      // SECURITY: Verify payment before updating profile
      if (!paymentMethodId) throw new Error("Método de pagamento obrigatório para planos pagos.");
      
      // 1. Fetch Card Token
      const { data: card } = await supabaseClient
        .from('payment_methods')
        .select('*')
        .eq('id', paymentMethodId)
        .eq('user_id', user.id) // Ensure card belongs to user
        .single();

      if (!card) throw new Error("Cartão inválido ou não localizado.");

      // 2. SIMULATED GATEWAY CALL (Asaas/Stripe)
      console.log(`[process-subscription] Processing payment of R$ ${price} for user ${user.id} using token ${card.gateway_token}`);
      
      // In production, you would call the gateway API here and verify the response.
      const paymentSuccessful = true; 
      if (!paymentSuccessful) throw new Error("Falha no processamento do pagamento.");
    }

    // 3. Update Profile using service_role to bypass RLS/Triggers
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