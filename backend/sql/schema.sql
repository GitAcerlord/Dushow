-- Garantindo estados do contrato
-- Status: PENDING -> ACCEPTED -> PAID -> COMPLETED -> RELEASED
ALTER TABLE public.contracts 
ALTER COLUMN status SET DEFAULT 'PENDING';

-- Campos de Gamificação no Perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Função para calcular nível baseado em XP (Ex: cada 1000 XP = 1 Nível)
CREATE OR REPLACE FUNCTION public.calculate_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := floor(NEW.xp_total / 1000) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_level ON public.profiles;
CREATE TRIGGER tr_update_level
BEFORE UPDATE OF xp_total ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.calculate_level();