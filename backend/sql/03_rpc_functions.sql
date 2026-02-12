-- ============================================================================
-- RPC FUNCTIONS - Operações de negócio necessárias
-- ============================================================================

-- ============================================================================
-- 1. FUNÇÕES DE VERIFICAÇÃO
-- ============================================================================

-- Verifica se o usuário é admin (já deve existir)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'ADMIN' OR is_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. FUNÇÕES DE SALDO E FINANCEIRO
-- ============================================================================

-- Incrementa saldo pendente do artista (quando recebe um pagamento)
CREATE OR REPLACE FUNCTION public.increment_pending_balance(artist_id UUID, amount DECIMAL)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_new_balance DECIMAL;
BEGIN
  -- Atualiza ou cria registro de saldo pendente
  INSERT INTO public.financial_ledger (
    user_id,
    amount,
    type,
    description,
    created_at
  ) VALUES (
    artist_id,
    amount,
    'CREDIT',
    'Credited to pending balance',
    NOW()
  );

  -- Retorna o novo saldo
  SELECT COALESCE(SUM(amount), 0) INTO v_new_balance
  FROM public.financial_ledger
  WHERE user_id = artist_id;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Balance incremented',
    'pending_balance', v_new_balance,
    'amount_added', amount
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrementa saldo pendente (quando refunda)
CREATE OR REPLACE FUNCTION public.decrement_pending_balance(artist_id UUID, amount DECIMAL)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_new_balance DECIMAL;
BEGIN
  -- Insere ledger entry negativa
  INSERT INTO public.financial_ledger (
    user_id,
    amount,
    type,
    description,
    created_at
  ) VALUES (
    artist_id,
    -amount,
    'DEBIT',
    'Refunded/Decremented from pending balance',
    NOW()
  );

  -- Retorna novo saldo
  SELECT COALESCE(SUM(amount), 0) INTO v_new_balance
  FROM public.financial_ledger
  WHERE user_id = artist_id;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Balance decremented',
    'pending_balance', v_new_balance,
    'amount_removed', amount
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Libera fundos para saque (quando contrato é completado)
CREATE OR REPLACE FUNCTION public.release_artist_funds(artist_id UUID, amount DECIMAL)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_pending_balance DECIMAL;
BEGIN
  -- Calcula saldo pendente atual
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_balance
  FROM public.financial_ledger
  WHERE user_id = artist_id;

  -- Verifica se há saldo suficiente
  IF v_pending_balance < amount THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Insufficient pending balance',
      'pending_balance', v_pending_balance,
      'requested_amount', amount
    );
    RETURN v_result;
  END IF;

  -- Registra liberação no ledger
  INSERT INTO public.financial_ledger (
    user_id,
    amount,
    type,
    description,
    confirmed_at,
    created_at
  ) VALUES (
    artist_id,
    amount,
    'RELEASE',
    'Funds released for withdrawal',
    NOW(),
    NOW()
  );

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Funds released successfully',
    'released_amount', amount,
    'remaining_balance', v_pending_balance - amount
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. FUNÇÕES DE ESTATÍSTICAS
-- ============================================================================

-- Obter saldo total do artista
CREATE OR REPLACE FUNCTION public.get_artist_balance(artist_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_balance DECIMAL;
  v_pending DECIMAL;
  v_released DECIMAL;
  v_withdrawn DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_balance
  FROM public.financial_ledger
  WHERE user_id = artist_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_pending
  FROM public.financial_ledger
  WHERE user_id = artist_id AND type = 'CREDIT' AND confirmed_at IS NULL;

  SELECT COALESCE(SUM(amount), 0) INTO v_released
  FROM public.financial_ledger
  WHERE user_id = artist_id AND type = 'RELEASE';

  SELECT COALESCE(SUM(amount), 0) INTO v_withdrawn
  FROM public.withdrawals
  WHERE user_id = artist_id AND status = 'CONFIRMED';

  v_result := jsonb_build_object(
    'total_balance', v_total_balance,
    'pending_balance', v_pending,
    'released_balance', v_released,
    'withdrawn_balance', v_withdrawn,
    'available_for_withdrawal', GREATEST(v_released - v_withdrawn, 0)
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FUNÇÕES DE CONTRATOS
-- ============================================================================

-- Obter estatísticas de contratos do artista
CREATE OR REPLACE FUNCTION public.get_artist_contract_stats(artist_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total BIGINT;
  v_completed BIGINT;
  v_total_earned DECIMAL;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM contracts WHERE pro_id = artist_id;

  SELECT COUNT(*) INTO v_completed
  FROM contracts WHERE pro_id = artist_id AND status = 'COMPLETED';

  SELECT COALESCE(SUM(value), 0) INTO v_total_earned
  FROM contracts WHERE pro_id = artist_id AND status = 'COMPLETED';

  v_result := jsonb_build_object(
    'total_contracts', v_total,
    'completed_contracts', v_completed,
    'total_earned', v_total_earned,
    'completion_rate', CASE 
      WHEN v_total = 0 THEN 0 
      ELSE ROUND((v_completed::DECIMAL / v_total) * 100, 2)
    END
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FUNÇÃO DE AUDITORIA (Admin only)
-- ============================================================================

-- Log de ações admin
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type TEXT,
  target_id UUID,
  details JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verifica se é admin
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can log actions'
    );
  END IF;

  -- Aqui você pode inserir em uma tabela de auditoria se necessário
  -- INSERT INTO public.admin_audit_log (...) VALUES (...)

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Action logged',
    'action_type', action_type,
    'target_id', target_id,
    'admin_id', auth.uid(),
    'timestamp', NOW()
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. TESTES DAS FUNCTIONS
-- ============================================================================

-- Para testar, execute via Supabase Query Editor:

-- Teste 1: Incrementar saldo
-- SELECT public.increment_pending_balance('550e8400-e29b-41d4-a716-446655440000'::UUID, 100.00);

-- Teste 2: Obter saldo
-- SELECT public.get_artist_balance('550e8400-e29b-41d4-a716-446655440000'::UUID);

-- Teste 3: Estatísticas de contrato
-- SELECT public.get_artist_contract_stats('550e8400-e29b-41d4-a716-446655440000'::UUID);

-- Teste 4: Verificar admin
-- SELECT public.is_admin();

-- ============================================================================
-- 7. VERIFICAR SE FUNCTIONS EXISTEM
-- ============================================================================

SELECT routine_name, routine_type FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Devem existir:
-- - is_admin
-- - increment_pending_balance
-- - decrement_pending_balance
-- - release_artist_funds
-- - get_artist_balance
-- - get_artist_contract_stats
-- - log_admin_action
-- - calculate_level (do schema.sql)
