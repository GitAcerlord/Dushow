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
  } catch (_e) {
    // sem impacto no fluxo principal
  }
};

const pushNotification = async (
  supabase: any,
  userId: string,
  title: string,
  content: string,
  type: string,
  link: string,
) => {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      content,
      type,
      link,
      is_read: false,
      read_at: null,
    });
  } catch (_e) {
    // sem impacto no fluxo principal
  }
};

type Action =
  | "ACCEPT"
  | "REJECT"
  | "COUNTER_PROPOSAL"
  | "APPROVE_COUNTER"
  | "SIGN"
  | "PAY"
  | "START_EXECUTION"
  | "CONFIRM_COMPLETION"
  | "RELEASE"
  | "CANCEL"
  | "OPEN_MEDIATION"
  | "RESOLVE_MEDIATION_RELEASE";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Nao autorizado.");

    const {
      contractId,
      action,
      newValue,
      paymentMethod,
      metadata,
    } = await req.json() as {
      contractId: string;
      action: Action;
      newValue?: number;
      paymentMethod?: string;
      metadata?: Record<string, unknown>;
    };

    if (!contractId || !action) throw new Error("contractId e action sao obrigatorios.");

    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();
    if (cErr || !contract) throw new Error("Contrato nao encontrado.");

    const clientId = contract.contratante_profile_id || contract.client_id;
    const proId = contract.profissional_profile_id || contract.pro_id;
    if (!clientId || !proId) throw new Error("Contrato sem participantes validos.");

    const canonicalAction =
      action === "APPROVE_COUNTER" ? "ACCEPT"
      : action === "OPEN_MEDIATION" ? "CANCEL"
      : action === "RESOLVE_MEDIATION_RELEASE" ? "RELEASE"
      : action;

    const { data: transition, error: transitionError } = await supabase.rpc("apply_contract_transition", {
      p_contract_id: contractId,
      p_actor_profile_id: user.id,
      p_action: canonicalAction,
      p_new_value: typeof newValue === "number" ? newValue : null,
      p_payment_method: paymentMethod || null,
      p_metadata: {
        source: "contract-state-machine",
        ...(metadata || {}),
      },
    });
    if (transitionError) throw transitionError;

    const nextStatus = String(transition?.new_status || "");
    if (nextStatus) {
      const subject = `Contrato atualizado: ${nextStatus}`;
      const html = `<p>O contrato <strong>${contract.event_name || contract.id}</strong> mudou para <strong>${nextStatus}</strong>.</p>`;

      await sendEmailIfEnabled(supabase, clientId, subject, html);
      await sendEmailIfEnabled(supabase, proId, subject, html);

      const title = "Atualizacao de contrato";
      const content = `O contrato "${contract.event_name || contract.id}" mudou para ${nextStatus}.`;
      const link = `/app/contracts/${contractId}`;
      await pushNotification(supabase, clientId, title, content, "CONTRACT_STATUS", link);
      await pushNotification(supabase, proId, title, content, "CONTRACT_STATUS", link);
    }

    return new Response(JSON.stringify({ success: true, transition }), {
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
