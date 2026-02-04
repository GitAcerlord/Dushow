-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Perfis são visíveis para todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários editam o próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para CONTRACTS
CREATE POLICY "Usuários veem seus próprios contratos" ON public.contracts 
FOR SELECT USING (auth.uid() = client_id OR auth.uid() = pro_id);

CREATE POLICY "Clientes criam contratos" ON public.contracts 
FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Políticas para POSTS
CREATE POLICY "Posts são públicos" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Usuários criam seus posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Usuários deletam seus posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);