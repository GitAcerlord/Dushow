-- ============================================================================
-- DUSHOW - Admin platform settings table
-- Persistencia de configuracoes globais do painel administrativo
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_platform_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.touch_admin_platform_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_touch_admin_platform_settings ON public.admin_platform_settings;
CREATE TRIGGER tr_touch_admin_platform_settings
BEFORE UPDATE ON public.admin_platform_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_admin_platform_settings();

ALTER TABLE public.admin_platform_settings ENABLE ROW LEVEL SECURITY;

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
