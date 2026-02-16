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

    const { content, imageUrl } = await req.json();
    const normalizedContent = String(content || "").trim();
    if (!normalizedContent) throw new Error("Conteudo obrigatorio.");

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        content: normalizedContent,
        image_url: imageUrl || null,
      })
      .select()
      .single();
    if (postError || !post) throw postError || new Error("Falha ao criar post.");

    // Fallback de XP para ambientes sem trigger atualizada.
    const { data: existingXp, error: xpCheckError } = await supabase
      .from("xp_transactions")
      .select("id")
      .eq("profile_id", user.id)
      .eq("post_id", post.id)
      .eq("action", "POST_CREATED")
      .limit(1);
    if (xpCheckError) throw xpCheckError;

    if ((existingXp || []).length === 0) {
      const points = imageUrl ? 7 : 2;
      const { error: xpInsertError } = await supabase.from("xp_transactions").insert({
        profile_id: user.id,
        action: "POST_CREATED",
        points,
        post_id: post.id,
      });
      if (xpInsertError) throw xpInsertError;
    }

    return new Response(JSON.stringify({ success: true, post }), {
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
