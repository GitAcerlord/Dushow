-- ============================================================================
-- DUSHOW - Fix trigger de campos sensiveis
-- Evita bloqueio de updates internos (ex.: XP via trigger)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Permite updates internos disparados por trigger/funcoes de sistema.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF current_setting('role', true) = 'authenticated' THEN
    IF (
      NEW.role IS DISTINCT FROM OLD.role OR
      NEW.plan_tier IS DISTINCT FROM OLD.plan_tier OR
      NEW.is_verified IS DISTINCT FROM OLD.is_verified OR
      NEW.is_superstar IS DISTINCT FROM OLD.is_superstar OR
      NEW.points IS DISTINCT FROM OLD.points OR
      NEW.xp_total IS DISTINCT FROM OLD.xp_total OR
      NEW.balance_available IS DISTINCT FROM OLD.balance_available OR
      NEW.balance_pending IS DISTINCT FROM OLD.balance_pending
    ) THEN
      RAISE EXCEPTION 'Permission denied: Sensitive fields can only be modified by the system.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
