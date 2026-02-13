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

    const {
      contractId, nome, descricao, dataInicio, dataFim, local, capacidade,
    } = await req.json();
    if (!contractId || !nome || !dataInicio || !dataFim || !local || !capacidade) {
      throw new Error("Campos obrigatorios ausentes para ativar bilheteria.");
    }

    const { data: eventId, error } = await supabase.rpc("activate_ticketing_for_contract", {
      p_contract_id: contractId,
      p_producer_profile_id: user.id,
      p_nome: nome,
      p_descricao: descricao ?? null,
      p_data_inicio: new Date(dataInicio).toISOString(),
      p_data_fim: new Date(dataFim).toISOString(),
      p_local: local,
      p_capacidade: Number(capacidade),
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, eventId }), {
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
