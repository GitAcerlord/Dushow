-- ============================================================================
-- DUSHOW - Compatibilidade de contratos (schema legado)
-- Corrige erro: record "new" has no field "local"
-- ============================================================================

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS local TEXT,
  ADD COLUMN IF NOT EXISTS event_location TEXT;

CREATE OR REPLACE FUNCTION public.ensure_client_event_for_contract()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_local TEXT;
  v_event_location TEXT;
BEGIN
  IF NEW.client_event_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Usa JSON do NEW para evitar falha em ambientes onde alguma coluna ainda nao existe no record tipado.
  v_local := COALESCE(to_jsonb(NEW)->>'local', '');
  v_event_location := COALESCE(to_jsonb(NEW)->>'event_location', '');

  SELECT id
    INTO v_event_id
  FROM public.client_events
  WHERE contratante_profile_id = NEW.contratante_profile_id
    AND LOWER(name) = LOWER(COALESCE(NEW.event_name, ''))
    AND event_date::date = NEW.data_evento::date
    AND LOWER(location) = LOWER(COALESCE(NULLIF(v_local, ''), NULLIF(v_event_location, ''), ''))
  LIMIT 1;

  IF v_event_id IS NULL THEN
    INSERT INTO public.client_events (contratante_profile_id, name, event_date, location, status)
    VALUES (
      NEW.contratante_profile_id,
      COALESCE(NEW.event_name, 'Evento'),
      NEW.data_evento,
      COALESCE(NULLIF(v_local, ''), NULLIF(v_event_location, ''), 'Local a definir'),
      'EM_NEGOCIACAO'
    )
    RETURNING id INTO v_event_id;
  END IF;

  NEW.client_event_id := v_event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
