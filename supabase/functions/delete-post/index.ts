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

    // Validar Usuário
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error("Não autorizado.")

    const { postId } = await req.json()

    // 1. Verificar se o post pertence ao usuário
    const { data: post, error: fetchError } = await supabaseClient
      .from('posts')
      .select('author_id, image_url')
      .eq('id', postId)
      .single()

    if (fetchError || !post) throw new Error("Post não encontrado.")
    if (post.author_id !== user.id) throw new Error("Você não tem permissão para excluir este post.")

    // 2. Limpar Storage se houver imagem
    if (post.image_url && post.image_url.includes('supabase.co/storage')) {
      try {
        const urlParts = post.image_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        // Tenta remover do bucket 'posts' (ajuste se o nome for outro)
        await supabaseClient.storage.from('posts').remove([fileName])
      } catch (e) {
        console.error("[delete-post] Falha ao remover arquivo físico:", e)
      }
    }

    // 3. Exclusão em cascata manual (Garante limpeza total mesmo sem CASCADE no DB)
    await supabaseClient.from('post_likes').delete().eq('post_id', postId)
    await supabaseClient.from('post_comments').delete().eq('post_id', postId)
    
    const { error: deleteError } = await supabaseClient
      .from('posts')
      .delete()
      .eq('id', postId)

    if (deleteError) throw deleteError

    console.log(`[delete-post] Post ${postId} removido com sucesso por ${user.id}`)

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