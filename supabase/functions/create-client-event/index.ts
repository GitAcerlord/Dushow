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

    const { name, eventDate, location } = await req.json();
    if (!name || !eventDate || !location) {
      throw new Error("name, eventDate e location sao obrigatorios.");
    }

    const { data: event, error } = await supabase
      .from("client_events")
      .insert({
        contratante_profile_id: user.id,
        name,
        event_date: new Date(eventDate).toISOString(),
        location,
        status: "PLANEJAMENTO",
      })
      .select()
      .single();
    if (error) throw error;

    return new Response(JSON.stringify(event), {
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
