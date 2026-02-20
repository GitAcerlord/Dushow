import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { contractId, role } = await req.json();
    const userId = user.id;

    const { data: contract, error: fetchError } = await supabaseClient
      .from("contracts")
      .select("id, event_name, value, event_date, contratante_profile_id, profissional_profile_id, client_id, pro_id")
      .eq("id", contractId)
      .single();

    if (fetchError || !contract) throw new Error("Contrato nao localizado.");
    const clientId = contract.contratante_profile_id || contract.client_id;
    const proId = contract.profissional_profile_id || contract.pro_id;
    if (clientId !== userId && proId !== userId) throw new Error("Acesso negado.");

    const metadata = {
      ip: req.headers.get("x-real-ip") || "unknown",
      userAgent: req.headers.get("user-agent"),
      timestamp: new Date().toISOString(),
      auth_id: userId,
    };

    const rawContent = `${contract.id}|${contract.event_name}|${contract.value}|${contract.event_date}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawContent);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const updateData: any = { signature_hash: hashHex };
    if (String(role || "").toUpperCase() === "CLIENT") {
      updateData.signed_by_client = true;
      updateData.signed_at_client = metadata.timestamp;
    } else {
      updateData.signed_by_pro = true;
      updateData.signed_at_pro = metadata.timestamp;
    }

    const { error: updateError } = await supabaseClient
      .from("contracts")
      .update(updateData)
      .eq("id", contractId);
    if (updateError) throw updateError;

    const { data: transition, error: transitionError } = await supabaseClient.rpc("apply_contract_transition", {
      p_contract_id: contractId,
      p_actor_profile_id: userId,
      p_action: "SIGN",
      p_metadata: {
        source: "digital-signature",
        role: String(role || "").toUpperCase(),
      },
    });
    if (transitionError) throw transitionError;

    return new Response(JSON.stringify({ success: true, hash: hashHex, transition }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
