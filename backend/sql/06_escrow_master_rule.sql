-- ============================================================================
-- DUSHOW - Regra Mestre de Pagamento em Escrow
-- ============================================================================

-- 1) ESTADOS FINANCEIROS-OPERACIONAIS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status_master') THEN
    CREATE TYPE public.contract_status_master AS ENUM (
      'PROPOSTO',
      'ACEITO',
      'AGUARDANDO_PAGAMENTO',
      'PAGO_ESCROW',
      'EM_EXECUCAO',
      'CONCLUIDO',
      'LIBERADO_FINANCEIRO',
      'EM_MEDIACAO',
      'CANCELADO'
    );
  END IF;
END $$;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS status_master public.contract_status_master,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

UPDATE public.contracts
SET status_master = CASE UPPER(COALESCE(status, ''))
  WHEN 'PROPOSTO' THEN 'PROPOSTO'::public.contract_status_master
  WHEN 'PROPOSTA_ENVIADA' THEN 'PROPOSTO'::public.contract_status_master
  WHEN 'ACEITO' THEN 'AGUARDANDO_PAGAMENTO'::public.contract_status_master
  WHEN 'ASSINADO' THEN 'AGUARDANDO_PAGAMENTO'::public.contract_status_master
  WHEN 'AGUARDANDO_PAGAMENTO' THEN 'AGUARDANDO_PAGAMENTO'::public.contract_status_master
  WHEN 'PAGO' THEN 'PAGO_ESCROW'::public.contract_status_master
  WHEN 'PAGO_ESCROW' THEN 'PAGO_ESCROW'::public.contract_status_master
  WHEN 'EM_EXECUCAO' THEN 'EM_EXECUCAO'::public.contract_status_master
  WHEN 'CONCLUIDO' THEN 'CONCLUIDO'::public.contract_status_master
  WHEN 'LIBERADO_FINANCEIRO' THEN 'LIBERADO_FINANCEIRO'::public.contract_status_master
  WHEN 'EM_MEDIACAO' THEN 'EM_MEDIACAO'::public.contract_status_master
  WHEN 'CANCELADO' THEN 'CANCELADO'::public.contract_status_master
  ELSE 'PROPOSTO'::public.contract_status_master
END
WHERE status_master IS NULL;

-- 2) WALLET TRANSACTIONS DE ESCROW
CREATE TABLE IF NOT EXISTS public.contract_escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contratante_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  profissional_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  amount_total NUMERIC(12,2) NOT NULL,
  platform_fee NUMERIC(12,2) NOT NULL,
  professional_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  release_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contract_escrow_transactions_contract_id ON public.contract_escrow_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_escrow_transactions_status ON public.contract_escrow_transactions(status);

-- 3) POLITICA DE CANCELAMENTO
CREATE OR REPLACE FUNCTION public.get_refund_rate_by_hours_to_event(p_event_at TIMESTAMPTZ)
RETURNS NUMERIC AS $$
DECLARE
  v_hours NUMERIC;
BEGIN
  v_hours := EXTRACT(EPOCH FROM (p_event_at - NOW())) / 3600.0;
  IF v_hours > 168 THEN
    RETURN 1.00; -- >7 dias
  ELSIF v_hours >= 72 THEN
    RETURN 0.50; -- 3-7 dias
  ELSIF v_hours < 48 THEN
    RETURN 0.00; -- <48h
  ELSE
    RETURN 0.50;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4) COBRANCA -> ESCROW HELD
CREATE OR REPLACE FUNCTION public.execute_escrow_payment(
  p_contract_id UUID,
  p_actor_profile_id UUID,
  p_payment_method TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_contract RECORD;
  v_plan TEXT;
  v_rate NUMERIC;
  v_total NUMERIC;
  v_fee NUMERIC;
  v_prof NUMERIC;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato nao encontrado.'; END IF;

  IF v_contract.status_master <> 'AGUARDANDO_PAGAMENTO' THEN
    RAISE EXCEPTION 'Contrato fora da etapa de cobranca.';
  END IF;
  IF v_contract.contratante_profile_id <> p_actor_profile_id THEN
    RAISE EXCEPTION 'Apenas contratante pode pagar.';
  END IF;
  IF v_contract.contratante_profile_id = v_contract.profissional_profile_id THEN
    RAISE EXCEPTION 'Pagamento invalido para propria carteira.';
  END IF;

  SELECT plan_tier INTO v_plan FROM public.profiles WHERE id = v_contract.profissional_profile_id;
  v_rate := public.get_plan_commission_rate(v_plan);
  v_total := COALESCE(v_contract.valor_atual, v_contract.value, 0);
  v_fee := ROUND(v_total * v_rate, 2);
  v_prof := v_total - v_fee;

  INSERT INTO public.contract_escrow_transactions (
    contract_id, contratante_profile_id, profissional_profile_id,
    amount_total, platform_fee, professional_amount,
    status, payment_method
  )
  VALUES (
    v_contract.id, v_contract.contratante_profile_id, v_contract.profissional_profile_id,
    v_total, v_fee, v_prof,
    'HELD', p_payment_method
  );

  UPDATE public.profiles
  SET balance_pending = COALESCE(balance_pending, 0) + v_prof
  WHERE id = v_contract.profissional_profile_id;

  UPDATE public.contracts
  SET status_master = 'PAGO_ESCROW',
      status = 'PAGO_ESCROW',
      paid_at = NOW(),
      payment_method = p_payment_method
  WHERE id = v_contract.id;

  RETURN jsonb_build_object(
    'contract_id', v_contract.id,
    'status_master', 'PAGO_ESCROW',
    'amount_total', v_total,
    'platform_fee', v_fee,
    'professional_amount', v_prof
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) EXECUCAO/CONCLUSAO/LIBERACAO
CREATE OR REPLACE FUNCTION public.mark_contract_in_execution(p_contract_id UUID, p_actor UUID)
RETURNS VOID AS $$
DECLARE
  v_contract RECORD;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato nao encontrado.'; END IF;
  IF p_actor NOT IN (v_contract.contratante_profile_id, v_contract.profissional_profile_id) THEN
    RAISE EXCEPTION 'Participante invalido.';
  END IF;
  IF v_contract.status_master NOT IN ('PAGO_ESCROW', 'EM_EXECUCAO') THEN
    RAISE EXCEPTION 'Contrato nao esta apto para execucao.';
  END IF;

  UPDATE public.contracts
  SET status_master = 'EM_EXECUCAO',
      status = 'EM_EXECUCAO',
      execution_started_at = COALESCE(execution_started_at, NOW())
  WHERE id = p_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.release_contract_funds(p_contract_id UUID, p_reason TEXT)
RETURNS JSONB AS $$
DECLARE
  v_contract RECORD;
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato nao encontrado.'; END IF;
  IF v_contract.status_master = 'LIBERADO_FINANCEIRO' THEN
    RETURN jsonb_build_object('already_released', true);
  END IF;
  IF v_contract.status_master NOT IN ('PAGO_ESCROW', 'EM_EXECUCAO', 'CONCLUIDO') THEN
    RAISE EXCEPTION 'Contrato fora de estado liberavel.';
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
  SET balance_pending = GREATEST(0, balance_pending - v_wallet.professional_amount),
      balance_available = balance_available + v_wallet.professional_amount
  WHERE id = v_wallet.profissional_profile_id;

  UPDATE public.contract_escrow_transactions
  SET status = 'RELEASED',
      release_reason = p_reason,
      released_at = NOW()
  WHERE id = v_wallet.id;


  UPDATE public.contracts
  SET status_master = 'LIBERADO_FINANCEIRO',
      status = 'LIBERADO_FINANCEIRO',
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
  IF v_contract.status_master NOT IN ('PAGO_ESCROW', 'EM_EXECUCAO', 'CONCLUIDO') THEN
    RAISE EXCEPTION 'Contrato nao pode ser concluido.';
  END IF;

  UPDATE public.contracts
  SET status_master = 'CONCLUIDO',
      status = 'CONCLUIDO',
      completed_at = NOW()
  WHERE id = p_contract_id;

  IF p_actor = v_contract.contratante_profile_id THEN
    RETURN public.release_contract_funds(p_contract_id, 'MANUAL_CLIENT_CONFIRMATION');
  END IF;
  RETURN jsonb_build_object('completed', true, 'released', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auto_release_due_escrow()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_contract RECORD;
BEGIN
  FOR v_contract IN
    SELECT id
    FROM public.contracts
    WHERE status_master IN ('PAGO_ESCROW', 'EM_EXECUCAO', 'CONCLUIDO')
      AND data_evento IS NOT NULL
      AND NOW() >= (data_evento + INTERVAL '48 hours')
  LOOP
    PERFORM public.release_contract_funds(v_contract.id, 'AUTO_48H');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) CANCELAMENTO COM REGRA DE REEMBOLSO
CREATE OR REPLACE FUNCTION public.process_contract_cancellation(p_contract_id UUID, p_actor UUID)
RETURNS JSONB AS $$
DECLARE
  v_contract RECORD;
  v_wallet RECORD;
  v_refund_rate NUMERIC;
  v_refund_amount NUMERIC;
  v_penalty_amount NUMERIC;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato nao encontrado.'; END IF;
  IF p_actor NOT IN (v_contract.contratante_profile_id, v_contract.profissional_profile_id) THEN
    RAISE EXCEPTION 'Participante invalido.';
  END IF;

  IF v_contract.status_master IN ('LIBERADO_FINANCEIRO') THEN
    RAISE EXCEPTION 'Cancelamento invalido: contrato ja liquidado.';
  END IF;

  IF v_contract.status_master IN ('PAGO_ESCROW', 'EM_EXECUCAO', 'CONCLUIDO') THEN
    SELECT * INTO v_wallet
    FROM public.contract_escrow_transactions
    WHERE contract_id = p_contract_id AND status = 'HELD'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF v_wallet.id IS NOT NULL THEN
      v_refund_rate := public.get_refund_rate_by_hours_to_event(v_contract.data_evento);
      v_refund_amount := ROUND(v_wallet.amount_total * v_refund_rate, 2);
      v_penalty_amount := v_wallet.amount_total - v_refund_amount;

      UPDATE public.contract_escrow_transactions
      SET status = 'CANCELLED',
          release_reason = jsonb_build_object(
            'refund_rate', v_refund_rate,
            'refund_amount', v_refund_amount,
            'penalty_amount', v_penalty_amount
          )::TEXT
      WHERE id = v_wallet.id;

      UPDATE public.profiles
      SET balance_pending = GREATEST(0, balance_pending - v_wallet.professional_amount)
      WHERE id = v_wallet.profissional_profile_id;

    END IF;
  END IF;

  UPDATE public.contracts
  SET status_master = 'CANCELADO',
      status = 'CANCELADO'
  WHERE id = p_contract_id;

  RETURN jsonb_build_object(
    'cancelled', true,
    'refund_rate', COALESCE(v_refund_rate, 0),
    'refund_amount', COALESCE(v_refund_amount, 0),
    'penalty_amount', COALESCE(v_penalty_amount, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) TRILHA IMUTAVEL
CREATE OR REPLACE FUNCTION public.log_contract_master_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status_master IS DISTINCT FROM OLD.status_master THEN
    INSERT INTO public.contract_history (
      contract_id, action, performed_by_profile_id, old_status, new_status, old_value, new_value, metadata
    ) VALUES (
      NEW.id,
      'MASTER_STATUS_CHANGE',
      COALESCE(auth.uid(), NEW.created_by_profile_id),
      OLD.status_master::TEXT,
      NEW.status_master::TEXT,
      COALESCE(OLD.valor_atual, OLD.value, 0),
      COALESCE(NEW.valor_atual, NEW.value, 0),
      jsonb_build_object('source', 'trigger')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_contract_master_state ON public.contracts;
CREATE TRIGGER tr_log_contract_master_state
AFTER UPDATE OF status_master ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.log_contract_master_state();
