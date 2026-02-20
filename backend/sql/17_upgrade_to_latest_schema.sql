-- ============================================================================
-- DUSHOW - Upgrade consolidado para schema mais novo (idempotente)
-- ============================================================================
-- Objetivo:
-- 1) Garantir colunas modernas em contracts/profiles/mensagens/ledger
-- 2) Backfill de dados legados para colunas novas
-- 3) Garantir estruturas de notificacoes e suporte
-- 4) Fortalecer constraints e indices principais

-- ----------------------------------------------------------------------------
-- 0) Dependencias basicas
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1) PROFILES - colunas modernas
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS active_context TEXT DEFAULT 'PRO',
  ADD COLUMN IF NOT EXISTS enabled_contexts TEXT[] DEFAULT ARRAY['PRO','CONTRACTOR','PRODUCER']::TEXT[],
  ADD COLUMN IF NOT EXISTS main_event_type TEXT,
  ADD COLUMN IF NOT EXISTS pref_dark_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pref_email_notifications BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS pref_public_profile BOOLEAN DEFAULT TRUE;

-- Evita violacao do check legado profiles_client_required_ck.
UPDATE public.profiles
SET main_event_type = COALESCE(NULLIF(TRIM(main_event_type), ''), 'GERAL')
WHERE role = 'CLIENT' AND COALESCE(TRIM(main_event_type), '') = '';

-- Normaliza contexto antes de qualquer update massivo para evitar violacao de
-- constraints existentes (ex.: active_context = 'CLIENT').
UPDATE public.profiles
SET active_context = 'CONTRACTOR'
WHERE UPPER(COALESCE(active_context, '')) = 'CLIENT';

UPDATE public.profiles
SET active_context = CASE
  WHEN UPPER(COALESCE(active_context, '')) IN ('PRO', 'CONTRACTOR', 'PRODUCER') THEN UPPER(active_context)
  ELSE 'PRO'
END;

UPDATE public.profiles
SET enabled_contexts = COALESCE(enabled_contexts, ARRAY['PRO','CONTRACTOR','PRODUCER']::TEXT[])
WHERE enabled_contexts IS NULL;

UPDATE public.profiles
SET enabled_contexts = array_replace(enabled_contexts, 'CLIENT', 'CONTRACTOR')
WHERE enabled_contexts @> ARRAY['CLIENT']::TEXT[];

UPDATE public.profiles
SET enabled_contexts = CASE
  WHEN active_context = ANY(enabled_contexts) THEN enabled_contexts
  ELSE array_prepend(active_context, enabled_contexts)
END;

UPDATE public.profiles
SET user_id = id
WHERE user_id IS NULL;

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

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_active_context_ck,
  ADD CONSTRAINT profiles_active_context_ck
  CHECK (active_context IN ('PRO', 'CONTRACTOR', 'PRODUCER')) NOT VALID;

-- ----------------------------------------------------------------------------
-- 2) CONTRACTS - schema moderno + compatibilidade legado
-- ----------------------------------------------------------------------------
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
  ADD COLUMN IF NOT EXISTS contratante_profile_id UUID,
  ADD COLUMN IF NOT EXISTS profissional_profile_id UUID,
  ADD COLUMN IF NOT EXISTS created_by_profile_id UUID,
  ADD COLUMN IF NOT EXISTS valor_atual NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS data_evento TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS local TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS status_master public.contract_status_master,
  ADD COLUMN IF NOT EXISTS status_v1 TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS event_location TEXT;

-- Desarma checks legados durante migração de backfill.
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_created_by_required_ck,
  DROP CONSTRAINT IF EXISTS contracts_required_fields_ck,
  DROP CONSTRAINT IF EXISTS contracts_status_check;

-- Remove qualquer CHECK legado relacionado a status/created_by (nomes variam por ambiente).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'contracts'
      AND c.contype = 'c'
      AND (
        pg_get_constraintdef(c.oid) ILIKE '%status%'
        OR pg_get_constraintdef(c.oid) ILIKE '%created_by_profile_id%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Evita falha de trigger legado durante o backfill de status_master.
DROP TRIGGER IF EXISTS tr_log_contract_master_state ON public.contracts;

CREATE OR REPLACE FUNCTION public.log_contract_master_state()
RETURNS TRIGGER AS $$
DECLARE
  v_old_value NUMERIC := COALESCE(
    OLD.valor_atual,
    NULLIF(to_jsonb(OLD)->>'value', '')::NUMERIC,
    0
  );
  v_new_value NUMERIC := COALESCE(
    NEW.valor_atual,
    NULLIF(to_jsonb(NEW)->>'value', '')::NUMERIC,
    0
  );
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
      v_old_value,
      v_new_value,
      jsonb_build_object('source', 'trigger')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
  has_client_id BOOLEAN;
  has_pro_id BOOLEAN;
  has_value BOOLEAN;
  has_proposed_value BOOLEAN;
  has_event_date BOOLEAN;
  has_contract_text BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'client_id'
  ) INTO has_client_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'pro_id'
  ) INTO has_pro_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'value'
  ) INTO has_value;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'proposed_value'
  ) INTO has_proposed_value;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'event_date'
  ) INTO has_event_date;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'contract_text'
  ) INTO has_contract_text;

  IF has_client_id THEN
    EXECUTE '
      UPDATE public.contracts
      SET contratante_profile_id = COALESCE(contratante_profile_id, client_id)
      WHERE contratante_profile_id IS NULL';
  END IF;

  IF has_pro_id THEN
    EXECUTE '
      UPDATE public.contracts
      SET profissional_profile_id = COALESCE(profissional_profile_id, pro_id)
      WHERE profissional_profile_id IS NULL';
  END IF;

  IF has_client_id THEN
    EXECUTE '
      UPDATE public.contracts
      SET created_by_profile_id = COALESCE(created_by_profile_id, contratante_profile_id, client_id)
      WHERE created_by_profile_id IS NULL';
  ELSE
    EXECUTE '
      UPDATE public.contracts
      SET created_by_profile_id = COALESCE(created_by_profile_id, contratante_profile_id, profissional_profile_id)
      WHERE created_by_profile_id IS NULL';
  END IF;

  IF has_value AND has_proposed_value THEN
    EXECUTE '
      UPDATE public.contracts
      SET valor_atual = COALESCE(valor_atual, value, proposed_value, 0)
      WHERE valor_atual IS NULL';
  ELSIF has_value THEN
    EXECUTE '
      UPDATE public.contracts
      SET valor_atual = COALESCE(valor_atual, value, 0)
      WHERE valor_atual IS NULL';
  ELSIF has_proposed_value THEN
    EXECUTE '
      UPDATE public.contracts
      SET valor_atual = COALESCE(valor_atual, proposed_value, 0)
      WHERE valor_atual IS NULL';
  ELSE
    EXECUTE '
      UPDATE public.contracts
      SET valor_atual = COALESCE(valor_atual, 0)
      WHERE valor_atual IS NULL';
  END IF;

  IF has_event_date THEN
    EXECUTE '
      UPDATE public.contracts
      SET data_evento = COALESCE(data_evento, event_date)
      WHERE data_evento IS NULL';
  END IF;

  EXECUTE '
    UPDATE public.contracts
    SET local = COALESCE(local, event_location)
    WHERE local IS NULL';

  IF has_contract_text THEN
    EXECUTE '
      UPDATE public.contracts
      SET descricao = COALESCE(descricao, contract_text)
      WHERE descricao IS NULL';
  END IF;

  IF has_value THEN
    EXECUTE '
      UPDATE public.contracts
      SET value = COALESCE(value, valor_atual, 0)
      WHERE value IS NULL';
  END IF;
END $$;

-- Fallback final para qualquer linha ainda sem created_by_profile_id.
UPDATE public.contracts
SET created_by_profile_id = COALESCE(
  created_by_profile_id,
  contratante_profile_id,
  profissional_profile_id
)
WHERE created_by_profile_id IS NULL;

UPDATE public.contracts
SET status_master = CASE UPPER(COALESCE(status, ''))
  WHEN 'PROPOSTO' THEN 'PROPOSTO'::public.contract_status_master
  WHEN 'PROPOSTA_ENVIADA' THEN 'PROPOSTO'::public.contract_status_master
  WHEN 'PENDING' THEN 'PROPOSTO'::public.contract_status_master
  WHEN 'COUNTER_PROPOSAL' THEN 'CONTRAPROPOSTA'::public.contract_status_master
  WHEN 'CONTRAPROPOSTA' THEN 'CONTRAPROPOSTA'::public.contract_status_master
  WHEN 'ACEITO' THEN 'AGUARDANDO_PAGAMENTO'::public.contract_status_master
  WHEN 'ACCEPTED' THEN 'AGUARDANDO_PAGAMENTO'::public.contract_status_master
  WHEN 'ASSINADO' THEN 'AGUARDANDO_PAGAMENTO'::public.contract_status_master
  WHEN 'AGUARDANDO_PAGAMENTO' THEN 'AGUARDANDO_PAGAMENTO'::public.contract_status_master
  WHEN 'PAGO' THEN 'PAGO_ESCROW'::public.contract_status_master
  WHEN 'PAID' THEN 'PAGO_ESCROW'::public.contract_status_master
  WHEN 'PAGO_ESCROW' THEN 'PAGO_ESCROW'::public.contract_status_master
  WHEN 'EM_EXECUCAO' THEN 'EM_EXECUCAO'::public.contract_status_master
  WHEN 'COMPLETED' THEN 'CONCLUIDO'::public.contract_status_master
  WHEN 'CONCLUIDO' THEN 'CONCLUIDO'::public.contract_status_master
  WHEN 'LIBERADO_FINANCEIRO' THEN 'LIBERADO_FINANCEIRO'::public.contract_status_master
  WHEN 'DISPUTED' THEN 'EM_MEDIACAO'::public.contract_status_master
  WHEN 'EM_MEDIACAO' THEN 'EM_MEDIACAO'::public.contract_status_master
  WHEN 'CANCELED' THEN 'CANCELADO'::public.contract_status_master
  WHEN 'CANCELLED' THEN 'CANCELADO'::public.contract_status_master
  WHEN 'CANCELADO' THEN 'CANCELADO'::public.contract_status_master
  WHEN 'REJECTED' THEN 'CANCELADO'::public.contract_status_master
  WHEN 'REJEITADO' THEN 'CANCELADO'::public.contract_status_master
  WHEN 'REFUNDED' THEN 'CANCELADO'::public.contract_status_master
  ELSE 'PROPOSTO'::public.contract_status_master
END
WHERE status_master IS NULL
   OR status_master::TEXT NOT IN (
     'PROPOSTO','CONTRAPROPOSTA','AGUARDANDO_PAGAMENTO','PAGO_ESCROW',
     'EM_EXECUCAO','CONCLUIDO','LIBERADO_FINANCEIRO','EM_MEDIACAO','CANCELADO'
   );

UPDATE public.contracts
SET status = COALESCE(status_master::TEXT, status, 'PROPOSTO');

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_status_check;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_status_check
  CHECK (
    UPPER(COALESCE(status, '')) IN (
      'PROPOSTO', 'CONTRAPROPOSTA', 'AGUARDANDO_PAGAMENTO', 'PAGO_ESCROW', 'EM_EXECUCAO',
      'CONCLUIDO', 'LIBERADO_FINANCEIRO', 'EM_MEDIACAO', 'CANCELADO',
      'PROPOSTA_ENVIADA', 'ACEITO', 'ASSINADO', 'PAGO', 'REJEITADO', 'REJECTED', 'REFUNDED',
      'PENDING', 'ACCEPTED', 'PAID', 'COMPLETED', 'DISPUTED', 'CANCELED', 'CANCELLED', 'COUNTER_PROPOSAL'
    )
  ) NOT VALID;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS check_different_parties,
  DROP CONSTRAINT IF EXISTS contracts_parties_distinct_guard,
  DROP CONSTRAINT IF EXISTS contracts_profiles_distinct_ck,
  ADD CONSTRAINT check_different_parties
  CHECK (
    contratante_profile_id IS NULL OR profissional_profile_id IS NULL
    OR contratante_profile_id <> profissional_profile_id
  ) NOT VALID;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_created_by_required_ck
  CHECK (created_by_profile_id IS NOT NULL) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_contracts_contratante_profile_id ON public.contracts(contratante_profile_id);
CREATE INDEX IF NOT EXISTS idx_contracts_profissional_profile_id ON public.contracts(profissional_profile_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status_master ON public.contracts(status_master);
CREATE INDEX IF NOT EXISTS idx_contracts_data_evento ON public.contracts(data_evento);

-- ----------------------------------------------------------------------------
-- 2.1) CONTRACT HISTORY - garante colunas modernas para trilha de auditoria
-- ----------------------------------------------------------------------------
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

ALTER TABLE public.contract_history
  ADD COLUMN IF NOT EXISTS performed_by_profile_id UUID,
  ADD COLUMN IF NOT EXISTS old_status TEXT,
  ADD COLUMN IF NOT EXISTS new_status TEXT,
  ADD COLUMN IF NOT EXISTS old_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS new_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_contract_history_contract_id ON public.contract_history(contract_id, created_at DESC);

DROP TRIGGER IF EXISTS tr_log_contract_master_state ON public.contracts;
CREATE TRIGGER tr_log_contract_master_state
AFTER UPDATE OF status_master ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.log_contract_master_state();

-- ----------------------------------------------------------------------------
-- 3) LEDGER/WALLET e operacao financeira
-- ----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_profile_id ON public.wallet_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_source ON public.wallet_transactions(source_type, source_id);

-- ----------------------------------------------------------------------------
-- 4) Tabelas administrativas (settings/notificacoes/suporte)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_platform_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SYSTEM',
  link TEXT,
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'OPEN',
  source_context TEXT,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_admin_reply BOOLEAN NOT NULL DEFAULT FALSE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON public.support_tickets(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at ASC);

-- ----------------------------------------------------------------------------
-- 5) Mensagens e leitura de chat
-- ----------------------------------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS block_reason TEXT,
  ADD COLUMN IF NOT EXISTS original_content_hidden TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_contract_id ON public.messages(contract_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- ----------------------------------------------------------------------------
-- 6) RLS reforcado (somente se public.is_admin existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.admin_platform_settings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS notifications_select_owner ON public.notifications;
    CREATE POLICY notifications_select_owner
    ON public.notifications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

    DROP POLICY IF EXISTS notifications_update_owner ON public.notifications;
    CREATE POLICY notifications_update_owner
    ON public.notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

    DROP POLICY IF EXISTS notifications_insert_admin_or_system ON public.notifications;
    CREATE POLICY notifications_insert_admin_or_system
    ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR auth.uid() = user_id);

    DROP POLICY IF EXISTS support_tickets_select_owner_or_admin ON public.support_tickets;
    CREATE POLICY support_tickets_select_owner_or_admin
    ON public.support_tickets
    FOR SELECT TO authenticated
    USING (requester_id = auth.uid() OR public.is_admin());

    DROP POLICY IF EXISTS support_tickets_insert_owner ON public.support_tickets;
    CREATE POLICY support_tickets_insert_owner
    ON public.support_tickets
    FOR INSERT TO authenticated
    WITH CHECK (requester_id = auth.uid());

    DROP POLICY IF EXISTS support_tickets_update_owner_or_admin ON public.support_tickets;
    CREATE POLICY support_tickets_update_owner_or_admin
    ON public.support_tickets
    FOR UPDATE TO authenticated
    USING (requester_id = auth.uid() OR public.is_admin())
    WITH CHECK (requester_id = auth.uid() OR public.is_admin());

    DROP POLICY IF EXISTS support_ticket_messages_select_owner_or_admin ON public.support_ticket_messages;
    CREATE POLICY support_ticket_messages_select_owner_or_admin
    ON public.support_ticket_messages
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.support_tickets t
        WHERE t.id = ticket_id
          AND (t.requester_id = auth.uid() OR public.is_admin())
      )
    );

    DROP POLICY IF EXISTS support_ticket_messages_insert_owner_or_admin ON public.support_ticket_messages;
    CREATE POLICY support_ticket_messages_insert_owner_or_admin
    ON public.support_ticket_messages
    FOR INSERT TO authenticated
    WITH CHECK (
      author_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.support_tickets t
        WHERE t.id = ticket_id
          AND (t.requester_id = auth.uid() OR public.is_admin())
      )
    );

    DROP POLICY IF EXISTS admin_platform_settings_read ON public.admin_platform_settings;
    CREATE POLICY admin_platform_settings_read
    ON public.admin_platform_settings
    FOR SELECT TO authenticated
    USING (public.is_admin());

    DROP POLICY IF EXISTS admin_platform_settings_write ON public.admin_platform_settings;
    CREATE POLICY admin_platform_settings_write
    ON public.admin_platform_settings
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS admin_platform_settings_update ON public.admin_platform_settings;
    CREATE POLICY admin_platform_settings_update
    ON public.admin_platform_settings
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;
