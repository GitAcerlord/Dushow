-- 1. Função auxiliar para verificar se o usuário é ADMIN sem causar recursão infinita
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ajuste na tabela de Perfis (Profiles)
-- Removemos políticas excessivamente permissivas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Perfis são públicos" ON public.profiles;
DROP POLICY IF EXISTS "Acesso público" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Admins podem ver todos os perfis
CREATE POLICY "profiles_admin_select" ON public.profiles
FOR SELECT TO authenticated
USING ( public.is_admin() );

-- Usuários podem ver seu próprio perfil completo
CREATE POLICY "profiles_self_select" ON public.profiles
FOR SELECT TO authenticated
USING ( auth.uid() = id );

-- O público só pode ver perfis de artistas (PRO) para descoberta
CREATE POLICY "profiles_pro_discovery" ON public.profiles
FOR SELECT
USING ( role = 'PRO' );

-- 3. Ajuste na tabela de Contratos (Contracts)
-- Garante que Admins vejam todos os contratos para auditoria
DROP POLICY IF EXISTS "contracts_admin_select" ON public.contracts;
CREATE POLICY "contracts_admin_select" ON public.contracts
FOR SELECT TO authenticated
USING ( public.is_admin() );

-- 4. Ajuste na tabela de Mensagens (Messages)
-- Garante que apenas participantes ou Admins vejam as mensagens
DROP POLICY IF EXISTS "messages_access_policy" ON public.messages;
CREATE POLICY "messages_access_policy" ON public.messages
FOR SELECT TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR 
  public.is_admin()
);