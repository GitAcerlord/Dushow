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

    const { eventId, batchId, quantity, paymentMethod, affiliateCode } = await req.json();
    if (!eventId || !batchId || !quantity || !paymentMethod) {
      throw new Error("eventId, batchId, quantity e paymentMethod sao obrigatorios.");
    }

    // Aqui entraria cobranca real em gateway; no MVP a compra aprovada segue para escrow contabil.
    const { data: purchase, error } = await supabase.rpc("purchase_ticket_escrow", {
      p_user_id: user.id,
      p_event_id: eventId,
      p_batch_id: batchId,
      p_quantity: Number(quantity),
      p_payment_method: String(paymentMethod).toUpperCase(),
      p_affiliate_code: affiliateCode ?? null,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, purchase }), {
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
