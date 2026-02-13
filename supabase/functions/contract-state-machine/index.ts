import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | "ACCEPT"
  | "REJECT"
  | "COUNTER_PROPOSAL"
  | "APPROVE_COUNTER"
  | "PAY"
  | "START_EXECUTION"
  | "CONFIRM_COMPLETION"
  | "OPEN_MEDIATION"
  | "RESOLVE_MEDIATION_RELEASE"
  | "CANCEL";

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

    const { contractId, action, newValue } = await req.json() as { contractId: string; action: Action; newValue?: number };
    if (!contractId || !action) throw new Error("contractId e action sao obrigatorios.");

    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();
    if (cErr || !contract) throw new Error("Contrato nao encontrado.");

    const isClient = contract.contratante_profile_id === user.id;
    const isPro = contract.profissional_profile_id === user.id;
    const isParticipant = isClient || isPro;
    const oldStatus = String(contract.status_master || contract.status || "").toUpperCase();

    const assert = (condition: boolean, message: string) => {
      if (!condition) throw new Error(message);
    };

    let nextStatus = oldStatus;
    let nextValue = Number(contract.valor_atual ?? 0);

    switch (action) {
      case "ACCEPT":
        assert(isPro, "Apenas profissional pode aceitar.");
        assert(["PROPOSTO", "PROPOSTA_ENVIADA", "CONTRAPROPOSTA"].includes(oldStatus), "Transicao invalida.");
        nextStatus = "AGUARDANDO_PAGAMENTO";
        break;
      case "REJECT":
        assert(isPro, "Apenas profissional pode rejeitar.");
        assert(["PROPOSTO", "PROPOSTA_ENVIADA", "CONTRAPROPOSTA"].includes(oldStatus), "Transicao invalida.");
        nextStatus = "CANCELADO";
        break;
      case "COUNTER_PROPOSAL":
        assert(isClient, "Apenas contratante pode contrapropor valor.");
        assert(["PROPOSTO", "PROPOSTA_ENVIADA", "CONTRAPROPOSTA"].includes(oldStatus), "Transicao invalida.");
        assert(typeof newValue === "number" && newValue > 0, "Novo valor invalido.");
        nextStatus = "CONTRAPROPOSTA";
        nextValue = newValue;
        break;
      case "APPROVE_COUNTER":
        assert(isPro, "Apenas profissional pode aprovar contraproposta do contratante.");
        assert(oldStatus === "CONTRAPROPOSTA", "Transicao invalida.");
        nextStatus = "AGUARDANDO_PAGAMENTO";
        break;
      case "PAY":
        assert(isClient, "Apenas contratante pode pagar.");
        assert(["AGUARDANDO_PAGAMENTO", "ACEITO"].includes(oldStatus), "Pagamento so ocorre em AGUARDANDO_PAGAMENTO.");
        await supabase.rpc("execute_escrow_payment", {
          p_contract_id: contractId,
          p_actor_profile_id: user.id,
          p_payment_method: "CARD",
        });
        nextStatus = "PAGO_ESCROW";
        break;
      case "START_EXECUTION":
        assert(isParticipant, "Participante invalido.");
        await supabase.rpc("mark_contract_in_execution", { p_contract_id: contractId, p_actor: user.id });
        nextStatus = "EM_EXECUCAO";
        break;
      case "CONFIRM_COMPLETION":
        assert(isParticipant, "Participante invalido.");
        await supabase.rpc("confirm_contract_completion", { p_contract_id: contractId, p_actor: user.id });
        nextStatus = isClient ? "LIBERADO_FINANCEIRO" : "CONCLUIDO";
        break;
      case "OPEN_MEDIATION":
        assert(isParticipant, "Participante invalido.");
        nextStatus = "EM_MEDIACAO";
        break;
      case "RESOLVE_MEDIATION_RELEASE":
        assert(isParticipant, "Participante invalido.");
        await supabase.rpc("release_contract_funds", { p_contract_id: contractId, p_reason: "MEDIATION_ADMIN" });
        nextStatus = "LIBERADO_FINANCEIRO";
        break;
      case "CANCEL":
        assert(isParticipant, "Participante invalido.");
        await supabase.rpc("process_contract_cancellation", { p_contract_id: contractId, p_actor: user.id });
        nextStatus = "CANCELADO";
        break;
      default:
        throw new Error("Acao invalida.");
    }

    if (!["PAY", "START_EXECUTION", "CONFIRM_COMPLETION", "RESOLVE_MEDIATION_RELEASE", "CANCEL"].includes(action)) {
      const { error: uErr } = await supabase.from("contracts").update({
        status_master: nextStatus,
        status: nextStatus,
        status_v1: nextStatus === "PROPOSTO" ? "PROPOSTA_ENVIADA" : nextStatus,
        valor_atual: nextValue,
        value: nextValue,
        ...(nextStatus === "EM_MEDIACAO" ? { disputed_at: new Date().toISOString() } : {}),
      }).eq("id", contractId);
      if (uErr) throw uErr;
    }

    await supabase.from("contract_history").insert({
      contract_id: contractId,
      action,
      performed_by_profile_id: user.id,
      old_status: oldStatus,
      new_status: nextStatus,
      old_value: Number(contract.valor_atual ?? 0),
      new_value: nextValue,
      metadata: { source: "contract-state-machine-master" },
    });

    return new Response(JSON.stringify({ success: true, status_master: nextStatus, value: nextValue }), {
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
