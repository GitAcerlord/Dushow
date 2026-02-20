-- ============================================================================
-- DUSHOW - Tickets de Suporte (Usuario <-> Admin)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON public.support_tickets (requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages (ticket_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.touch_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_touch_support_ticket_updated_at ON public.support_tickets;
CREATE TRIGGER tr_touch_support_ticket_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.touch_support_ticket_updated_at();

CREATE OR REPLACE FUNCTION public.bump_support_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_bump_support_ticket_on_message ON public.support_ticket_messages;
CREATE TRIGGER tr_bump_support_ticket_on_message
AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_support_ticket_on_message();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

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
WITH CHECK (
  requester_id = auth.uid()
  OR public.is_admin()
);

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
