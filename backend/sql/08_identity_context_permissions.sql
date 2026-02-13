-- ============================================================================
-- DUSHOW - Identidade Unica + Contextos + Permissoes por Papel
-- ============================================================================

-- 1) PERFIL UNICO POR USUARIO AUTH
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE public.profiles
SET user_id = id
WHERE user_id IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_matches_user_id_ck,
  ADD CONSTRAINT profiles_id_matches_user_id_ck
  CHECK (id = user_id) NOT VALID;

-- 2) CONTEXTOS (UI ONLY)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_context TEXT DEFAULT 'PRO',
  ADD COLUMN IF NOT EXISTS enabled_contexts TEXT[] DEFAULT ARRAY['PRO','CONTRACTOR','PRODUCER']::TEXT[];

UPDATE public.profiles
SET enabled_contexts = COALESCE(enabled_contexts, ARRAY['PRO','CONTRACTOR','PRODUCER']::TEXT[])
WHERE enabled_contexts IS NULL;

UPDATE public.profiles
SET active_context = 'CONTRACTOR'
WHERE active_context = 'CLIENT';

UPDATE public.profiles
SET enabled_contexts = array_replace(enabled_contexts, 'CLIENT', 'CONTRACTOR')
WHERE enabled_contexts @> ARRAY['CLIENT']::TEXT[];

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_active_context_ck,
  ADD CONSTRAINT profiles_active_context_ck
  CHECK (active_context IN ('PRO', 'CONTRACTOR', 'PRODUCER')) NOT VALID;

-- active_context precisa existir dentro de enabled_contexts
CREATE OR REPLACE FUNCTION public.ensure_active_context_enabled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active_context IS NOT NULL
     AND NOT (NEW.active_context = ANY(COALESCE(NEW.enabled_contexts, ARRAY[]::TEXT[]))) THEN
    RAISE EXCEPTION 'active_context nao habilitado em enabled_contexts.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ensure_active_context_enabled ON public.profiles;
CREATE TRIGGER tr_ensure_active_context_enabled
BEFORE INSERT OR UPDATE OF active_context, enabled_contexts ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_active_context_enabled();

-- 3) CONTRATOS BLINDADOS
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS created_by_profile_id UUID;

UPDATE public.contracts
SET created_by_profile_id = COALESCE(created_by_profile_id, contratante_profile_id, client_id)
WHERE created_by_profile_id IS NULL;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_created_by_required_ck,
  ADD CONSTRAINT contracts_created_by_required_ck
  CHECK (created_by_profile_id IS NOT NULL) NOT VALID;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_parties_distinct_guard,
  ADD CONSTRAINT contracts_parties_distinct_guard
  CHECK (
    contratante_profile_id IS NULL OR profissional_profile_id IS NULL
    OR contratante_profile_id <> profissional_profile_id
  ) NOT VALID;

-- 4) WALLET LEDGER UNIFICADO (modulos separados por source)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- CONTRACT | TICKET | PLAN | MARKETPLACE
  source_id UUID,
  type TEXT NOT NULL, -- CREDIT | DEBIT | HOLD | RELEASE | REFUND
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_profile_id ON public.wallet_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_source ON public.wallet_transactions(source_type, source_id);

-- 5) RLS / POLITICAS POR PAPEL NO REGISTRO (nao por contexto)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contracts_select_by_participant ON public.contracts;
CREATE POLICY contracts_select_by_participant
ON public.contracts
FOR SELECT TO authenticated
USING (
  auth.uid() = contratante_profile_id
  OR auth.uid() = profissional_profile_id
  OR public.is_admin()
);

-- Bloqueia INSERT/UPDATE/DELETE direto no contrato pelo client;
-- fluxo critico sempre via Edge Functions.
DROP POLICY IF EXISTS contracts_no_direct_insert ON public.contracts;
CREATE POLICY contracts_no_direct_insert
ON public.contracts
FOR INSERT TO authenticated
WITH CHECK (FALSE);

DROP POLICY IF EXISTS contracts_no_direct_update ON public.contracts;
CREATE POLICY contracts_no_direct_update
ON public.contracts
FOR UPDATE TO authenticated
USING (FALSE);

DROP POLICY IF EXISTS contracts_no_direct_delete ON public.contracts;
CREATE POLICY contracts_no_direct_delete
ON public.contracts
FOR DELETE TO authenticated
USING (FALSE);

DROP POLICY IF EXISTS wallet_transactions_owner_select ON public.wallet_transactions;
CREATE POLICY wallet_transactions_owner_select
ON public.wallet_transactions
FOR SELECT TO authenticated
USING (auth.uid() = profile_id OR public.is_admin());

-- sem escrita direta no wallet
DROP POLICY IF EXISTS wallet_transactions_no_direct_insert ON public.wallet_transactions;
CREATE POLICY wallet_transactions_no_direct_insert
ON public.wallet_transactions
FOR INSERT TO authenticated
WITH CHECK (FALSE);

DROP POLICY IF EXISTS wallet_transactions_no_direct_update ON public.wallet_transactions;
CREATE POLICY wallet_transactions_no_direct_update
ON public.wallet_transactions
FOR UPDATE TO authenticated
USING (FALSE);

DROP POLICY IF EXISTS wallet_transactions_no_direct_delete ON public.wallet_transactions;
CREATE POLICY wallet_transactions_no_direct_delete
ON public.wallet_transactions
FOR DELETE TO authenticated
USING (FALSE);
