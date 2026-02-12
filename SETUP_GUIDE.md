# 📋 Guia Completo de Setup - Dushow Platform

## 🎯 Checklist de Implementação

Implementações recentes foram feitas nesta sessão:

### ✅ Calendário Modernizado
- **Arquivo**: `src/pages/pro/Agenda.tsx`
- **Mudança**: Substituído calendário por um widget visual com:
  - Visualização de agenda em grid de mês inteiro
  - Shows exibidos em cada dia com cor de status
  - Dias com múltiplos eventos mostram "+N mais"
  - Lista lateral com próximos 5 shows

### ✅ Configurações para Profissional
- **Arquivo**: `src/pages/pro/Settings.tsx` (novo)
- **Arquivo**: `src/components/pro/ProSidebar.tsx` (atualizado)
- **Arquivo**: `src/App.tsx` (atualizado)
- **Features**: Preferências de tema, notificações e visibilidade

### ✅ Autorização Admin Reforçada
- **Arquivo**: `supabase/functions/contract-state-machine/index.ts` (atualizado)
- **Segurança**: RESOLVE_DISPUTE agora valida token JWT e verifica role ADMIN

### ✅ SQL Completo para Exportação
- **Arquivo**: `backend/sql/01_project_verification.sql` (novo)
- **Função**: Verifica toda estrutura necessária (tabelas, índices, funções, RLS)

### ✅ Setup de Admin
- **Arquivo**: `backend/sql/02_create_admin_user.sql` (novo)
- **Instruções**: Como criar usuário admin via Auth ou API

### ✅ RPCs Necessárias
- **Arquivo**: `backend/sql/03_rpc_functions.sql` (novo)
- **Functions**:
  - `increment_pending_balance()` - adiciona saldo
  - `decrement_pending_balance()` - remove saldo
  - `release_artist_funds()` - libera para saque
  - `get_artist_balance()` - obtém saldo total
  - `get_artist_contract_stats()` - estatísticas
  - `log_admin_action()` - auditoria admin

---

## 🚀 Próximos Passos para Deploy

### 1. Preparar Banco de Dados

**Passo 1A: Verificar Estrutura Completa**
```bash
# No Supabase SQL Editor
-- Copie e rode: backend/sql/01_project_verification.sql
```

**Passo 1B: Criar As RPCs (se não existirem)**
```bash
# No Supabase SQL Editor
-- Copie e rode: backend/sql/03_rpc_functions.sql
```

### 2. Criar Usuário Admin

**Passo 2A: Via Dashboard Supabase**
1. Acesse `https://app.supabase.com/project/[seu-id]/auth/users`
2. Clique "Add new user"
3. Email: `admin@dushow.com.br`
4. Password: [Senha forte]
5. Copie o User ID (uuid gerado)

**Passo 2B: Criar Perfil Admin no SQL**
```sql
-- No Supabase SQL Editor
-- Substitua ADMIN_USER_ID pelo UUID da etapa 2A
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  type,
  is_admin,
  plan_tier,
  created_at,
  updated_at
) VALUES (
  'ADMIN_USER_ID', -- ⚠️ Substitua
  'admin@dushow.com.br',
  'Admin Dushow',
  'ADMIN',
  'Admin',
  TRUE,
  'admin',
  NOW(),
  NOW()
);
```

**Teste login**:
```javascript
// No console do navegador
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@dushow.com.br',
  password: '[sua-senha]'
})
console.log(data) // Deve mostrar usuário
```

### 3. Configurar Variáveis de Ambiente

**Arquivo: `.env.local` (frontend)**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx
```

**Arquivo: `.env` (backend - se houver)**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
ASAAS_API_KEY=seu_api_key_aqui
ASAAS_WEBHOOK_SECRET=seu_webhook_secret
```

### 4. Testar Calendário

```bash
npm run dev
# Acesse http://localhost:5173
# Vá para /pro/agenda
# Clique em Configurações para testar nova página
```

### 5. Testar Admin

```bash
# Acesse /admin
# Deve mostrar dashboard admin
# Acesse /admin/disputes para ver novas disputas
```

### 6. Deploy

```bash
# Frontend (Vercel/Netlify)
npm run build
# Suba o dist/

# Edge Functions (Supabase)
supabase functions deploy
```

---

## 📊 Validação Pré-Deploy

Execute este SQL para validar tudo está pronto:

```sql
-- Verificar tabelas principais
SELECT COUNT(*) as profiles FROM profiles;
SELECT COUNT(*) as contracts FROM contracts;
SELECT COUNT(*) as ledger FROM financial_ledger;

-- Verificar functions
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Verificar admin existe
SELECT COUNT(*) as admins FROM profiles WHERE role = 'ADMIN';

-- Verificar índices
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
```

---

## 🔒 Segurança Antes de Deploy

- [ ] RLS habilitado em todas as tabelas
- [ ] Chaves de API em .env (não em git)
- [ ] Webhook ASAAS configurado
- [ ] Email de confirmação ativo
- [ ] Admin criado e testado
- [ ] Validação de input server-side (feita em create-contract)
- [ ] CORS configurado no Supabase
- [ ] Rate limiting ativo

---

## 📞 Troubleshooting

**Problema**: "RESOLVE_DISPUTE Unauthorized"
```
Solução: Verifique se o usuário tem role = 'ADMIN' e token válido
```

**Problema**: "Timestamp invalid"
```
Solução: create-contract valida eventDate - confira formato ISO
```

**Problema**: "Saldo não atualiza"
```
Solução: Confirme que RPCs existem e webhook ASAAS está ativo
```

**Problema**: "Calendário não mostra eventos"
```
Solução: Confirme que contracts têm event_date válida e status ACCEPTED/PAID
```

---

## 📁 Arquivos Modificados Nesta Sessão

| Arquivo | Mudança |
|---------|---------|
| `src/pages/pro/Agenda.tsx` | ✨ Calendário moderno com grid |
| `src/pages/pro/Settings.tsx` | ✨ Nova página de configurações |
| `src/components/pro/ProSidebar.tsx` | 🔗 Link para Configurações |
| `src/App.tsx` | 🔗 Rota /pro/settings |
| `supabase/functions/contract-state-machine/index.ts` | 🔒 Validação ADMIN |
| `backend/sql/01_project_verification.sql` | ✨ Verificação completa |
| `backend/sql/02_create_admin_user.sql` | ✨ Setup de admin |
| `backend/sql/03_rpc_functions.sql` | ✨ RPC functions |

---

## 💡 Dicas Importantes

1. **Calendário**: Suporta até 6 cores de status (COMPLETED, PAID, ACCEPTED, SIGNED, etc)
2. **Configurações**: Armazena preferências em `profiles.pref_*`
3. **Admin**: Usa combinação de `role = 'ADMIN'` e `is_admin = true` para redundância
4. **Segurança**: Sempre valida JWT no serverless + verifica role do perfil

---

Dúvidas ou problemas? Verifique os arquivos SQL em `backend/sql/` para instruções detalhadas!
