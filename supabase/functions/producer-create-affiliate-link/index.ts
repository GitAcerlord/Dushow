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

    const { eventId, affiliateProfileId, commissionRate } = await req.json();
    if (!eventId || !affiliateProfileId) throw new Error("eventId e affiliateProfileId sao obrigatorios.");

    const { data: event, error: eventErr } = await supabase
      .from("producer_events")
      .select("id, producer_profile_id")
      .eq("id", eventId)
      .single();
    if (eventErr || !event) throw new Error("Evento nao encontrado.");
    if (event.producer_profile_id !== user.id) throw new Error("Apenas produtor dono pode criar link de afiliado.");

    const code = `AF-${eventId.slice(0, 6).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const { data, error } = await supabase
      .from("affiliate_links")
      .insert({
        event_id: eventId,
        affiliate_profile_id: affiliateProfileId,
        commission_rate: Number(commissionRate ?? 5),
        code,
      })
      .select()
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, link: data }), {
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
