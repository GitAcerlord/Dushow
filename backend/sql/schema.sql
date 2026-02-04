-- Tabela de Posts (Feed Social)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Posts são visíveis para todos" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados criam posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Usuários deletam seus próprios posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Garantir que a tabela de contratos tenha os campos necessários para o checkout
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_method TEXT;