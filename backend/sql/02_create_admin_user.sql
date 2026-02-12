-- ============================================================================
-- ADMIN USER SETUP - Cria usuário admin para teste
-- ============================================================================

-- INSTRUÇÃO: Execute isto NO SUPABASE DASHBOARD (Authentication > Users)
-- ou use a linha abaixo substituindo email e senha:

-- 1. Via Auth Admin (Supabase Dashboard):
-- - Acesse https://app.supabase.com/project/[seu-project-id]/auth/users
-- - Clique em "Add new user"
-- - Email: admin@dushow.com.br
-- - Password: [senha segura]
-- - Salve o User ID gerado (ex: 550e8400-e29b-41d4-a716-446655440000)

-- 2. Após criar, execute no SQL Editor do Supabase:

-- IMPORTANTE: Substitua 'ADMIN_USER_ID' pelo ID real criado acima
-- Exemplo: '550e8400-e29b-41d4-a716-446655440000'

WITH admin_user AS (
  SELECT 'ADMIN_USER_ID' as id -- ⚠️ SUBSTITUA PELO ID REAL
)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  type,
  is_admin,
  bio,
  category,
  price,
  location,
  is_verified,
  is_superstar,
  plan_tier,
  xp_total,
  level,
  created_at,
  updated_at
)
SELECT
  admin_user.id,
  'admin@dushow.com.br',
  'Admin Dushow',
  'ADMIN',
  'Admin',
  TRUE,
  'Administrador da plataforma Dushow',
  'Admin',
  0,
  'Brasil',
  TRUE,
  FALSE,
  'admin',
  1000,
  2,
  NOW(),
  NOW()
FROM admin_user
ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN',
  type = 'Admin',
  is_admin = TRUE,
  plan_tier = 'admin'
RETURNING id, email, full_name, role;

-- ============================================================================
-- VERIFICAR ADMIN CRIADO
-- ============================================================================

SELECT 
  id,
  email,
  full_name,
  role,
  is_admin,
  plan_tier,
  created_at
FROM profiles
WHERE role = 'ADMIN'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- PASSO 1: VIA SUPABASE AUTH API (recomendado via backend)
-- ============================================================================

-- Código Node.js para criar admin via API:
/*
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createAdminUser() {
  // 1. Criar usuário no Auth
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: 'admin@dushow.com.br',
    password: 'SenhaSegura123!@#',
    email_confirm: true
  })

  if (createError) {
    console.error('Erro ao criar usuário:', createError)
    return
  }

  console.log('Usuário criado:', user.user.id)

  // 2. Criar perfil no banco
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.user.id,
    email: 'admin@dushow.com.br',
    full_name: 'Admin Dushow',
    role: 'ADMIN',
    type: 'Admin',
    is_admin: true,
    plan_tier: 'admin',
    is_verified: true,
    xp_total: 1000,
    level: 2
  })

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError)
    return
  }

  console.log('Admin criado com sucesso!')
}

createAdminUser()
*/

-- ============================================================================
-- PASSO 2: TESTAR ADMIN
-- ============================================================================

-- Login com admin:
-- curl -X POST 'https://[seu-project].supabase.co/auth/v1/token?grant_type=password' \
--   -H "Content-Type: application/json" \
--   -d '{"email":"admin@dushow.com.br","password":"SenhaSegura123!@#"}'

-- ou no frontend React:
/*
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@dushow.com.br',
  password: 'SenhaSegura123!@#'
})

if (error) {
  console.error('Erro:', error.message)
} else {
  console.log('Admin logado:', data.user.id)
}
*/

-- ============================================================================
-- PASSO 3: ADICIONAR OUTRAS CONTAS ADMIN (OPCIONAL)
-- ============================================================================

-- Se precisar de múltiplos admins, crie via dashboard e repita o passo 2
-- ou rode este SQL com IDs diferentes:

-- Admin 2 (você pode adicionar mais copies disto)
/*
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  type,
  is_admin,
  is_verified,
  plan_tier,
  xp_total,
  level,
  created_at,
  updated_at
) VALUES (
  'OTRO_ADMIN_USER_ID', -- ⚠️ Substitua
  'admin2@dushow.com.br',
  'Admin 2 Dushow',
  'ADMIN',
  'Admin',
  TRUE,
  TRUE,
  'admin',
  1000,
  2,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN',
  is_admin = TRUE
*/

-- ============================================================================
-- PERMISSÕES ADMIN
-- ============================================================================

-- O admin terá acesso a:
-- 1. Painel /admin (via ProtectedRoute com role ADMIN)
-- 2. Resolver disputas (RPC com verificação is_admin())
-- 3. Ver todos os contratos, usuários, mensagens (RLS policies)
-- 4. Gerenciar configurações da plataforma

-- ============================================================================
-- REMOVER ADMIN (se necessário)
-- ============================================================================

-- Para remover privilégios de admin mantenha a conta:
-- UPDATE profiles SET role = 'PRO', is_admin = FALSE WHERE role = 'ADMIN' AND id = 'USER_ID';

-- Para deletar completamente:
-- DELETE FROM profiles WHERE id = 'USER_ID';
-- DELETE FROM auth.users WHERE id = 'USER_ID'; -- Só se você tiver permissions
