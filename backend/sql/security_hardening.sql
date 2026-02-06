-- Function to prevent unauthorized updates to sensitive columns
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the update is coming from a standard 'authenticated' user (client-side API)
  -- We allow the service_role (system) to make these changes.
  IF (current_setting('role') = 'authenticated') THEN
    IF (NEW.role IS DISTINCT FROM OLD.role OR
        NEW.plan_tier IS DISTINCT FROM OLD.plan_tier OR
        NEW.is_verified IS DISTINCT FROM OLD.is_verified OR
        NEW.is_superstar IS DISTINCT FROM OLD.is_superstar OR
        NEW.points IS DISTINCT FROM OLD.points OR
        NEW.xp_total IS DISTINCT FROM OLD.xp_total) THEN
      RAISE EXCEPTION 'Permission denied: Sensitive fields can only be modified by the system.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the profiles table
DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();