-- ============================================================================
-- PROJECT VERIFICATION SQL - Dushow Platform
-- Verifica e documenta toda a estrutura de banco necessária
-- ============================================================================

-- 1. TABELAS ESSENCIAIS
-- ============================================================================

-- 1.1 Profiles (Usuários e Profissionais)
SELECT 'PROFILES TABLE' as check_point;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'profiles';
-- Colunas obrigatórias: id, email, full_name, role, avatar_url, bio, category, price, 
-- location, asaas_wallet_id, xp_total, level, is_superstar, is_verified, plan_tier, 
-- portfolio_urls, pref_dark_mode, pref_email_notifications, pref_public_profile

-- 1.2 Contracts (Contratos e Shows)
SELECT 'CONTRACTS TABLE' as check_point;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'contracts';
-- Colunas obrigatórias: id, pro_id, client_id, event_name, event_date, event_location, 
-- value, status, asaas_payment_id, paid_at, platform_fee, artist_net, refund_id, refunded_at,
-- dispute_reason, dispute_opened_at, dispute_opened_by, dispute_resolved_at, dispute_resolved_by, 
-- dispute_resolution

-- 1.3 Financial Ledger (Movimentações Financeiras)
SELECT 'FINANCIAL_LEDGER TABLE' as check_point;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'financial_ledger';
-- Colunas obrigatórias: id, user_id, contract_id, amount, type (DEBIT/CREDIT), 
-- external_payment_id, confirmed_at, description

-- 1.4 Withdrawals (Saques)
SELECT 'WITHDRAWALS TABLE' as check_point;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'withdrawals';
-- Colunas obrigatórias: id, user_id, amount, status (PENDING/CONFIRMED/FAILED), 
-- external_id, requested_at, confirmed_at

-- 1.5 Posts (Feed Social)
SELECT 'POSTS TABLE' as check_point;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'posts';
-- Colunas obrigatórias: id, user_id, content, image_url, likes, comments, created_at

-- 1.6 Comments (Comentários)
SELECT 'COMMENTS TABLE' as check_point;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'comments';
-- Colunas obrigatórias: id, post_id, user_id, content, created_at

-- 1.7 Messages (Chat entre usuários)
SELECT 'MESSAGES TABLE' as check_point;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'messages';
-- Colunas obrigatórias: id, sender_id, receiver_id, content, created_at, read_at

-- 1.8 Reviews (Avaliações)
SELECT 'REVIEWS TABLE' as check_point;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'reviews';
-- Colunas obrigatórias: id, reviewer_id, reviewed_id (pro_id), rating, comment, created_at

-- ============================================================================
-- 2. ÍNDICES NECESSÁRIOS
-- ============================================================================

-- Índices de Performance
SELECT 'INDEXES CHECK' as check_point;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Criar se não existir:
-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);

-- Contracts
CREATE INDEX IF NOT EXISTS idx_contracts_pro_id ON contracts(pro_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_event_date ON contracts(event_date);
CREATE INDEX IF NOT EXISTS idx_contracts_asaas_payment_id ON contracts(asaas_payment_id);

-- Financial Ledger
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON financial_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_contract_id ON financial_ledger(contract_id);
CREATE INDEX IF NOT EXISTS idx_ledger_external_payment_id ON financial_ledger(external_payment_id);

-- Withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- ============================================================================
-- 3. FUNÇÕES E RPCS NECESSÁRIAS
-- ============================================================================

SELECT 'FUNCTIONS CHECK' as check_point;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' 
ORDER BY routine_name;

-- Funções essenciais que devem existir:
-- - is_admin() - verifica se é admin
-- - calculate_level() - calcula nível baseado em XP
-- - increment_pending_balance(artist_id, amount) - incrementa saldo pendente
-- - decrement_pending_balance(artist_id, amount) - decrementa saldo pendente
-- - release_artist_funds(artist_id, amount) - libera fundos para saque

-- ============================================================================
-- 4. TRIGGERS ESSENCIAIS
-- ============================================================================

SELECT 'TRIGGERS CHECK' as check_point;
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY trigger_name;

-- Triggers que devem existir:
-- - tr_update_level - atualiza nível quando XP muda
-- - tr_protect_profile_fields - protege campos sensíveis

-- ============================================================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- ============================================================================

SELECT 'RLS POLICIES CHECK' as check_point;
SELECT policyname, tablename FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- RLS deve estar habilitado em:
-- - profiles
-- - contracts
-- - messages
-- - financial_ledger
-- - posts
-- - reviews

-- ============================================================================
-- 6. STORAGE BUCKETS
-- ============================================================================

-- Buckets necessários no Supabase Storage:
-- - avatars (público) - fotos de perfil
-- - portfolio (público) - portfólio de profissionais

-- ============================================================================
-- 7. DADOS DE TESTE
-- ============================================================================

SELECT 'DATA VALIDATION' as check_point;

-- Verificar se existem usuários
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_contracts FROM contracts;
SELECT COUNT(*) as total_posts FROM posts;

-- Perfil dos usuários por tipo
SELECT role, COUNT(*) as count FROM profiles GROUP BY role;

-- Contratos por status
SELECT status, COUNT(*) as count FROM contracts GROUP BY status;

-- ============================================================================
-- 8. CONFIGURAÇÕES SUPABASE NECESSÁRIAS
-- ============================================================================

-- Email:
-- - Habilitar autenticação por email
-- - Configurar templates de email
-- - Adicionar domínio permitido para envio

-- Webhooks necessários:
-- - ASAAS Webhook para pagamentos e transferências
-- - Editor do banco para logs

-- Variáveis de ambiente necessárias (.env):
-- - SUPABASE_URL
-- - SUPABASE_ANON_KEY
-- - SUPABASE_SERVICE_ROLE_KEY
-- - ASAAS_API_KEY
-- - ASAAS_WEBHOOK_SECRET
-- - VITE_SUPABASE_URL
-- - VITE_SUPABASE_ANON_KEY

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 'SUMMARY' as section;
SELECT 'Execute este script para validar se toda a estrutura existe' as info;
SELECT 'Se alguma tabela, index ou função faltar, execute os scripts específicos' as action;
