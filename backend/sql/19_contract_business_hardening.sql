-- ============================================================================
-- DUSHOW - Blindagem absoluta da regra de negocio de contratos
-- ============================================================================
-- Este script cria uma camada canonica de estado (business_status),
-- valida transicoes, bloqueia alteracao direta de status e centraliza
-- mudancas via funcao backend apply_contract_transition.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Colunas obrigatorias do contrato
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contratante_profile_id UUID,
  ADD COLUMN IF NOT EXISTS profissional_profile_id UUID,
  ADD COLUMN IF NOT EXISTS created_by_profile_id UUID,
  ADD COLUMN IF NOT EXISTS value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS business_status TEXT,
  ADD COLUMN IF NOT EXISTS signed_by_client BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS signed_by_pro BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS signed_at_client TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_at_pro TIMESTAMPTZ;

-- Compatibilidade com esquemas legados.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'client_id'
  ) THEN
    EXECUTE '
      UPDATE public.contracts
      SET contratante_profile_id = COALESCE(contratante_profile_id, client_id)
      WHERE contratante_profile_id IS NULL
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'pro_id'
  ) THEN
    EXECUTE '
      UPDATE public.contracts
      SET profissional_profile_id = COALESCE(profissional_profile_id, pro_id)
      WHERE profissional_profile_id IS NULL
    ';
  END IF;

  UPDATE public.contracts
  SET created_by_profile_id = COALESCE(created_by_profile_id, contratante_profile_id)
  WHERE created_by_profile_id IS NULL;

  UPDATE public.contracts
  SET value = COALESCE(value, valor_atual, 0)
  WHERE value IS NULL;

  UPDATE public.contracts
  SET event_date = COALESCE(event_date, data_evento)
  WHERE event_date IS NULL;
END $$;

-- 2) Garante valores do enum legado de status_master
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'contract_status_master'
  ) THEN
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''CONTRAPROPOSTA''';
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''ACEITO''';
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''AGUARDANDO_PAGAMENTO''';
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''PAGO_ESCROW''';
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''EM_EXECUCAO''';
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''CONCLUIDO''';
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''LIBERADO_FINANCEIRO''';
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''EM_MEDIACAO''';
    EXECUTE 'ALTER TYPE public.contract_status_master ADD VALUE IF NOT EXISTS ''CANCELADO''';
  END IF;
END $$;

-- 3) Mapeamentos de estado (canonico <-> legado)
CREATE OR REPLACE FUNCTION public.contract_legacy_to_business_status(p_status TEXT, p_status_master TEXT)
RETURNS TEXT AS $$
DECLARE
  s TEXT := UPPER(COALESCE(NULLIF(TRIM(p_status_master), ''), NULLIF(TRIM(p_status), ''), ''));
BEGIN
  IF s IN ('DRAFT') THEN RETURN 'DRAFT'; END IF;
  IF s IN ('SENT', 'PROPOSTO', 'PROPOSTA_ENVIADA', 'PENDING', 'PENDENTE') THEN RETURN 'SENT'; END IF;
  IF s IN ('COUNTERED', 'COUNTER_PROPOSAL', 'CONTRAPROPOSTA') THEN RETURN 'COUNTERED'; END IF;
  IF s IN ('ACCEPTED', 'ACEITO') THEN RETURN 'ACCEPTED'; END IF;
  IF s IN ('SIGNED', 'ASSINADO') THEN RETURN 'SIGNED'; END IF;
  IF s IN ('AWAITING_PAYMENT', 'AGUARDANDO_PAGAMENTO') THEN RETURN 'AWAITING_PAYMENT'; END IF;
  IF s IN ('PAID_ESCROW', 'PAID', 'PAGO') THEN RETURN 'PAID_ESCROW'; END IF;
  IF s IN ('IN_EXECUTION', 'EM_EXECUCAO') THEN RETURN 'IN_EXECUTION'; END IF;
  IF s IN ('COMPLETED', 'CONCLUIDO') THEN RETURN 'COMPLETED'; END IF;
  IF s IN ('RELEASED', 'LIBERADO_FINANCEIRO') THEN RETURN 'RELEASED'; END IF;
  IF s IN ('REJECTED', 'REJEITADO') THEN RETURN 'REJECTED'; END IF;
  IF s IN ('CANCELLED', 'CANCELED', 'CANCELADO', 'REFUNDED') THEN RETURN 'CANCELLED'; END IF;
  RETURN 'SENT';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.contract_business_to_legacy(p_business_status TEXT)
RETURNS JSONB AS $$
DECLARE
  s TEXT := UPPER(COALESCE(p_business_status, 'SENT'));
BEGIN
  CASE s
    WHEN 'DRAFT' THEN
      RETURN jsonb_build_object('status', 'DRAFT', 'status_master', 'PROPOSTO', 'status_v1', 'DRAFT');
    WHEN 'SENT' THEN
      RETURN jsonb_build_object('status', 'PROPOSTA_ENVIADA', 'status_master', 'PROPOSTO', 'status_v1', 'PROPOSTA_ENVIADA');
    WHEN 'COUNTERED' THEN
      RETURN jsonb_build_object('status', 'CONTRAPROPOSTA', 'status_master', 'CONTRAPROPOSTA', 'status_v1', 'CONTRAPROPOSTA');
    WHEN 'ACCEPTED' THEN
      RETURN jsonb_build_object('status', 'ACEITO', 'status_master', 'ACEITO', 'status_v1', 'ACEITO');
    WHEN 'SIGNED' THEN
      RETURN jsonb_build_object('status', 'ASSINADO', 'status_master', 'ACEITO', 'status_v1', 'ASSINADO');
    WHEN 'AWAITING_PAYMENT' THEN
      RETURN jsonb_build_object('status', 'AGUARDANDO_PAGAMENTO', 'status_master', 'AGUARDANDO_PAGAMENTO', 'status_v1', 'AGUARDANDO_PAGAMENTO');
    WHEN 'PAID_ESCROW' THEN
      RETURN jsonb_build_object('status', 'PAGO_ESCROW', 'status_master', 'PAGO_ESCROW', 'status_v1', 'PAGO_ESCROW');
    WHEN 'IN_EXECUTION' THEN
      RETURN jsonb_build_object('status', 'EM_EXECUCAO', 'status_master', 'EM_EXECUCAO', 'status_v1', 'EM_EXECUCAO');
    WHEN 'COMPLETED' THEN
      RETURN jsonb_build_object('status', 'CONCLUIDO', 'status_master', 'CONCLUIDO', 'status_v1', 'CONCLUIDO');
    WHEN 'RELEASED' THEN
      RETURN jsonb_build_object('status', 'LIBERADO_FINANCEIRO', 'status_master', 'LIBERADO_FINANCEIRO', 'status_v1', 'LIBERADO_FINANCEIRO');
    WHEN 'REJECTED' THEN
      RETURN jsonb_build_object('status', 'CANCELADO', 'status_master', 'CANCELADO', 'status_v1', 'REJEITADO');
    WHEN 'CANCELLED' THEN
      RETURN jsonb_build_object('status', 'CANCELADO', 'status_master', 'CANCELADO', 'status_v1', 'CANCELADO');
    ELSE
      RETURN jsonb_build_object('status', 'PROPOSTA_ENVIADA', 'status_master', 'PROPOSTO', 'status_v1', 'PROPOSTA_ENVIADA');
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.is_valid_contract_transition(p_old TEXT, p_new TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  o TEXT := UPPER(COALESCE(p_old, 'SENT'));
  n TEXT := UPPER(COALESCE(p_new, 'SENT'));
BEGIN
  IF o = n THEN RETURN TRUE; END IF;

  CASE o
    WHEN 'DRAFT' THEN RETURN n IN ('SENT', 'CANCELLED');
    WHEN 'SENT' THEN RETURN n IN ('COUNTERED', 'ACCEPTED', 'REJECTED', 'CANCELLED');
    WHEN 'COUNTERED' THEN RETURN n IN ('ACCEPTED', 'REJECTED', 'CANCELLED');
    WHEN 'ACCEPTED' THEN RETURN n IN ('SIGNED', 'REJECTED', 'CANCELLED');
    WHEN 'SIGNED' THEN RETURN n IN ('AWAITING_PAYMENT', 'CANCELLED');
    WHEN 'AWAITING_PAYMENT' THEN RETURN n IN ('PAID_ESCROW', 'CANCELLED');
    WHEN 'PAID_ESCROW' THEN RETURN n IN ('IN_EXECUTION', 'CANCELLED');
    WHEN 'IN_EXECUTION' THEN RETURN n IN ('COMPLETED', 'CANCELLED');
    WHEN 'COMPLETED' THEN RETURN n IN ('RELEASED');
    WHEN 'RELEASED' THEN RETURN FALSE;
    WHEN 'REJECTED' THEN RETURN FALSE;
    WHEN 'CANCELLED' THEN RETURN FALSE;
    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4) Backfill para estado canonico
UPDATE public.contracts
SET business_status = public.contract_legacy_to_business_status(status, status_master::TEXT)
WHERE business_status IS NULL OR btrim(business_status) = '';

-- 5) Guard-rail: impedir updates diretos fora de backend controlado
CREATE OR REPLACE FUNCTION public.contract_business_guard()
RETURNS TRIGGER AS $$
DECLARE
  v_old TEXT := COALESCE(OLD.business_status, public.contract_legacy_to_business_status(OLD.status, OLD.status_master::TEXT));
  v_new TEXT := COALESCE(NEW.business_status, v_old);
  v_legacy JSONB;
  v_gate TEXT := current_setting('app.contract_transition', true);
BEGIN
  IF NEW.contratante_profile_id IS NOT NULL
     AND NEW.profissional_profile_id IS NOT NULL
     AND NEW.contratante_profile_id = NEW.profissional_profile_id THEN
    RAISE EXCEPTION 'contratante_profile_id deve ser diferente de profissional_profile_id.';
  END IF;

  IF (NEW.business_status IS DISTINCT FROM OLD.business_status)
     OR (NEW.status IS DISTINCT FROM OLD.status)
     OR (NEW.status_master IS DISTINCT FROM OLD.status_master) THEN
    IF COALESCE(v_gate, '') <> 'on' THEN
      RAISE EXCEPTION 'Mudanca de status bloqueada. Use apply_contract_transition.';
    END IF;
  END IF;

  IF NOT public.is_valid_contract_transition(v_old, v_new) THEN
    RAISE EXCEPTION 'Transicao invalida de % para %.', v_old, v_new;
  END IF;

  NEW.business_status := UPPER(v_new);
  v_legacy := public.contract_business_to_legacy(NEW.business_status);
  NEW.status := v_legacy->>'status';
  NEW.status_master := (v_legacy->>'status_master')::public.contract_status_master;
  NEW.status_v1 := v_legacy->>'status_v1';
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_contract_business_guard ON public.contracts;
CREATE TRIGGER tr_contract_business_guard
BEFORE UPDATE OF business_status, status, status_master ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.contract_business_guard();

-- 6) Historico obrigatorio para toda mudanca de estado canonico
CREATE TABLE IF NOT EXISTS public.contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by_profile_id UUID,
  old_status TEXT,
  new_status TEXT,
  old_value NUMERIC(12,2),
  new_value NUMERIC(12,2),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.log_contract_business_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.business_status IS DISTINCT FROM OLD.business_status THEN
    INSERT INTO public.contract_history (
      contract_id, action, performed_by_profile_id, old_status, new_status, old_value, new_value, metadata
    )
    VALUES (
      NEW.id,
      'BUSINESS_STATUS_CHANGE',
      COALESCE(auth.uid(), NEW.created_by_profile_id),
      OLD.business_status,
      NEW.business_status,
      COALESCE(OLD.valor_atual, OLD.value, 0),
      COALESCE(NEW.valor_atual, NEW.value, 0),
      jsonb_build_object('source', 'trigger')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_contract_business_status ON public.contracts;
CREATE TRIGGER tr_log_contract_business_status
AFTER UPDATE OF business_status ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.log_contract_business_status();

-- 7) Agenda: bloquear somente quando ACCEPTED+ e liberar em REJECTED/CANCELLED
ALTER TABLE public.availability_blocks
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_availability_blocks_contract_id ON public.availability_blocks(contract_id);

CREATE OR REPLACE FUNCTION public.sync_contract_availability_block(p_contract_id UUID)
RETURNS VOID AS $$
DECLARE
  v_contract RECORD;
  v_blocked BOOLEAN;
BEGIN
  SELECT *
  INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_blocked := UPPER(COALESCE(v_contract.business_status, 'SENT')) IN (
    'ACCEPTED', 'SIGNED', 'AWAITING_PAYMENT', 'PAID_ESCROW', 'IN_EXECUTION', 'COMPLETED', 'RELEASED'
  );

  IF v_blocked
     AND v_contract.profissional_profile_id IS NOT NULL
     AND COALESCE(v_contract.data_evento, v_contract.event_date) IS NOT NULL THEN
    DELETE FROM public.availability_blocks WHERE contract_id = p_contract_id;

    INSERT INTO public.availability_blocks (
      profile_id, start_date, end_date, reason, block_type, contract_id
    )
    VALUES (
      v_contract.profissional_profile_id,
      COALESCE(v_contract.data_evento, v_contract.event_date),
      COALESCE(v_contract.data_evento, v_contract.event_date),
      'Bloqueio automatico por contrato',
      'contract',
      p_contract_id
    );
  ELSE
    DELETE FROM public.availability_blocks WHERE contract_id = p_contract_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.tr_sync_contract_availability_block()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_contract_availability_block(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_contract_availability_block ON public.contracts;
CREATE TRIGGER tr_sync_contract_availability_block
AFTER INSERT OR UPDATE OF business_status, data_evento, event_date, profissional_profile_id
ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.tr_sync_contract_availability_block();

-- 8) Regras financeiras estritas (COMPLETED -> RELEASED somente)
CREATE OR REPLACE FUNCTION public.release_contract_funds(p_contract_id UUID, p_reason TEXT)
RETURNS JSONB AS $$
DECLARE
  v_contract RECORD;
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato nao encontrado.'; END IF;
  IF UPPER(COALESCE(v_contract.business_status, '')) <> 'COMPLETED' THEN
    RAISE EXCEPTION 'Liberacao financeira permitida somente em COMPLETED.';
  END IF;

  SELECT * INTO v_wallet
  FROM public.contract_escrow_transactions
  WHERE contract_id = p_contract_id AND status = 'HELD'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_wallet.id IS NULL THEN
    RAISE EXCEPTION 'Escrow nao encontrado.';
  END IF;

  UPDATE public.profiles
  SET balance_pending = GREATEST(0, COALESCE(balance_pending,0) - COALESCE(v_wallet.professional_amount,0)),
      balance_available = COALESCE(balance_available,0) + COALESCE(v_wallet.professional_amount,0)
  WHERE id = v_wallet.profissional_profile_id;

  UPDATE public.contract_escrow_transactions
  SET status = 'RELEASED',
      release_reason = p_reason,
      released_at = NOW()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    profile_id, source_type, source_id, type, amount, status, metadata
  )
  VALUES (
    v_wallet.profissional_profile_id, 'CONTRACT', p_contract_id, 'RELEASE',
    ABS(COALESCE(v_wallet.professional_amount,0)), 'RELEASED',
    jsonb_build_object('reason', p_reason)
  );

  PERFORM set_config('app.contract_transition', 'on', true);
  UPDATE public.contracts
  SET business_status = 'RELEASED',
      released_at = NOW()
  WHERE id = p_contract_id;

  RETURN jsonb_build_object(
    'released', true,
    'professional_amount', v_wallet.professional_amount,
    'platform_fee', v_wallet.platform_fee
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.confirm_contract_completion(p_contract_id UUID, p_actor UUID)
RETURNS JSONB AS $$
DECLARE
  v_contract RECORD;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato nao encontrado.'; END IF;
  IF p_actor NOT IN (v_contract.contratante_profile_id, v_contract.profissional_profile_id) THEN
    RAISE EXCEPTION 'Participante invalido.';
  END IF;
  IF UPPER(COALESCE(v_contract.business_status, '')) <> 'IN_EXECUTION' THEN
    RAISE EXCEPTION 'Conclusao permitida somente em IN_EXECUTION.';
  END IF;

  PERFORM set_config('app.contract_transition', 'on', true);
  UPDATE public.contracts
  SET business_status = 'COMPLETED',
      completed_at = NOW()
  WHERE id = p_contract_id;

  RETURN jsonb_build_object('completed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Motor central de transicao (unica forma permitida)
CREATE OR REPLACE FUNCTION public.apply_contract_transition(
  p_contract_id UUID,
  p_actor_profile_id UUID,
  p_action TEXT,
  p_new_value NUMERIC DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_contract RECORD;
  v_old_status TEXT;
  v_new_status TEXT;
  v_action TEXT := UPPER(COALESCE(p_action, ''));
  v_actor_role TEXT;
  v_is_client BOOLEAN;
  v_is_pro BOOLEAN;
BEGIN
  SELECT *
  INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato nao encontrado.'; END IF;

  IF v_contract.contratante_profile_id IS NULL OR v_contract.profissional_profile_id IS NULL THEN
    RAISE EXCEPTION 'Contrato invalido sem participantes.';
  END IF;

  IF v_contract.contratante_profile_id = v_contract.profissional_profile_id THEN
    RAISE EXCEPTION 'Mesmo usuario nao pode estar nos dois lados do contrato.';
  END IF;

  v_is_client := (p_actor_profile_id = v_contract.contratante_profile_id);
  v_is_pro := (p_actor_profile_id = v_contract.profissional_profile_id);
  IF NOT v_is_client AND NOT v_is_pro THEN
    RAISE EXCEPTION 'Ator nao participante do contrato.';
  END IF;

  v_actor_role := CASE WHEN v_is_client THEN 'CLIENT' ELSE 'PRO' END;
  v_old_status := COALESCE(v_contract.business_status, public.contract_legacy_to_business_status(v_contract.status, v_contract.status_master::TEXT));
  v_new_status := v_old_status;

  PERFORM set_config('app.contract_transition', 'on', true);

  CASE v_action
    WHEN 'ACCEPT' THEN
      IF NOT v_is_pro THEN RAISE EXCEPTION 'Apenas profissional pode aceitar.'; END IF;
      IF v_old_status NOT IN ('SENT','COUNTERED') THEN RAISE EXCEPTION 'Transicao invalida para ACCEPT.'; END IF;
      v_new_status := 'ACCEPTED';

    WHEN 'REJECT' THEN
      IF NOT v_is_pro THEN RAISE EXCEPTION 'Apenas profissional pode rejeitar.'; END IF;
      IF v_old_status NOT IN ('SENT','COUNTERED','ACCEPTED') THEN RAISE EXCEPTION 'Transicao invalida para REJECT.'; END IF;
      v_new_status := 'REJECTED';

    WHEN 'COUNTER_PROPOSAL' THEN
      IF NOT v_is_pro THEN RAISE EXCEPTION 'Apenas profissional pode contrapropor.'; END IF;
      IF v_old_status NOT IN ('SENT','COUNTERED') THEN RAISE EXCEPTION 'Transicao invalida para COUNTER_PROPOSAL.'; END IF;
      IF p_new_value IS NULL OR p_new_value <= 0 THEN RAISE EXCEPTION 'Novo valor invalido.'; END IF;
      UPDATE public.contracts
      SET value = p_new_value, valor_atual = p_new_value
      WHERE id = p_contract_id;
      v_new_status := 'COUNTERED';

    WHEN 'SIGN' THEN
      IF v_old_status NOT IN ('ACCEPTED','SIGNED') THEN RAISE EXCEPTION 'Assinatura permitida apenas apos aceite.'; END IF;
      IF v_is_client THEN
        UPDATE public.contracts
        SET signed_by_client = TRUE, signed_at_client = COALESCE(signed_at_client, NOW())
        WHERE id = p_contract_id;
      ELSE
        UPDATE public.contracts
        SET signed_by_pro = TRUE, signed_at_pro = COALESCE(signed_at_pro, NOW())
        WHERE id = p_contract_id;
      END IF;

      SELECT *
      INTO v_contract
      FROM public.contracts
      WHERE id = p_contract_id
      FOR UPDATE;

      IF COALESCE(v_contract.signed_by_client, FALSE) AND COALESCE(v_contract.signed_by_pro, FALSE) THEN
        v_new_status := 'AWAITING_PAYMENT';
      ELSE
        v_new_status := 'SIGNED';
      END IF;

    WHEN 'PAY' THEN
      IF NOT v_is_client THEN RAISE EXCEPTION 'Apenas contratante pode pagar.'; END IF;
      IF v_old_status <> 'AWAITING_PAYMENT' THEN RAISE EXCEPTION 'Pagamento permitido apenas em AWAITING_PAYMENT.'; END IF;
      PERFORM public.execute_escrow_payment(
        p_contract_id,
        p_actor_profile_id,
        COALESCE(NULLIF(TRIM(p_payment_method), ''), 'CARD')
      );
      v_new_status := 'PAID_ESCROW';

    WHEN 'START_EXECUTION' THEN
      IF v_old_status <> 'PAID_ESCROW' THEN RAISE EXCEPTION 'Execucao permitida apenas em PAID_ESCROW.'; END IF;
      PERFORM public.mark_contract_in_execution(p_contract_id, p_actor_profile_id);
      v_new_status := 'IN_EXECUTION';

    WHEN 'CONFIRM_COMPLETION' THEN
      IF v_old_status <> 'IN_EXECUTION' THEN RAISE EXCEPTION 'Conclusao permitida apenas em IN_EXECUTION.'; END IF;
      PERFORM public.confirm_contract_completion(p_contract_id, p_actor_profile_id);
      v_new_status := 'COMPLETED';

    WHEN 'RELEASE' THEN
      IF NOT v_is_client THEN RAISE EXCEPTION 'Apenas contratante pode liberar pagamento.'; END IF;
      IF v_old_status <> 'COMPLETED' THEN RAISE EXCEPTION 'Liberacao permitida apenas em COMPLETED.'; END IF;
      PERFORM public.release_contract_funds(p_contract_id, 'MANUAL_CLIENT_RELEASE');
      v_new_status := 'RELEASED';

    WHEN 'CANCEL' THEN
      IF v_old_status IN ('RELEASED', 'REJECTED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Contrato em estado terminal nao pode ser cancelado.';
      END IF;
      IF v_old_status IN ('PAID_ESCROW', 'IN_EXECUTION', 'COMPLETED') THEN
        PERFORM public.process_contract_cancellation(p_contract_id, p_actor_profile_id);
      END IF;
      v_new_status := 'CANCELLED';

    ELSE
      RAISE EXCEPTION 'Acao invalida: %', p_action;
  END CASE;

  UPDATE public.contracts
  SET business_status = v_new_status
  WHERE id = p_contract_id;

  INSERT INTO public.contract_history (
    contract_id, action, performed_by_profile_id, old_status, new_status, old_value, new_value, metadata
  )
  VALUES (
    p_contract_id,
    v_action,
    p_actor_profile_id,
    v_old_status,
    v_new_status,
    COALESCE(v_contract.valor_atual, v_contract.value, 0),
    COALESCE(p_new_value, v_contract.valor_atual, v_contract.value, 0),
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('actor_role', v_actor_role)
  );

  PERFORM public.sync_contract_availability_block(p_contract_id);

  RETURN jsonb_build_object(
    'contract_id', p_contract_id,
    'old_status', v_old_status,
    'new_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10) Constraints finais
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_business_status_ck;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_business_status_ck
  CHECK (UPPER(COALESCE(business_status, '')) IN (
    'DRAFT','SENT','COUNTERED','ACCEPTED','SIGNED','AWAITING_PAYMENT',
    'PAID_ESCROW','IN_EXECUTION','COMPLETED','RELEASED','REJECTED','CANCELLED'
  )) NOT VALID;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_created_by_required_ck,
  ADD CONSTRAINT contracts_created_by_required_ck
  CHECK (created_by_profile_id IS NOT NULL) NOT VALID;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS check_different_parties,
  ADD CONSTRAINT check_different_parties
  CHECK (
    contratante_profile_id IS NULL OR profissional_profile_id IS NULL
    OR contratante_profile_id <> profissional_profile_id
  ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_contracts_business_status ON public.contracts(business_status);
