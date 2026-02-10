-- 1. Update protect_profile_fields trigger to include financial columns
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if the update is coming from a standard 'authenticated' user (client-side API)
  IF (current_setting('role') = 'authenticated') THEN
    IF (NEW.role IS DISTINCT FROM OLD.role OR
        NEW.plan_tier IS DISTINCT FROM OLD.plan_tier OR
        NEW.is_verified IS DISTINCT FROM OLD.is_verified OR
        NEW.is_superstar IS DISTINCT FROM OLD.is_superstar OR
        NEW.points IS DISTINCT FROM OLD.points OR
        NEW.xp_total IS DISTINCT FROM OLD.xp_total OR
        NEW.balance_available IS DISTINCT FROM OLD.balance_available OR
        NEW.balance_pending IS DISTINCT FROM OLD.balance_pending) THEN
      RAISE EXCEPTION 'Permission denied: Sensitive fields can only be modified by the system.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Secure xp_transactions RLS (Disable client-side INSERT)
DROP POLICY IF EXISTS "Users see own XP" ON xp_transactions;
CREATE POLICY "Users see own XP" ON xp_transactions FOR SELECT TO authenticated USING (auth.uid() = profile_id);
-- Note: No INSERT policy for authenticated users means only service_role (Edge Functions/Triggers) can insert.

-- 3. Automated XP for Posts (Server-side)
CREATE OR REPLACE FUNCTION public.handle_post_xp()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.xp_transactions (profile_id, action, points)
  VALUES (NEW.author_id, 'POST_CREATED', 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_post_xp ON posts;
CREATE TRIGGER tr_post_xp
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_xp();

-- 4. Automated XP for Indications (Server-side)
CREATE OR REPLACE FUNCTION public.handle_indication_xp()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.xp_transactions (profile_id, action, points)
  VALUES (NEW.profile_id, 'COMPANY_INDICATION', 20);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_indication_xp ON company_indications;
CREATE TRIGGER tr_indication_xp
  AFTER INSERT ON company_indications
  FOR EACH ROW EXECUTE FUNCTION public.handle_indication_xp();

-- 5. Automated Balance Deduction on Withdrawal Request (Server-side)
CREATE OR REPLACE FUNCTION public.handle_withdrawal_deduction()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify if user has enough balance before allowing the insert
  IF (SELECT balance_available FROM public.profiles WHERE id = NEW.user_id) < NEW.amount THEN
    RAISE EXCEPTION 'Saldo insuficiente para realizar este saque.';
  END IF;

  UPDATE public.profiles
  SET balance_available = balance_available - NEW.amount
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_withdrawal_deduction ON withdrawals;
CREATE TRIGGER tr_withdrawal_deduction
  BEFORE INSERT ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_deduction();