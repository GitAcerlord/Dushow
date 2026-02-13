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

    const { artistId } = await req.json();
    if (!artistId) throw new Error("artistId e obrigatorio.");
    if (artistId === user.id) throw new Error("Nao e permitido favoritar o proprio perfil.");

    const { data: exists } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("artist_id", artistId)
      .limit(1);

    if (exists && exists.length > 0) {
      const { error: delErr } = await supabase.from("favorites").delete().eq("id", exists[0].id);
      if (delErr) throw delErr;
      return new Response(JSON.stringify({ favorited: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insErr } = await supabase.from("favorites").insert({
      user_id: user.id,
      artist_id: artistId,
    });
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ favorited: true }), {
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
