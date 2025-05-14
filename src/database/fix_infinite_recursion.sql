-- Corrigir a recursão infinita na política RLS para a tabela profiles
-- Este erro ocorre porque a política está consultando a própria tabela que está sendo protegida

-- 1. Remover todas as políticas existentes que podem estar causando a recursão
DROP POLICY IF EXISTS "Administradores podem visualizar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Administradores podem atualizar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Administradores podem inserir perfis" ON profiles;
DROP POLICY IF EXISTS "Administradores podem excluir perfis" ON profiles;
DROP POLICY IF EXISTS "users_select_own_profile_admins_all" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile_admins_all" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON profiles;

-- Remover também as novas políticas que podem ter sido criadas em uma execução anterior
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- 2. Criar uma função SECURITY DEFINER para verificar se um usuário é admin
-- Esta função ignora o RLS, evitando a recursão
CREATE OR REPLACE FUNCTION is_admin_user(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Esta consulta ignora o RLS porque usa SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = uid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar políticas simplificadas e seguras que evitam recursão
-- Política para SELECT: Usuários podem ver seu próprio perfil, Admins podem ver todos
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR is_admin_user(auth.uid())
  );

-- Política para UPDATE: Usuários podem atualizar seu próprio perfil, Admins podem atualizar todos
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    id = auth.uid() OR is_admin_user(auth.uid())
  );

-- Política para INSERT: Usuários só podem inserir seu próprio perfil
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
  );

-- Política para DELETE: Apenas administradores podem excluir perfis
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (
    is_admin_user(auth.uid())
  );

-- 4. Garantir que usuários específicos sempre sejam administradores
UPDATE profiles
SET role = 'admin'
WHERE email IN ('admin@magnificencia.com.br', 'humbertoboxe2022@gmail.com');

-- 5. Garantir que a tabela tenha RLS ativado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 