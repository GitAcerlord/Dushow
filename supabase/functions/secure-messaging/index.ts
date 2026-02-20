import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const phoneRegex = /(\d[\s().-]*){8,}/;
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const blockedKeywords = ["whatsapp", "pix", "chama no insta", "direto", "fora da plataforma", "por fora"];

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
    // Nao interrompe envio de mensagem.
  }
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { receiverId, content, contractId } = await req.json();
    if (!receiverId || !content || !contractId) throw new Error("receiverId, content and contractId are required.");

    const { data: senderProfile, error: senderError } = await supabase
      .from("profiles")
      .select("id, messaging_warnings, messaging_blocked_until")
      .eq("id", user.id)
      .single();
    if (senderError || !senderProfile) throw new Error("Sender profile not found.");

    if (senderProfile.messaging_blocked_until && new Date(senderProfile.messaging_blocked_until) > new Date()) {
      throw new Error("Envio bloqueado temporariamente por tentativa de negociacao fora da plataforma.");
    }

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, event_name, status, contratante_profile_id, profissional_profile_id")
      .eq("id", contractId)
      .single();
    if (contractError || !contract) throw new Error("Contrato nao encontrado.");

    const isParticipant = [contract.contratante_profile_id, contract.profissional_profile_id].includes(user.id)
      && [contract.contratante_profile_id, contract.profissional_profile_id].includes(receiverId);
    if (!isParticipant) throw new Error("Somente participantes do contrato podem conversar.");

    const allowedStatuses = ["PROPOSTO", "PROPOSTA_ENVIADA", "CONTRAPROPOSTA", "ACEITO", "AGUARDANDO_PAGAMENTO", "PAGO_ESCROW", "EM_EXECUCAO", "CONCLUIDO", "LIBERADO_FINANCEIRO"];
    if (!allowedStatuses.includes(contract.status)) {
      throw new Error("Conversa so inicia com proposta enviada ou interesse confirmado.");
    }

    const lower = String(content).toLowerCase();
    const hasBypass =
      phoneRegex.test(content) ||
      emailRegex.test(content) ||
      blockedKeywords.some((keyword) => lower.includes(keyword));

    let finalContent = String(content);
    let isBlocked = false;
    let reason: string | null = null;

    if (hasBypass) {
      isBlocked = true;
      reason = "Bloqueio de seguranca: contato externo/negociacao fora detectado.";
      finalContent = finalContent.replace(/[0-9]/g, "*").replace(/@/g, "[at]");

      const warnings = Number(senderProfile.messaging_warnings ?? 0) + 1;
      const patch: Record<string, unknown> = { messaging_warnings: warnings };
      if (warnings >= 2) {
        patch.messaging_blocked_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }
      await supabase.from("profiles").update(patch).eq("id", user.id);
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        contract_id: contractId,
        content: finalContent,
        is_blocked: isBlocked,
        block_reason: reason,
        original_content_hidden: isBlocked ? content : null,
      })
      .select()
      .single();
    if (error) throw error;

    await pushNotification(
      supabase,
      receiverId,
      "Nova mensagem",
      `Voce recebeu uma nova mensagem em ${contract.event_name || "um contrato ativo"}.`,
      "MESSAGE",
      "/app/messages",
    );

    return new Response(JSON.stringify(data), {
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
