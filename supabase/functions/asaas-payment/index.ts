import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sendEmailIfEnabled = async (
  supabase: any,
  profileId: string,
  subject: string,
  html: string,
) => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, pref_email_notifications")
      .eq("id", profileId)
      .single();
    if (!profile?.email || profile?.pref_email_notifications === false) return;

    const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "";
    if (!apiKey || !from) return;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [profile.email],
        subject,
        html,
      }),
    });
  } catch (_e) {}
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Nao autorizado.");

    const { contractId, paymentMethodId, paymentMethod } = await req.json();
    if (!contractId) throw new Error("contractId obrigatorio.");

    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();
    if (cErr || !contract) throw new Error("Contrato nao localizado.");
    if (contract.contratante_profile_id !== user.id) throw new Error("Apenas contratante pode pagar.");

    const currentStatus = String(contract.status_master || contract.status || "").toUpperCase();
    if (!["AGUARDANDO_PAGAMENTO", "ACEITO"].includes(currentStatus)) {
      throw new Error("Pagamento permitido apenas em AGUARDANDO_PAGAMENTO.");
    }

    const method = (paymentMethod || "CARD").toUpperCase();
    if (method !== "CARD") throw new Error("Apenas pagamento com cartao esta habilitado neste fluxo.");

    if (!paymentMethodId) throw new Error("paymentMethodId obrigatorio.");

    const { data: payerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, asaas_customer_id")
      .eq("id", user.id)
      .single();
    if (profileError || !payerProfile) throw new Error("Perfil do contratante nao localizado.");
    if (!payerProfile.asaas_customer_id) throw new Error("Conta Asaas do contratante nao configurada.");

    const { data: card, error: cardError } = await supabase
      .from("payment_methods")
      .select("id, gateway_token, last4, brand, exp_month, exp_year")
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)
      .single();
    if (cardError || !card) throw new Error("Cartao nao encontrado.");
    if (!card.gateway_token || !String(card.gateway_token).startsWith("asaas:")) {
      throw new Error("Cartao antigo ou invalido. Remova e cadastre novamente.");
    }
    const creditCardToken = String(card.gateway_token).replace("asaas:", "");

    const asaasApiKey = Deno.env.get("ASAAS_API_KEY") ?? "";
    const asaasBaseUrl = Deno.env.get("ASAAS_URL") ?? "https://api.asaas.com/v3";
    if (!asaasApiKey) throw new Error("ASAAS_API_KEY nao configurada.");

    const dueDate = new Date().toISOString().slice(0, 10);
    const total = Number(contract.valor_atual ?? contract.value ?? 0);
    const remoteIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const chargeResponse = await fetch(`${asaasBaseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": asaasApiKey,
      },
      body: JSON.stringify({
        customer: payerProfile.asaas_customer_id,
        billingType: "CREDIT_CARD",
        value: total,
        dueDate,
        description: `Pagamento contrato ${contract.id}`,
        externalReference: contract.id,
        creditCardToken,
        remoteIp,
      }),
    });

    const chargeData = await chargeResponse.json();
    if (!chargeResponse.ok) {
      throw new Error(chargeData?.errors?.[0]?.description || chargeData?.message || "Falha no pagamento via Asaas.");
    }

    const approvedStatuses = new Set(["RECEIVED", "CONFIRMED", "AUTHORIZED"]);
    if (!approvedStatuses.has(String(chargeData?.status || "").toUpperCase())) {
      throw new Error(`Pagamento nao aprovado no Asaas (status: ${chargeData?.status || "desconhecido"}).`);
    }

    // Aqui entra a cobranca real no gateway (Asaas/Stripe/Pagar.me)
    const { data: result, error: escrowError } = await supabase.rpc("execute_escrow_payment", {
      p_contract_id: contractId,
      p_actor_profile_id: user.id,
      p_payment_method: method,
    });
    if (escrowError) throw escrowError;

    const profAmount = Number(result?.professional_amount ?? 0);
    await supabase.from("wallet_transactions").insert([
      {
        profile_id: contract.contratante_profile_id,
        source_type: "CONTRACT",
        source_id: contract.id,
        type: "DEBIT",
        amount: -Math.abs(total),
        status: "COMPLETED",
        metadata: { action: "PAY_ESCROW", payment_method: method, asaas_payment_id: chargeData?.id ?? null },
      },
      {
        profile_id: contract.profissional_profile_id,
        source_type: "CONTRACT",
        source_id: contract.id,
        type: "HOLD",
        amount: Math.abs(profAmount),
        status: "HELD",
        metadata: { action: "ESCROW_HOLD", payment_method: method, asaas_payment_id: chargeData?.id ?? null },
      },
    ]);

    await supabase
      .from("contracts")
      .update({ asaas_payment_id: chargeData?.id ?? null, paid_at: new Date().toISOString() })
      .eq("id", contractId);

    await supabase.from("contract_history").insert({
      contract_id: contractId,
      action: "PAY_ESCROW",
      performed_by_profile_id: user.id,
      old_status: currentStatus,
      new_status: "PAGO_ESCROW",
      old_value: Number(contract.valor_atual ?? contract.value ?? 0),
      new_value: Number(contract.valor_atual ?? contract.value ?? 0),
      metadata: { gateway: "asaas", method, asaas_payment_id: chargeData?.id ?? null, escrow: result || null },
    });

    await sendEmailIfEnabled(
      supabase,
      contract.contratante_profile_id,
      "Pagamento confirmado",
      `<p>O pagamento do contrato <strong>${contract.event_name || contract.id}</strong> foi confirmado em escrow.</p>`,
    );
    await sendEmailIfEnabled(
      supabase,
      contract.profissional_profile_id,
      "Contrato pago em escrow",
      `<p>O contrato <strong>${contract.event_name || contract.id}</strong> foi pago e está em escrow.</p>`,
    );

    return new Response(JSON.stringify({ success: true, status_master: "PAGO_ESCROW", asaas_payment_id: chargeData?.id ?? null, escrow: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
