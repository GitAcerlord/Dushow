-- ============================================================================
-- DUSHOW - Correção de validação de partes no contrato
-- Evita erro: check_different_parties quando payload usa colunas mistas (legado/novo).
-- ============================================================================

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS check_different_parties,
  DROP CONSTRAINT IF EXISTS contracts_parties_distinct_guard,
  DROP CONSTRAINT IF EXISTS contracts_profiles_distinct_ck;

DO $$
DECLARE
  left_col TEXT;
  right_col TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contracts'
      AND column_name = 'contratante_profile_id'
  ) THEN
    left_col := 'contratante_profile_id';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contracts'
      AND column_name = 'client_id'
  ) THEN
    left_col := 'client_id';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contracts'
      AND column_name = 'profissional_profile_id'
  ) THEN
    right_col := 'profissional_profile_id';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contracts'
      AND column_name = 'pro_id'
  ) THEN
    right_col := 'pro_id';
  END IF;

  IF left_col IS NULL OR right_col IS NULL THEN
    RAISE EXCEPTION 'Nao foi possivel criar check_different_parties: colunas de partes nao encontradas em public.contracts.';
  END IF;

  EXECUTE format(
    'ALTER TABLE public.contracts
       ADD CONSTRAINT check_different_parties
       CHECK (%1$I IS NULL OR %2$I IS NULL OR %1$I <> %2$I) NOT VALID',
    left_col,
    right_col
  );
END $$;
