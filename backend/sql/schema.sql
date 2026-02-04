-- Tabela de Curtidas (Garante que um usuário curta apenas uma vez)
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Habilitar RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Qualquer um vê curtidas" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Usuários curtem posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários descurtem posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Qualquer um vê comentários" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Usuários comentam" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para exclusão de posts (Apenas o autor)
CREATE POLICY "Autores excluem seus posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);