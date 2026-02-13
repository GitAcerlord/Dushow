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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Nao autorizado.");

    const {
      contractId,
      proId,
      comment,
      punctuality,
      quality,
      professionalism,
      communication,
    } = await req.json();
    if (!contractId || !proId) throw new Error("contractId e proId sao obrigatorios.");

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, status, contratante_profile_id, profissional_profile_id")
      .eq("id", contractId)
      .single();
    if (contractError || !contract) throw new Error("Contrato nao encontrado.");
    if (contract.status !== "CONCLUIDO") throw new Error("Avaliacao so e permitida com contrato CONCLUIDO.");
    if (contract.contratante_profile_id !== user.id) throw new Error("Somente o contratante pode avaliar.");
    if (contract.profissional_profile_id !== proId) throw new Error("Profissional invalido para o contrato.");

    const safe = (v: unknown) => Math.max(1, Math.min(5, Number(v || 0)));
    const p = safe(punctuality);
    const q = safe(quality);
    const pr = safe(professionalism);
    const c = safe(communication);
    const rating = Number(((p + q + pr + c) / 4).toFixed(1));

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("contract_id", contractId)
      .eq("client_id", user.id)
      .limit(1);
    if (existing && existing.length > 0) throw new Error("Este contrato ja possui avaliacao registrada.");

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        contract_id: contractId,
        client_id: user.id,
        pro_id: proId,
        comment: comment ?? null,
        rating,
        punctuality: p,
        quality: q,
        professionalism: pr,
        communication: c,
      })
      .select()
      .single();
    if (reviewError) throw reviewError;

    return new Response(JSON.stringify(review), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
