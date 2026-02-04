-- Campos para Assinatura Digital nos Contratos
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS contract_text TEXT,
ADD COLUMN IF NOT EXISTS signed_by_client BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signed_by_pro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signed_at_client TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signed_at_pro TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signature_hash TEXT;

-- Garantir que o perfil tenha pontos e nível
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;