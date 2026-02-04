-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis (Público)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('PRO', 'CLIENT', 'ADMIN')) DEFAULT 'PRO',
  bio TEXT,
  category TEXT,
  location TEXT,
  price NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_verified BOOLEAN DEFAULT false,
  is_superstar BOOLEAN DEFAULT false,
  plan_tier TEXT DEFAULT 'free',
  referral_code TEXT UNIQUE,
  referral_count INTEGER DEFAULT 0,
  portfolio_urls TEXT[],
  work_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Contratos (Privado)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.profiles(id),
  pro_id UUID REFERENCES public.profiles(id),
  event_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_location TEXT,
  value NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'COMPLETED', 'CANCELLED')),
  contract_text TEXT,
  signed_by_client BOOLEAN DEFAULT false,
  signed_by_pro BOOLEAN DEFAULT false,
  signed_at_client TIMESTAMP WITH TIME ZONE,
  signed_at_pro TIMESTAMP WITH TIME ZONE,
  signature_hash TEXT,
  payment_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Posts (Feed)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Habilitar RLS em tudo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Segurança (Exemplos Críticos)
CREATE POLICY "Perfis são públicos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários editam o próprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Usuários veem seus próprios contratos" ON public.contracts 
FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = pro_id);

CREATE POLICY "Acesso público posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Usuários criam posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- 8. Trigger para Criar Perfil no Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, referral_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    COALESCE(NEW.raw_user_meta_data->>'role', 'PRO'),
    upper(substring(md5(random()::text) from 1 for 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();