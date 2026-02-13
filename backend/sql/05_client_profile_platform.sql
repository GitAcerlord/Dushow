-- ============================================================================
-- DUSHOW - Perfil Contratante v1
-- Regras de negocio para cliente: identidade, eventos, favoritos e antifraude
-- ============================================================================

-- 1) PERFIL CONTRATANTE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contractor_type TEXT,
  ADD COLUMN IF NOT EXISTS main_event_type TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_document_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS pro_ranking_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_client_required_ck,
  ADD CONSTRAINT profiles_client_required_ck
  CHECK (
    role <> 'CLIENT'
    OR (
      COALESCE(full_name, '') <> ''
      AND COALESCE(location, '') <> ''
      AND COALESCE(main_event_type, '') <> ''
    )
  ) NOT VALID;

-- 2) EVENTOS AGREGADOS DO CONTRATANTE
CREATE TABLE IF NOT EXISTS public.client_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contratante_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANEJAMENTO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_events_contratante ON public.client_events(contratante_profile_id);
CREATE INDEX IF NOT EXISTS idx_client_events_event_date ON public.client_events(event_date);

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS client_event_id UUID REFERENCES public.client_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS proposed_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_client_event_id ON public.contracts(client_event_id);

CREATE OR REPLACE FUNCTION public.touch_client_event()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_touch_client_event ON public.client_events;
CREATE TRIGGER tr_touch_client_event
BEFORE UPDATE ON public.client_events
FOR EACH ROW EXECUTE FUNCTION public.touch_client_event();

CREATE OR REPLACE FUNCTION public.ensure_client_event_for_contract()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
BEGIN
  IF NEW.client_event_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id
    INTO v_event_id
  FROM public.client_events
  WHERE contratante_profile_id = NEW.contratante_profile_id
    AND LOWER(name) = LOWER(COALESCE(NEW.event_name, ''))
    AND event_date::date = NEW.data_evento::date
    AND LOWER(location) = LOWER(COALESCE(NEW.local, NEW.event_location, ''))
  LIMIT 1;

  IF v_event_id IS NULL THEN
    INSERT INTO public.client_events (contratante_profile_id, name, event_date, location, status)
    VALUES (
      NEW.contratante_profile_id,
      COALESCE(NEW.event_name, 'Evento'),
      NEW.data_evento,
      COALESCE(NEW.local, NEW.event_location, 'Local a definir'),
      'EM_NEGOCIACAO'
    )
    RETURNING id INTO v_event_id;
  END IF;

  NEW.client_event_id := v_event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ensure_client_event_for_contract ON public.contracts;
CREATE TRIGGER tr_ensure_client_event_for_contract
BEFORE INSERT ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.ensure_client_event_for_contract();

CREATE OR REPLACE FUNCTION public.recompute_client_event_status(p_event_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INT := 0;
  v_negotiation INT := 0;
  v_confirmed INT := 0;
  v_paid INT := 0;
  v_finished INT := 0;
  v_min_date TIMESTAMPTZ;
  v_status TEXT := 'PLANEJAMENTO';
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('PROPOSTO', 'CONTRAPROPOSTA', 'AGUARDANDO_PAGAMENTO')),
    COUNT(*) FILTER (WHERE status IN ('PAGO_ESCROW', 'EM_EXECUCAO')),
    COUNT(*) FILTER (WHERE status IN ('LIBERADO_FINANCEIRO')),
    COUNT(*) FILTER (WHERE status IN ('CONCLUIDO', 'LIBERADO_FINANCEIRO', 'REJEITADO', 'CANCELADO')),
    MIN(data_evento)
  INTO v_total, v_negotiation, v_confirmed, v_paid, v_finished, v_min_date
  FROM public.contracts
  WHERE client_event_id = p_event_id;

  IF v_total = 0 THEN
    v_status := 'PLANEJAMENTO';
  ELSIF v_finished = v_total THEN
    v_status := 'FINALIZADO';
  ELSIF v_paid > 0 AND COALESCE(v_min_date, NOW() + INTERVAL '1 day') <= NOW() THEN
    v_status := 'EM_EXECUCAO';
  ELSIF (v_confirmed + v_paid) > 0 THEN
    v_status := 'CONFIRMADO';
  ELSIF v_negotiation > 0 THEN
    v_status := 'EM_NEGOCIACAO';
  ELSE
    v_status := 'PLANEJAMENTO';
  END IF;

  UPDATE public.client_events
  SET status = v_status, updated_at = NOW()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.on_contract_recompute_event_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.client_event_id IS NOT NULL THEN
      PERFORM public.recompute_client_event_status(OLD.client_event_id);
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.client_event_id IS NOT NULL THEN
    PERFORM public.recompute_client_event_status(NEW.client_event_id);
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.client_event_id IS DISTINCT FROM NEW.client_event_id AND OLD.client_event_id IS NOT NULL THEN
    PERFORM public.recompute_client_event_status(OLD.client_event_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_contract_recompute_event_status ON public.contracts;
CREATE TRIGGER tr_contract_recompute_event_status
AFTER INSERT OR UPDATE OR DELETE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.on_contract_recompute_event_status();

-- 3) FAVORITOS E FUNIL DE CONTRATACAO
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique_pair ON public.favorites(user_id, artist_id);
CREATE INDEX IF NOT EXISTS idx_favorites_artist_id ON public.favorites(artist_id);

CREATE OR REPLACE FUNCTION public.on_favorite_update_pro_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET pro_ranking_score = COALESCE(pro_ranking_score, 0) + 3
    WHERE id = NEW.artist_id;
    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET pro_ranking_score = GREATEST(0, COALESCE(pro_ranking_score, 0) - 3)
  WHERE id = OLD.artist_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_favorite_update_pro_score ON public.favorites;
CREATE TRIGGER tr_favorite_update_pro_score
AFTER INSERT OR DELETE ON public.favorites
FOR EACH ROW EXECUTE FUNCTION public.on_favorite_update_pro_score();

-- 4) NOTIFICACOES PARA FAVORITOS
CREATE OR REPLACE FUNCTION public.notify_favoriters_on_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, type, link)
  SELECT f.user_id,
         'Novo post do favorito',
         'Um profissional que voce favoritou publicou no feed.',
         'FAVORITE_ACTIVITY',
         '/app/feed'
  FROM public.favorites f
  WHERE f.artist_id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_favoriters_on_post ON public.posts;
CREATE TRIGGER tr_notify_favoriters_on_post
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.notify_favoriters_on_post();

CREATE OR REPLACE FUNCTION public.notify_favoriters_on_price_drop()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.base_fee, 0) < COALESCE(OLD.base_fee, 0) THEN
    INSERT INTO public.notifications (user_id, title, content, type, link)
    SELECT f.user_id,
           'Preco reduzido',
           'Um profissional favorito reduziu o cache base.',
           'FAVORITE_PRICE_DROP',
           '/app/artist/' || NEW.id::TEXT
    FROM public.favorites f
    WHERE f.artist_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_favoriters_on_price_drop ON public.profiles;
CREATE TRIGGER tr_notify_favoriters_on_price_drop
AFTER UPDATE OF base_fee ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_favoriters_on_price_drop();

CREATE OR REPLACE FUNCTION public.notify_favoriters_on_availability_open()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, type, link)
  SELECT f.user_id,
         'Agenda aberta',
         'Um profissional favorito abriu disponibilidade na agenda.',
         'FAVORITE_AVAILABILITY',
         '/app/artist/' || OLD.profile_id::TEXT
  FROM public.favorites f
  WHERE f.artist_id = OLD.profile_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_favoriters_on_availability_open ON public.availability_blocks;
CREATE TRIGGER tr_notify_favoriters_on_availability_open
AFTER DELETE ON public.availability_blocks
FOR EACH ROW EXECUTE FUNCTION public.notify_favoriters_on_availability_open();

-- 5) AVALIACAO DO CONTRATANTE APENAS APOS CONCLUIDO
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS punctuality INTEGER,
  ADD COLUMN IF NOT EXISTS quality INTEGER,
  ADD COLUMN IF NOT EXISTS professionalism INTEGER,
  ADD COLUMN IF NOT EXISTS communication INTEGER;

CREATE OR REPLACE FUNCTION public.validate_client_review_contract_status()
RETURNS TRIGGER AS $$
DECLARE
  v_contract RECORD;
BEGIN
  SELECT id, status, contratante_profile_id, profissional_profile_id
    INTO v_contract
  FROM public.contracts
  WHERE id = NEW.contract_id;

  IF v_contract.id IS NULL THEN
    RAISE EXCEPTION 'Contrato da avaliacao nao encontrado.';
  END IF;
  IF v_contract.status <> 'CONCLUIDO' THEN
    RAISE EXCEPTION 'Avaliacao so e permitida com contrato CONCLUIDO.';
  END IF;
  IF NEW.client_id <> v_contract.contratante_profile_id THEN
    RAISE EXCEPTION 'Somente o contratante do contrato pode avaliar.';
  END IF;
  IF NEW.pro_id <> v_contract.profissional_profile_id THEN
    RAISE EXCEPTION 'Avaliacao deve apontar para o profissional do contrato.';
  END IF;

  IF NEW.rating IS NULL THEN
    NEW.rating := ROUND((
      COALESCE(NEW.punctuality, 0) +
      COALESCE(NEW.quality, 0) +
      COALESCE(NEW.professionalism, 0) +
      COALESCE(NEW.communication, 0)
    )::NUMERIC / 4.0, 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_validate_client_review_contract_status ON public.reviews;
CREATE TRIGGER tr_validate_client_review_contract_status
BEFORE INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_client_review_contract_status();

-- 6) ANTIFRAUDE PARA CONTRATANTE
CREATE TABLE IF NOT EXISTS public.antifraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_antifraud_flags_profile_id ON public.antifraud_flags(profile_id);

CREATE OR REPLACE FUNCTION public.flag_excessive_client_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_count INT;
BEGIN
  IF NEW.status = 'CANCELADO' AND COALESCE(OLD.status, '') <> 'CANCELADO' THEN
    SELECT COUNT(*) INTO v_recent_count
    FROM public.contracts
    WHERE contratante_profile_id = NEW.contratante_profile_id
      AND status = 'CANCELADO'
      AND created_at >= NOW() - INTERVAL '30 days';

    IF v_recent_count >= 3 THEN
      INSERT INTO public.antifraud_flags (profile_id, reason, severity, metadata)
      VALUES (
        NEW.contratante_profile_id,
        'Excesso de cancelamentos recentes',
        'HIGH',
        jsonb_build_object('count_30d', v_recent_count)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_flag_excessive_client_cancellation ON public.contracts;
CREATE TRIGGER tr_flag_excessive_client_cancellation
AFTER UPDATE OF status ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.flag_excessive_client_cancellation();

-- 7) DASHBOARD REAL (RPC)
CREATE OR REPLACE FUNCTION public.get_client_dashboard_stats(p_client_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total NUMERIC := 0;
  v_confirmed INT := 0;
  v_pending INT := 0;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_client_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado para dashboard de outro perfil.';
  END IF;

  SELECT COALESCE(SUM(COALESCE(valor_atual, value, 0)), 0)
    INTO v_total
  FROM public.contracts
  WHERE contratante_profile_id = p_client_id
    AND status IN ('AGUARDANDO_PAGAMENTO', 'PAGO_ESCROW', 'EM_EXECUCAO', 'CONCLUIDO', 'LIBERADO_FINANCEIRO');

  SELECT COUNT(*)
    INTO v_confirmed
  FROM public.contracts
  WHERE contratante_profile_id = p_client_id
    AND status IN ('AGUARDANDO_PAGAMENTO', 'PAGO_ESCROW', 'EM_EXECUCAO', 'CONCLUIDO', 'LIBERADO_FINANCEIRO');

  SELECT COUNT(*)
    INTO v_pending
  FROM public.contracts
  WHERE contratante_profile_id = p_client_id
    AND status IN ('PROPOSTO', 'CONTRAPROPOSTA');

  RETURN jsonb_build_object(
    'total_investido', v_total,
    'eventos_confirmados', v_confirmed,
    'propostas_pendentes', v_pending
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE VIEW public.client_events_summary AS
SELECT
  e.id,
  e.contratante_profile_id,
  e.name,
  e.event_date,
  e.location,
  e.status,
  COUNT(c.id) AS total_contracts,
  COUNT(c.id) FILTER (WHERE c.status IN ('AGUARDANDO_PAGAMENTO', 'PAGO_ESCROW', 'EM_EXECUCAO', 'CONCLUIDO', 'LIBERADO_FINANCEIRO')) AS confirmed_contracts,
  COALESCE(SUM(COALESCE(c.valor_atual, c.value, 0)), 0) AS total_value,
  e.updated_at
FROM public.client_events e
LEFT JOIN public.contracts c ON c.client_event_id = e.id
GROUP BY e.id;

-- 8) RLS BASICO
ALTER TABLE public.client_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.antifraud_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_events_owner_select ON public.client_events;
CREATE POLICY client_events_owner_select
ON public.client_events FOR SELECT TO authenticated
USING (auth.uid() = contratante_profile_id OR public.is_admin());

DROP POLICY IF EXISTS client_events_owner_write ON public.client_events;
CREATE POLICY client_events_owner_write
ON public.client_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = contratante_profile_id);

DROP POLICY IF EXISTS client_events_owner_update ON public.client_events;
CREATE POLICY client_events_owner_update
ON public.client_events FOR UPDATE TO authenticated
USING (auth.uid() = contratante_profile_id OR public.is_admin());

DROP POLICY IF EXISTS antifraud_admin_only ON public.antifraud_flags;
CREATE POLICY antifraud_admin_only
ON public.antifraud_flags FOR SELECT TO authenticated
USING (public.is_admin());
