-- ============================================================================
-- DUSHOW - Perfil Profissional v1
-- Consolida regras contratuais, financeiras, reputacionais e de agenda
-- ============================================================================

-- 1) ENUMS OFICIAIS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status_v1') THEN
    CREATE TYPE public.contract_status_v1 AS ENUM (
      'PROPOSTA_ENVIADA',
      'CONTRAPROPOSTA',
      'ACEITO',
      'ASSINADO',
      'PAGO',
      'CONCLUIDO',
      'CANCELADO',
      'REJEITADO'
    );
  END IF;
END $$;

-- 2) PERFIL PROFISSIONAL E PLANOS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nome_artistico TEXT,
  ADD COLUMN IF NOT EXISTS nome_civil TEXT,
  ADD COLUMN IF NOT EXISTS cidade_regiao TEXT,
  ADD COLUMN IF NOT EXISTS categoria_principal TEXT,
  ADD COLUMN IF NOT EXISTS subcategorias TEXT[],
  ADD COLUMN IF NOT EXISTS biografia TEXT,
  ADD COLUMN IF NOT EXISTS cache_base NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS tipo_atendimento TEXT DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS documentacao_validada BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS messaging_warnings INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messaging_blocked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS xp_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_pending NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_available NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_xp_non_negative,
  DROP CONSTRAINT IF EXISTS profiles_plan_tier_ck,
  ADD CONSTRAINT profiles_xp_non_negative CHECK (xp_total >= 0) NOT VALID;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_tier_ck
  CHECK (COALESCE(LOWER(plan_tier), 'free') IN ('free', 'pro', 'elite', 'superstar', 'verified', 'admin')) NOT VALID;

-- 3) CONTRATOS - FONTE DA VERDADE
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contratante_profile_id UUID,
  ADD COLUMN IF NOT EXISTS profissional_profile_id UUID,
  ADD COLUMN IF NOT EXISTS created_by_profile_id UUID,
  ADD COLUMN IF NOT EXISTS valor_atual NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS data_evento TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS local TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS status_v1 public.contract_status_v1,
  ADD COLUMN IF NOT EXISTS event_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escrow_release_reason TEXT;

UPDATE public.contracts
SET status_v1 = CASE UPPER(COALESCE(status, ''))
  WHEN 'PENDING' THEN 'PROPOSTA_ENVIADA'::public.contract_status_v1
  WHEN 'PROPOSTA_ENVIADA' THEN 'PROPOSTA_ENVIADA'::public.contract_status_v1
  WHEN 'COUNTER_PROPOSAL' THEN 'CONTRAPROPOSTA'::public.contract_status_v1
  WHEN 'CONTRAPROPOSTA' THEN 'CONTRAPROPOSTA'::public.contract_status_v1
  WHEN 'ACCEPTED' THEN 'ACEITO'::public.contract_status_v1
  WHEN 'ACEITO' THEN 'ACEITO'::public.contract_status_v1
  WHEN 'SIGNED' THEN 'ASSINADO'::public.contract_status_v1
  WHEN 'ASSINADO' THEN 'ASSINADO'::public.contract_status_v1
  WHEN 'PAID' THEN 'PAGO'::public.contract_status_v1
  WHEN 'PAGO' THEN 'PAGO'::public.contract_status_v1
  WHEN 'COMPLETED' THEN 'CONCLUIDO'::public.contract_status_v1
  WHEN 'CONCLUIDO' THEN 'CONCLUIDO'::public.contract_status_v1
  WHEN 'CANCELLED' THEN 'CANCELADO'::public.contract_status_v1
  WHEN 'CANCELADO' THEN 'CANCELADO'::public.contract_status_v1
  WHEN 'REJECTED' THEN 'REJEITADO'::public.contract_status_v1
  WHEN 'REJEITADO' THEN 'REJEITADO'::public.contract_status_v1
  ELSE 'PROPOSTA_ENVIADA'::public.contract_status_v1
END
WHERE status_v1 IS NULL;

UPDATE public.contracts
SET status = status_v1::TEXT
WHERE status IS DISTINCT FROM status_v1::TEXT;

ALTER TABLE public.contracts
  ALTER COLUMN status SET DEFAULT 'PROPOSTA_ENVIADA';

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_profiles_distinct_ck,
  DROP CONSTRAINT IF EXISTS contracts_required_fields_ck,
  ADD CONSTRAINT contracts_profiles_distinct_ck
  CHECK (
    contratante_profile_id IS NULL OR profissional_profile_id IS NULL
    OR contratante_profile_id <> profissional_profile_id
  ) NOT VALID;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_required_fields_ck
  CHECK (
    contratante_profile_id IS NOT NULL
    AND profissional_profile_id IS NOT NULL
    AND created_by_profile_id IS NOT NULL
    AND status IS NOT NULL
    AND valor_atual IS NOT NULL
    AND data_evento IS NOT NULL
    AND COALESCE(local, '') <> ''
    AND COALESCE(descricao, '') <> ''
  ) NOT VALID;

-- 4) XP TRANSACTIONS E REGRAS DE FEED
ALTER TABLE public.xp_transactions
  ADD COLUMN IF NOT EXISTS post_id UUID,
  ADD COLUMN IF NOT EXISTS comment_id UUID,
  ADD COLUMN IF NOT EXISTS like_id UUID;

CREATE INDEX IF NOT EXISTS idx_xp_transactions_profile_id ON public.xp_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_post_id ON public.xp_transactions(post_id);

CREATE OR REPLACE FUNCTION public.enforce_xp_floor()
RETURNS TRIGGER AS $$
DECLARE
  v_delta INTEGER := COALESCE(NEW.points, 0);
BEGIN
  UPDATE public.profiles
  SET xp_total = GREATEST(0, COALESCE(xp_total, 0) + v_delta)
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_apply_xp_delta ON public.xp_transactions;
CREATE TRIGGER tr_apply_xp_delta
AFTER INSERT ON public.xp_transactions
FOR EACH ROW EXECUTE FUNCTION public.enforce_xp_floor();

CREATE OR REPLACE FUNCTION public.feed_post_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_points INTEGER := CASE WHEN NEW.image_url IS NULL OR NEW.image_url = '' THEN 2 ELSE 7 END;
BEGIN
  IF NEW.image_url IS NOT NULL AND NEW.image_url <> '' THEN
    IF POSITION('/storage/v1/object/public/' IN NEW.image_url) = 0 THEN
      RAISE EXCEPTION 'Imagem deve ser upload interno no Supabase Storage.';
    END IF;
  END IF;

  INSERT INTO public.xp_transactions(profile_id, action, points, post_id)
  VALUES (NEW.author_id, 'POST_CREATED', v_points, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_feed_post_xp ON public.posts;
CREATE TRIGGER tr_feed_post_xp
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.feed_post_xp();

CREATE OR REPLACE FUNCTION public.feed_like_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_author UUID;
BEGIN
  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  IF v_author IS NOT NULL THEN
    INSERT INTO public.xp_transactions(profile_id, action, points, post_id, like_id)
    VALUES (v_author, 'POST_LIKE_RECEIVED', 1, NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='post_likes') THEN
    DROP TRIGGER IF EXISTS tr_feed_like_xp ON public.post_likes;
    CREATE TRIGGER tr_feed_like_xp
    AFTER INSERT ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION public.feed_like_xp();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.feed_comment_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_author UUID;
BEGIN
  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  IF v_author IS NOT NULL THEN
    INSERT INTO public.xp_transactions(profile_id, action, points, post_id, comment_id)
    VALUES (v_author, 'POST_COMMENT_RECEIVED', 2, NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='post_comments') THEN
    DROP TRIGGER IF EXISTS tr_feed_comment_xp ON public.post_comments;
    CREATE TRIGGER tr_feed_comment_xp
    AFTER INSERT ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION public.feed_comment_xp();
  END IF;
END $$;

-- 5) AGENDA INTELIGENTE
ALTER TABLE public.availability_blocks
  ADD COLUMN IF NOT EXISTS block_type TEXT DEFAULT 'manual';

CREATE OR REPLACE FUNCTION public.prevent_contract_on_blocked_date()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.availability_blocks b
    WHERE b.profile_id = NEW.profissional_profile_id
      AND NEW.data_evento >= b.start_date
      AND NEW.data_evento <= b.end_date
  ) THEN
    RAISE EXCEPTION 'Data indisponível para o profissional.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_contract_on_blocked_date ON public.contracts;
CREATE TRIGGER tr_prevent_contract_on_blocked_date
BEFORE INSERT OR UPDATE OF data_evento ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.prevent_contract_on_blocked_date();

-- 6) FINANCEIRO E SPLIT
CREATE OR REPLACE FUNCTION public.get_plan_commission_rate(p_plan TEXT)
RETURNS NUMERIC AS $$
BEGIN
  CASE LOWER(COALESCE(p_plan, 'free'))
    WHEN 'free' THEN RETURN 0.10;
    WHEN 'pro' THEN RETURN 0.07;
    WHEN 'elite' THEN RETURN 0.05;
    WHEN 'superstar' THEN RETURN 0.02;
    ELSE RETURN 0.10;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.apply_escrow_split(p_contract_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_contract RECORD;
  v_plan TEXT;
  v_rate NUMERIC;
  v_total NUMERIC;
  v_fee NUMERIC;
  v_pro NUMERIC;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado.';
  END IF;

  IF v_contract.status <> 'ASSINADO' THEN
    RAISE EXCEPTION 'Pagamento permitido apenas para contrato ASSINADO.';
  END IF;

  IF v_contract.contratante_profile_id = v_contract.profissional_profile_id THEN
    RAISE EXCEPTION 'Split inválido para própria carteira.';
  END IF;

  SELECT plan_tier INTO v_plan FROM public.profiles WHERE id = v_contract.profissional_profile_id;
  v_rate := public.get_plan_commission_rate(v_plan);
  v_total := COALESCE(v_contract.valor_atual, 0);
  v_fee := ROUND(v_total * v_rate, 2);
  v_pro := v_total - v_fee;

  INSERT INTO public.financial_ledger(contract_id, user_id, amount, type, description, confirmed_at, created_at)
  VALUES
    (v_contract.id, v_contract.profissional_profile_id, v_pro, 'CREDIT', 'Escrow pendente (profissional)', NULL, NOW()),
    (v_contract.id, v_contract.contratante_profile_id, -v_total, 'DEBIT', 'Pagamento do contratante', NOW(), NOW());

  UPDATE public.profiles
  SET balance_pending = COALESCE(balance_pending, 0) + v_pro
  WHERE id = v_contract.profissional_profile_id;

  UPDATE public.contracts
  SET status = 'PAGO'
  WHERE id = v_contract.id;

  RETURN jsonb_build_object(
    'valor_total', v_total,
    'comissao_dushow', v_fee,
    'valor_profissional', v_pro
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.release_escrow_if_due(p_contract_id UUID, p_reason TEXT DEFAULT 'AUTO_24H')
RETURNS BOOLEAN AS $$
DECLARE
  v_contract RECORD;
  v_value NUMERIC;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_contract.status <> 'PAGO' OR v_contract.escrow_released_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  IF p_reason = 'EVENT_CONFIRMED' THEN
    NULL;
  ELSIF NOW() < (v_contract.data_evento + INTERVAL '24 hours') THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_value
  FROM public.financial_ledger
  WHERE contract_id = v_contract.id
    AND user_id = v_contract.profissional_profile_id
    AND type = 'CREDIT';

  IF v_value <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET balance_pending = GREATEST(0, balance_pending - v_value),
      balance_available = balance_available + v_value
  WHERE id = v_contract.profissional_profile_id;

  UPDATE public.financial_ledger
  SET confirmed_at = NOW(),
      description = COALESCE(description, '') || ' | Escrow liberado'
  WHERE contract_id = v_contract.id
    AND user_id = v_contract.profissional_profile_id
    AND type = 'CREDIT'
    AND confirmed_at IS NULL;

  UPDATE public.contracts
  SET escrow_released_at = NOW(),
      escrow_release_reason = p_reason
  WHERE id = v_contract.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS pix_key TEXT;

ALTER TABLE public.withdrawals
  DROP CONSTRAINT IF EXISTS withdrawals_min_amount_ck,
  ADD CONSTRAINT withdrawals_min_amount_ck CHECK (amount >= 50) NOT VALID;

CREATE OR REPLACE FUNCTION public.validate_withdrawal_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_available NUMERIC;
BEGIN
  IF NEW.amount < 50 THEN
    RAISE EXCEPTION 'Valor mínimo de saque: R$ 50.';
  END IF;
  IF NEW.pix_key IS NULL OR LENGTH(TRIM(NEW.pix_key)) < 3 THEN
    RAISE EXCEPTION 'Chave PIX inválida.';
  END IF;
  SELECT balance_available INTO v_available FROM public.profiles WHERE id = NEW.user_id;
  IF COALESCE(v_available, 0) < NEW.amount THEN
    RAISE EXCEPTION 'Saldo disponível insuficiente.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_validate_withdrawal_rules ON public.withdrawals;
CREATE TRIGGER tr_validate_withdrawal_rules
BEFORE INSERT ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_rules();

-- 7) REPUTACAO (PESO 2X PARA EVENTO PAGO)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS removed_as_fake BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.set_review_weight()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF NEW.contract_id IS NULL THEN
    NEW.weight := 1;
    RETURN NEW;
  END IF;

  SELECT status INTO v_status FROM public.contracts WHERE id = NEW.contract_id;
  NEW.weight := CASE WHEN v_status = 'PAGO' THEN 2 ELSE 1 END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_review_weight ON public.reviews;
CREATE TRIGGER tr_set_review_weight
BEFORE INSERT OR UPDATE OF contract_id ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.set_review_weight();

-- 8) HISTORICO IMUTAVEL DE CONTRATO
CREATE TABLE IF NOT EXISTS public.contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by_profile_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT,
  old_value NUMERIC(12,2),
  new_value NUMERIC(12,2),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.prevent_contract_history_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'contract_history é imutável.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_contract_history_no_update ON public.contract_history;
CREATE TRIGGER tr_contract_history_no_update
BEFORE UPDATE OR DELETE ON public.contract_history
FOR EACH ROW EXECUTE FUNCTION public.prevent_contract_history_mutation();

-- 9) RLS BASEADO EM PROFILE_ID
ALTER TABLE public.contract_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_history_select_participants ON public.contract_history;
CREATE POLICY contract_history_select_participants
ON public.contract_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contracts c
    WHERE c.id = contract_id
      AND (auth.uid() = c.contratante_profile_id OR auth.uid() = c.profissional_profile_id)
  )
  OR public.is_admin()
);

-- 10) AJUSTE DE BUSCA: foto obrigatória para descoberta
CREATE OR REPLACE VIEW public.profiles_discovery AS
SELECT *
FROM public.profiles
WHERE role = 'PRO'
  AND is_active = TRUE
  AND avatar_url IS NOT NULL
  AND avatar_url <> '';
