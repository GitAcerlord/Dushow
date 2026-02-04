-- Atualização da tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS areas_of_activity TEXT[], -- Array de especialidades
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[],
ADD COLUMN IF NOT EXISTS work_count INTEGER DEFAULT 0;

-- Tabela para o Marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT, -- 'Equipamento', 'Instrumento', 'Case', etc.
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS no Marketplace
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketplace visível para todos" ON public.marketplace_items FOR SELECT USING (true);
CREATE POLICY "Usuários gerenciam seus itens" ON public.marketplace_items FOR ALL USING (auth.uid() = seller_id);

-- Função para gerar código de indicação único no cadastro
CREATE OR REPLACE FUNCTION public.generate_referral_code() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := upper(substring(md5(random()::text) from 1 for 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_gen_referral
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();