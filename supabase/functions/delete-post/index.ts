import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error("Não autorizado.")

    const { postId } = await req.json()

    // 1. Verificar propriedade e buscar dados do post
    const { data: post, error: fetchError } = await supabaseClient
      .from('posts')
      .select('author_id, image_url')
      .eq('id', postId)
      .single()

    if (fetchError || !post) throw new Error("Post não encontrado.");
    if (post.author_id !== user.id) throw new Error("Permissão negada.");

    // 2. Estornar XP (-5 pontos)
    await supabaseClient.from('xp_transactions').insert({
      profile_id: user.id,
      action: 'DELETE_POST',
      points: -5
    });

    // 3. Limpar Storage se houver imagem
    if (post.image_url && post.image_url.includes('supabase.co/storage')) {
      try {
        const fileName = post.image_url.split('/').pop();
        if (fileName) await supabaseClient.storage.from('posts').remove([fileName]);
      } catch (e) { console.error("[delete-post] Erro storage:", e); }
    }

    // 4. Excluir Post (Triggers do banco cuidam de likes/comments se configurado, 
    // mas fazemos manual para garantir persistência)
    await supabaseClient.from('post_likes').delete().eq('post_id', postId);
    await supabaseClient.from('post_comments').delete().eq('post_id', postId);
    
    const { error: deleteError } = await supabaseClient
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders
    })
  }
})