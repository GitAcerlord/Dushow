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

    const { postId } = await req.json();
    if (!postId) throw new Error("postId obrigatorio.");

    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, author_id, image_url")
      .eq("id", postId)
      .single();
    if (fetchError || !post) throw new Error("Post nao encontrado.");
    if (post.author_id !== user.id) throw new Error("Permissao negada.");

    const { data: xpRows, error: xpError } = await supabase
      .from("xp_transactions")
      .select("points")
      .eq("profile_id", user.id)
      .eq("post_id", postId);
    if (xpError) throw xpError;

    const earnedPoints = (xpRows ?? []).reduce((sum, row) => sum + Number(row.points || 0), 0);
    if (earnedPoints > 0) {
      await supabase.from("xp_transactions").insert({
        profile_id: user.id,
        action: "DELETE_POST_REVERSAL",
        points: -earnedPoints,
        post_id: postId,
      });
    }

    if (post.image_url && post.image_url.includes("/storage/v1/object/public/posts/")) {
      try {
        const fileName = post.image_url.split("/posts/")[1];
        if (fileName) await supabase.storage.from("posts").remove([fileName]);
      } catch (_) {
        // noop
      }
    }

    await supabase.from("post_likes").delete().eq("post_id", postId);
    await supabase.from("post_comments").delete().eq("post_id", postId);
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true, removedXp: earnedPoints }), {
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
