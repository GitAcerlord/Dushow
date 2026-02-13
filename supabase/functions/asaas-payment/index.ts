import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { contractId, paymentMethod } = await req.json();
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
    if (!["CARD", "PIX"].includes(method)) throw new Error("Metodo de pagamento invalido.");

    // Aqui entra a cobranca real no gateway (Asaas/Stripe/Pagar.me)
    const { data: result, error: escrowError } = await supabase.rpc("execute_escrow_payment", {
      p_contract_id: contractId,
      p_actor_profile_id: user.id,
      p_payment_method: method,
    });
    if (escrowError) throw escrowError;

    const total = Number(contract.valor_atual ?? contract.value ?? 0);
    const profAmount = Number(result?.professional_amount ?? 0);
    await supabase.from("wallet_transactions").insert([
      {
        profile_id: contract.contratante_profile_id,
        source_type: "CONTRACT",
        source_id: contract.id,
        type: "DEBIT",
        amount: -Math.abs(total),
        status: "COMPLETED",
        metadata: { action: "PAY_ESCROW", payment_method: method },
      },
      {
        profile_id: contract.profissional_profile_id,
        source_type: "CONTRACT",
        source_id: contract.id,
        type: "HOLD",
        amount: Math.abs(profAmount),
        status: "HELD",
        metadata: { action: "ESCROW_HOLD", payment_method: method },
      },
    ]);

    await supabase.from("contract_history").insert({
      contract_id: contractId,
      action: "PAY_ESCROW",
      performed_by_profile_id: user.id,
      old_status: currentStatus,
      new_status: "PAGO_ESCROW",
      old_value: Number(contract.valor_atual ?? contract.value ?? 0),
      new_value: Number(contract.valor_atual ?? contract.value ?? 0),
      metadata: { gateway: "asaas", method, escrow: result || null },
    });

    return new Response(JSON.stringify({ success: true, status_master: "PAGO_ESCROW", escrow: result }), {
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
