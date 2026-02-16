import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, { monthly: number; annualMonthly: number }> = {
  pro: { monthly: 49.9, annualMonthly: 39.9 },
  premium: { monthly: 99.9, annualMonthly: 79.9 },
  elite: { monthly: 199.9, annualMonthly: 159.9 },
  verified: { monthly: 49.9, annualMonthly: 39.9 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Nao autorizado.");

    const { planId, paymentMethodId, isAnnual } = await req.json();
    const config = PLAN_PRICES[planId] || null;
    const price = config ? (isAnnual ? Number((config.annualMonthly * 12).toFixed(2)) : config.monthly) : 0;
    let asaasPaymentId: string | null = null;

    if (price > 0) {
      if (!paymentMethodId) throw new Error("Metodo de pagamento obrigatorio para planos pagos.");

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id, asaas_customer_id")
        .eq("id", user.id)
        .single();
      if (profileError || !profile) throw new Error("Perfil nao localizado.");
      if (!profile.asaas_customer_id) throw new Error("Conta Asaas nao configurada para este usuario.");

      const { data: card, error: cardError } = await supabaseClient
        .from("payment_methods")
        .select("id, gateway_token")
        .eq("id", paymentMethodId)
        .eq("user_id", user.id)
        .single();
      if (cardError || !card) throw new Error("Cartao invalido ou nao localizado.");
      if (!card.gateway_token || !String(card.gateway_token).startsWith("asaas:")) {
        throw new Error("Cartao antigo ou invalido. Remova e cadastre novamente.");
      }
      const creditCardToken = String(card.gateway_token).replace("asaas:", "");

      const asaasApiKey = Deno.env.get("ASAAS_API_KEY") ?? "";
      const asaasBaseUrl = Deno.env.get("ASAAS_URL") ?? "https://api.asaas.com/v3";
      if (!asaasApiKey) throw new Error("ASAAS_API_KEY nao configurada.");

      const dueDate = new Date().toISOString().slice(0, 10);
      const remoteIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      const externalReference = `plan-${user.id}-${planId}-${Date.now()}`;

      const chargeResponse = await fetch(`${asaasBaseUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: asaasApiKey,
        },
        body: JSON.stringify({
          customer: profile.asaas_customer_id,
          billingType: "CREDIT_CARD",
          value: price,
          dueDate,
          description: `Assinatura plano ${planId} (${isAnnual ? "anual" : "mensal"})`,
          externalReference,
          creditCardToken,
          remoteIp,
        }),
      });

      const chargeData = await chargeResponse.json();
      if (!chargeResponse.ok) {
        throw new Error(chargeData?.errors?.[0]?.description || chargeData?.message || "Falha no pagamento do plano.");
      }

      const approvedStatuses = new Set(["RECEIVED", "CONFIRMED", "AUTHORIZED"]);
      if (!approvedStatuses.has(String(chargeData?.status || "").toUpperCase())) {
        throw new Error(`Pagamento do plano nao aprovado (status: ${chargeData?.status || "desconhecido"}).`);
      }

      asaasPaymentId = chargeData?.id ?? null;
    }

    const { error: profileUpdateError } = await supabaseClient
      .from("profiles")
      .update({
        plan_tier: planId,
        is_verified: ["premium", "elite", "verified"].includes(planId),
        is_superstar: planId === "elite",
      })
      .eq("id", user.id);
    if (profileUpdateError) throw profileUpdateError;

    if (price > 0) {
      await supabaseClient.from("wallet_transactions").insert({
        profile_id: user.id,
        source_type: "PLAN",
        source_id: null,
        type: "DEBIT",
        amount: -Math.abs(price),
        status: "COMPLETED",
        metadata: {
          action: "PLAN_SUBSCRIPTION",
          plan_id: planId,
          billing_cycle: isAnnual ? "ANNUAL" : "MONTHLY",
          asaas_payment_id: asaasPaymentId,
        },
      });
    }

    return new Response(JSON.stringify({ success: true, asaas_payment_id: asaasPaymentId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});
