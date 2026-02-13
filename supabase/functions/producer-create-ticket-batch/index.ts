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
      eventId, nomeLote, ticketType, preco, quantidade, inicioVendas, fimVendas, taxaPlataforma,
    } = await req.json();
    if (!eventId || !nomeLote || !ticketType || preco === undefined || !quantidade || !inicioVendas || !fimVendas) {
      throw new Error("Campos obrigatorios ausentes para lote.");
    }

    const { data: event, error: eventErr } = await supabase
      .from("producer_events")
      .select("id, producer_profile_id")
      .eq("id", eventId)
      .single();
    if (eventErr || !event) throw new Error("Evento nao encontrado.");
    if (event.producer_profile_id !== user.id) throw new Error("Apenas o produtor dono pode criar lotes.");

    const { data: batchId, error } = await supabase.rpc("create_ticket_batch", {
      p_event_id: eventId,
      p_nome_lote: nomeLote,
      p_ticket_type: ticketType,
      p_preco: Number(preco),
      p_quantidade: Number(quantidade),
      p_inicio: new Date(inicioVendas).toISOString(),
      p_fim: new Date(fimVendas).toISOString(),
      p_taxa: taxaPlataforma !== undefined ? Number(taxaPlataforma) : 10,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, batchId }), {
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
