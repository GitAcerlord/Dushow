-- ============================================================================
-- DUSHOW - Perfil Produtor + Bilheteria + Escrow de Ingressos
-- ============================================================================

-- 1) ESTADOS DE EVENTO
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'producer_event_status') THEN
    CREATE TYPE public.producer_event_status AS ENUM (
      'DRAFT',
      'ACTIVE_SALES',
      'SOLD_OUT',
      'IN_PROGRESS',
      'FINISHED',
      'SETTLEMENT_PENDING',
      'SETTLED',
      'CANCELLED'
    );
  END IF;
END $$;

-- 2) EVENTO DE BILHETERIA (DERIVADO DE CONTRATO)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID,
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.producer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  producer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  local TEXT NOT NULL,
  capacidade INTEGER NOT NULL CHECK (capacidade > 0),
  status public.producer_event_status NOT NULL DEFAULT 'DRAFT',
  sales_opened_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id)
);

CREATE INDEX IF NOT EXISTS idx_producer_events_producer ON public.producer_events(producer_profile_id);
CREATE INDEX IF NOT EXISTS idx_producer_events_status ON public.producer_events(status);

CREATE OR REPLACE FUNCTION public.touch_producer_event()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_touch_producer_event ON public.producer_events;
CREATE TRIGGER tr_touch_producer_event
BEFORE UPDATE ON public.producer_events
FOR EACH ROW EXECUTE FUNCTION public.touch_producer_event();

-- 3) LOTES DE INGRESSOS
CREATE TABLE IF NOT EXISTS public.ticket_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.producer_events(id) ON DELETE CASCADE,
  nome_lote TEXT NOT NULL,
  ticket_type TEXT NOT NULL, -- INTEIRA, MEIA, VIP, BACKSTAGE, CORTESIA, PREMIUM
  preco NUMERIC(12,2) NOT NULL CHECK (preco >= 0),
  quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
  vendidos INTEGER NOT NULL DEFAULT 0 CHECK (vendidos >= 0),
  inicio_vendas TIMESTAMPTZ NOT NULL,
  fim_vendas TIMESTAMPTZ NOT NULL,
  taxa_plataforma NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_batches_event_id ON public.ticket_batches(event_id);

-- 4) COMPRAS DE INGRESSO + ESCROW
CREATE TABLE IF NOT EXISTS public.ticket_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.producer_events(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.ticket_batches(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL, -- CARD, PIX, WALLET
  payment_status TEXT NOT NULL DEFAULT 'PAID', -- PAID, FAILED, REFUNDED
  escrow_status TEXT NOT NULL DEFAULT 'ESCROW_HELD', -- ESCROW_PENDING, ESCROW_HELD, ESCROW_RELEASED, ESCROW_REFUNDED
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  producer_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  affiliate_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  affiliate_profile_id UUID REFERENCES public.profiles(id),
  external_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_id ON public.ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_user_id ON public.ticket_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_escrow_status ON public.ticket_purchases(escrow_status);

-- 5) INGRESSOS INDIVIDUAIS E QR
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.ticket_purchases(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.producer_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'VALID', -- VALID, USED, CANCELLED
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);

CREATE TABLE IF NOT EXISTS public.ticket_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_by UUID NOT NULL REFERENCES public.profiles(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_checkins_ticket_once ON public.ticket_checkins(ticket_id);

-- 6) WALLET DO PRODUTOR
CREATE TABLE IF NOT EXISTS public.producer_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.producer_events(id) ON DELETE CASCADE,
  producer_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL, -- SALE | RELEASE | REFUND | AFFILIATE_PAYOUT
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL, -- PENDING | HELD | RELEASED | REFUNDED
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producer_wallet_event ON public.producer_wallet_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_producer_wallet_producer ON public.producer_wallet_transactions(producer_profile_id);

-- 7) AFILIADOS
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.producer_events(id) ON DELETE CASCADE,
  affiliate_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  purchase_id UUID NOT NULL REFERENCES public.ticket_purchases(id) ON DELETE CASCADE,
  commission_amount NUMERIC(12,2) NOT NULL,
  payout_status TEXT NOT NULL DEFAULT 'HELD', -- HELD, RELEASED, REFUNDED
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8) FUNCOES DE NEGOCIO
CREATE OR REPLACE FUNCTION public.activate_ticketing_for_contract(
  p_contract_id UUID,
  p_producer_profile_id UUID,
  p_nome TEXT,
  p_descricao TEXT,
  p_data_inicio TIMESTAMPTZ,
  p_data_fim TIMESTAMPTZ,
  p_local TEXT,
  p_capacidade INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_contract RECORD;
  v_event_id UUID;
BEGIN
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF v_contract.id IS NULL THEN
    RAISE EXCEPTION 'Contrato nao encontrado.';
  END IF;

  IF p_producer_profile_id <> v_contract.contratante_profile_id THEN
    RAISE EXCEPTION 'Apenas o contratante/produtor do contrato pode ativar bilheteria.';
  END IF;

  IF UPPER(COALESCE(v_contract.status_master::TEXT, v_contract.status)) NOT IN ('AGUARDANDO_PAGAMENTO', 'PAGO_ESCROW', 'EM_EXECUCAO', 'CONCLUIDO', 'LIBERADO_FINANCEIRO') THEN
    RAISE EXCEPTION 'Contrato ainda nao esta operacional para bilheteria.';
  END IF;

  INSERT INTO public.producer_events (
    contract_id, producer_profile_id, nome, descricao,
    data_inicio, data_fim, local, capacidade, status, sales_opened_at
  )
  VALUES (
    p_contract_id, p_producer_profile_id, p_nome, p_descricao,
    p_data_inicio, p_data_fim, p_local, p_capacidade, 'ACTIVE_SALES', NOW()
  )
  ON CONFLICT (contract_id) DO UPDATE
  SET nome = EXCLUDED.nome,
      descricao = EXCLUDED.descricao,
      data_inicio = EXCLUDED.data_inicio,
      data_fim = EXCLUDED.data_fim,
      local = EXCLUDED.local,
      capacidade = EXCLUDED.capacidade,
      status = 'ACTIVE_SALES',
      sales_opened_at = COALESCE(public.producer_events.sales_opened_at, NOW())
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_ticket_batch(
  p_event_id UUID,
  p_nome_lote TEXT,
  p_ticket_type TEXT,
  p_preco NUMERIC,
  p_quantidade INTEGER,
  p_inicio TIMESTAMPTZ,
  p_fim TIMESTAMPTZ,
  p_taxa NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_event RECORD;
  v_batch_id UUID;
BEGIN
  SELECT * INTO v_event FROM public.producer_events WHERE id = p_event_id;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'Evento nao encontrado.'; END IF;

  IF p_ticket_type NOT IN ('INTEIRA', 'MEIA', 'VIP', 'BACKSTAGE', 'CORTESIA', 'PREMIUM') THEN
    RAISE EXCEPTION 'Tipo de ingresso invalido.';
  END IF;

  INSERT INTO public.ticket_batches (
    event_id, nome_lote, ticket_type, preco, quantidade, inicio_vendas, fim_vendas, taxa_plataforma
  )
  VALUES (
    p_event_id, p_nome_lote, p_ticket_type, p_preco, p_quantidade, p_inicio, p_fim, COALESCE(p_taxa, 10.00)
  )
  RETURNING id INTO v_batch_id;

  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.purchase_ticket_escrow(
  p_user_id UUID,
  p_event_id UUID,
  p_batch_id UUID,
  p_quantity INTEGER,
  p_payment_method TEXT,
  p_affiliate_code TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
  v_batch RECORD;
  v_purchase_id UUID;
  v_total NUMERIC;
  v_platform_fee NUMERIC;
  v_affiliate_rate NUMERIC := 0;
  v_affiliate_amount NUMERIC := 0;
  v_producer_amount NUMERIC;
  v_affiliate_profile UUID;
  v_i INTEGER;
  v_ticket_id UUID;
BEGIN
  IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantidade invalida.'; END IF;

  SELECT * INTO v_event FROM public.producer_events WHERE id = p_event_id FOR UPDATE;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'Evento nao encontrado.'; END IF;
  IF v_event.status NOT IN ('ACTIVE_SALES') THEN RAISE EXCEPTION 'Evento sem vendas ativas.'; END IF;

  SELECT * INTO v_batch FROM public.ticket_batches WHERE id = p_batch_id AND event_id = p_event_id FOR UPDATE;
  IF v_batch.id IS NULL THEN RAISE EXCEPTION 'Lote nao encontrado.'; END IF;
  IF NOW() < v_batch.inicio_vendas OR NOW() > v_batch.fim_vendas THEN
    RAISE EXCEPTION 'Lote fora da janela de venda.';
  END IF;
  IF (v_batch.vendidos + p_quantity) > v_batch.quantidade THEN
    RAISE EXCEPTION 'Lote sem quantidade suficiente.';
  END IF;

  IF p_affiliate_code IS NOT NULL AND p_affiliate_code <> '' THEN
    SELECT affiliate_profile_id, commission_rate
      INTO v_affiliate_profile, v_affiliate_rate
    FROM public.affiliate_links
    WHERE event_id = p_event_id AND code = p_affiliate_code AND is_active = TRUE
    LIMIT 1;
  END IF;

  v_total := ROUND(v_batch.preco * p_quantity, 2);
  v_platform_fee := ROUND(v_total * (v_batch.taxa_plataforma / 100.0), 2);
  v_affiliate_amount := ROUND(v_total * (COALESCE(v_affiliate_rate, 0) / 100.0), 2);
  v_producer_amount := v_total - v_platform_fee - v_affiliate_amount;

  INSERT INTO public.ticket_purchases (
    user_id, event_id, batch_id, quantity, amount, payment_method, payment_status, escrow_status,
    platform_fee, producer_amount, affiliate_amount, affiliate_profile_id
  )
  VALUES (
    p_user_id, p_event_id, p_batch_id, p_quantity, v_total, UPPER(p_payment_method), 'PAID', 'ESCROW_HELD',
    v_platform_fee, v_producer_amount, v_affiliate_amount, v_affiliate_profile
  )
  RETURNING id INTO v_purchase_id;

  FOR v_i IN 1..p_quantity LOOP
    INSERT INTO public.tickets (purchase_id, event_id, user_id, qr_code, status)
    VALUES (v_purchase_id, p_event_id, p_user_id, 'DKW-' || gen_random_uuid()::TEXT, 'VALID')
    RETURNING id INTO v_ticket_id;
  END LOOP;

  UPDATE public.ticket_batches
  SET vendidos = vendidos + p_quantity
  WHERE id = p_batch_id;

  INSERT INTO public.producer_wallet_transactions (event_id, producer_profile_id, type, amount, status)
  VALUES (p_event_id, v_event.producer_profile_id, 'SALE', v_producer_amount, 'HELD');

  INSERT INTO public.wallet_transactions (profile_id, source_type, source_id, type, amount, status, metadata)
  VALUES
    (p_user_id, 'TICKET', v_purchase_id, 'DEBIT', -ABS(v_total), 'COMPLETED', jsonb_build_object('event_id', p_event_id)),
    (v_event.producer_profile_id, 'TICKET', v_purchase_id, 'HOLD', ABS(v_producer_amount), 'HELD', jsonb_build_object('event_id', p_event_id));

  IF v_affiliate_profile IS NOT NULL AND v_affiliate_amount > 0 THEN
    INSERT INTO public.affiliate_sales (affiliate_profile_id, purchase_id, commission_amount, payout_status)
    VALUES (v_affiliate_profile, v_purchase_id, v_affiliate_amount, 'HELD');
  END IF;

  RETURN jsonb_build_object(
    'purchase_id', v_purchase_id,
    'amount', v_total,
    'platform_fee', v_platform_fee,
    'producer_amount', v_producer_amount,
    'affiliate_amount', v_affiliate_amount,
    'escrow_status', 'ESCROW_HELD'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.validate_ticket_checkin(
  p_ticket_id UUID,
  p_validator UUID
)
RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF v_ticket.id IS NULL THEN RAISE EXCEPTION 'Ingresso nao encontrado.'; END IF;
  IF v_ticket.status <> 'VALID' THEN
    RAISE EXCEPTION 'Ingresso ja utilizado/cancelado.';
  END IF;

  INSERT INTO public.ticket_checkins (ticket_id, validated_by)
  VALUES (p_ticket_id, p_validator);

  UPDATE public.tickets SET status = 'USED' WHERE id = p_ticket_id;

  RETURN jsonb_build_object('checked_in', true, 'ticket_id', p_ticket_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.release_event_funds(p_event_id UUID, p_reason TEXT DEFAULT 'AUTO_48H')
RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
  v_total_release NUMERIC := 0;
BEGIN
  SELECT * INTO v_event FROM public.producer_events WHERE id = p_event_id FOR UPDATE;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'Evento nao encontrado.'; END IF;
  IF v_event.status IN ('SETTLED', 'CANCELLED') THEN
    RETURN jsonb_build_object('already_settled', true);
  END IF;

  SELECT COALESCE(SUM(producer_amount), 0) INTO v_total_release
  FROM public.ticket_purchases
  WHERE event_id = p_event_id
    AND payment_status = 'PAID'
    AND escrow_status = 'ESCROW_HELD';

  UPDATE public.ticket_purchases
  SET escrow_status = 'ESCROW_RELEASED'
  WHERE event_id = p_event_id
    AND payment_status = 'PAID'
    AND escrow_status = 'ESCROW_HELD';

  UPDATE public.producer_wallet_transactions
  SET status = 'RELEASED'
  WHERE event_id = p_event_id
    AND status = 'HELD';

  INSERT INTO public.producer_wallet_transactions (event_id, producer_profile_id, type, amount, status)
  VALUES (p_event_id, v_event.producer_profile_id, 'RELEASE', v_total_release, 'RELEASED');

  INSERT INTO public.wallet_transactions (profile_id, source_type, source_id, type, amount, status, metadata)
  VALUES (v_event.producer_profile_id, 'TICKET', p_event_id, 'RELEASE', ABS(v_total_release), 'RELEASED', jsonb_build_object('reason', p_reason));

  UPDATE public.affiliate_sales a
  SET payout_status = 'RELEASED'
  FROM public.ticket_purchases p
  WHERE p.id = a.purchase_id
    AND p.event_id = p_event_id
    AND a.payout_status = 'HELD';

  UPDATE public.producer_events
  SET status = 'SETTLED',
      settled_at = NOW()
  WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'released', true,
    'producer_release', v_total_release,
    'reason', p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auto_settle_producer_events()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_event RECORD;
BEGIN
  FOR v_event IN
    SELECT id
    FROM public.producer_events
    WHERE status IN ('FINISHED', 'SETTLEMENT_PENDING')
      AND NOW() >= (data_fim + INTERVAL '48 hours')
  LOOP
    PERFORM public.release_event_funds(v_event.id, 'AUTO_48H');
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cancel_producer_event_refund_all(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
  v_refund_total NUMERIC := 0;
BEGIN
  SELECT * INTO v_event FROM public.producer_events WHERE id = p_event_id FOR UPDATE;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'Evento nao encontrado.'; END IF;

  SELECT COALESCE(SUM(amount), 0)
    INTO v_refund_total
  FROM public.ticket_purchases
  WHERE event_id = p_event_id
    AND payment_status = 'PAID'
    AND escrow_status = 'ESCROW_HELD';

  UPDATE public.ticket_purchases
  SET payment_status = 'REFUNDED',
      escrow_status = 'ESCROW_REFUNDED'
  WHERE event_id = p_event_id
    AND payment_status = 'PAID';

  UPDATE public.producer_wallet_transactions
  SET status = 'REFUNDED'
  WHERE event_id = p_event_id
    AND status IN ('HELD', 'PENDING');

  UPDATE public.affiliate_sales a
  SET payout_status = 'REFUNDED'
  FROM public.ticket_purchases p
  WHERE p.id = a.purchase_id
    AND p.event_id = p_event_id;

  UPDATE public.tickets
  SET status = 'CANCELLED'
  WHERE event_id = p_event_id
    AND status = 'VALID';

  UPDATE public.producer_events
  SET status = 'CANCELLED'
  WHERE id = p_event_id;

  INSERT INTO public.wallet_transactions (profile_id, source_type, source_id, type, amount, status, metadata)
  VALUES (v_event.producer_profile_id, 'TICKET', p_event_id, 'REFUND', -ABS(v_refund_total), 'REFUNDED', jsonb_build_object('event_cancelled', true));

  RETURN jsonb_build_object('cancelled', true, 'refund_total', v_refund_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) DASHBOARD / RELATORIOS
CREATE OR REPLACE FUNCTION public.get_producer_dashboard_stats(p_producer_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_sold BIGINT := 0;
  v_revenue NUMERIC := 0;
  v_active BIGINT := 0;
  v_capacity BIGINT := 0;
  v_conversion NUMERIC := 0;
  v_escrow NUMERIC := 0;
  v_released NUMERIC := 0;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_producer_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado para dashboard de outro produtor.';
  END IF;

  SELECT COALESCE(SUM(tb.vendidos), 0),
         COALESCE(SUM(tp.amount), 0),
         COALESCE(SUM(pe.capacidade), 0)
  INTO v_sold, v_revenue, v_capacity
  FROM public.producer_events pe
  LEFT JOIN public.ticket_batches tb ON tb.event_id = pe.id
  LEFT JOIN public.ticket_purchases tp ON tp.event_id = pe.id AND tp.payment_status = 'PAID'
  WHERE pe.producer_profile_id = p_producer_id;

  SELECT COUNT(*) INTO v_active
  FROM public.producer_events
  WHERE producer_profile_id = p_producer_id
    AND status IN ('ACTIVE_SALES', 'SOLD_OUT', 'IN_PROGRESS');

  SELECT COALESCE(SUM(producer_amount), 0) INTO v_escrow
  FROM public.ticket_purchases tp
  JOIN public.producer_events pe ON pe.id = tp.event_id
  WHERE pe.producer_profile_id = p_producer_id
    AND tp.escrow_status = 'ESCROW_HELD';

  SELECT COALESCE(SUM(producer_amount), 0) INTO v_released
  FROM public.ticket_purchases tp
  JOIN public.producer_events pe ON pe.id = tp.event_id
  WHERE pe.producer_profile_id = p_producer_id
    AND tp.escrow_status = 'ESCROW_RELEASED';

  IF v_capacity > 0 THEN
    v_conversion := ROUND((v_sold::NUMERIC / v_capacity::NUMERIC) * 100, 2);
  END IF;

  RETURN jsonb_build_object(
    'tickets_sold', v_sold,
    'gross_revenue', v_revenue,
    'conversion_rate', v_conversion,
    'active_events', v_active,
    'escrow_balance', v_escrow,
    'released_balance', v_released
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE VIEW public.producer_events_metrics AS
SELECT
  pe.id,
  pe.producer_profile_id,
  pe.contract_id,
  pe.nome,
  pe.local,
  pe.data_inicio,
  pe.data_fim,
  pe.status,
  COALESCE(SUM(tb.vendidos), 0) AS tickets_sold,
  COALESCE(SUM(tp.amount), 0) AS gross_revenue,
  COALESCE(SUM(tp.producer_amount) FILTER (WHERE tp.escrow_status = 'ESCROW_HELD'), 0) AS escrow_balance,
  COALESCE(SUM(tp.producer_amount) FILTER (WHERE tp.escrow_status = 'ESCROW_RELEASED'), 0) AS released_balance
FROM public.producer_events pe
LEFT JOIN public.ticket_batches tb ON tb.event_id = pe.id
LEFT JOIN public.ticket_purchases tp ON tp.event_id = pe.id AND tp.payment_status = 'PAID'
GROUP BY pe.id;

CREATE OR REPLACE VIEW public.my_tickets AS
SELECT
  t.id AS ticket_id,
  t.user_id,
  t.qr_code,
  t.status,
  p.id AS purchase_id,
  p.amount,
  p.payment_method,
  p.payment_status,
  pe.id AS event_id,
  pe.nome AS event_name,
  pe.data_inicio AS event_date,
  pe.local
FROM public.tickets t
JOIN public.ticket_purchases p ON p.id = t.purchase_id
JOIN public.producer_events pe ON pe.id = t.event_id;

-- 10) RLS
ALTER TABLE public.producer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS producer_events_owner_select ON public.producer_events;
CREATE POLICY producer_events_owner_select
ON public.producer_events FOR SELECT TO authenticated
USING (auth.uid() = producer_profile_id OR public.is_admin());

DROP POLICY IF EXISTS producer_events_metrics_owner_select ON public.producer_events;
CREATE POLICY producer_events_metrics_owner_select
ON public.producer_events FOR SELECT
USING (auth.uid() = producer_profile_id OR public.is_admin());

DROP POLICY IF EXISTS producer_events_owner_write ON public.producer_events;
CREATE POLICY producer_events_owner_write
ON public.producer_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = producer_profile_id);

DROP POLICY IF EXISTS ticket_batches_public_read ON public.ticket_batches;
CREATE POLICY ticket_batches_public_read
ON public.ticket_batches FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS ticket_batches_owner_write ON public.ticket_batches;
CREATE POLICY ticket_batches_owner_write
ON public.ticket_batches FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.producer_events pe
    WHERE pe.id = event_id
      AND pe.producer_profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS ticket_purchases_owner_select ON public.ticket_purchases;
CREATE POLICY ticket_purchases_owner_select
ON public.ticket_purchases FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS tickets_owner_select ON public.tickets;
CREATE POLICY tickets_owner_select
ON public.tickets FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS producer_wallet_owner_select ON public.producer_wallet_transactions;
CREATE POLICY producer_wallet_owner_select
ON public.producer_wallet_transactions FOR SELECT TO authenticated
USING (auth.uid() = producer_profile_id OR public.is_admin());
