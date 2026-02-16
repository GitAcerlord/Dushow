-- ============================================================================
-- DUSHOW - Compatibilidade de Configuracoes de Perfil
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pref_dark_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pref_email_notifications BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS pref_public_profile BOOLEAN DEFAULT TRUE;
