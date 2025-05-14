-- Script para corrigir recursão infinita nas políticas RLS (Row Level Security) da tabela profiles
-- Executar este script no SQL Editor do Supabase

-- 1. Listar todas as políticas existentes na tabela profiles para referência
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Eliminar todas as políticas problemáticas que estão causando recursão
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem editar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "users_select_own_profile_admins_all" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile_admins_all" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON profiles;

-- 3. Criar função segura para verificar se um usuário é administrador sem passar pelo RLS
CREATE OR REPLACE FUNCTION is_admin_no_rls()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Consulta direta sem passar pelas verificações de políticas RLS
  SELECT role INTO v_role FROM profiles
  WHERE id = auth.uid();
  
  RETURN v_role = 'ADMIN' OR v_role = 'admin';
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Habilitar RLS na tabela profiles (caso não esteja)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar novas políticas RLS otimizadas que não causam recursão
-- Política para SELECT: Usuários podem ver seu próprio perfil, Admins podem ver todos
CREATE POLICY "users_select_own_profile_admins_all" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id OR is_admin_no_rls());

-- Política para UPDATE: Usuários podem atualizar seu próprio perfil, Admins podem atualizar todos
CREATE POLICY "users_update_own_profile_admins_all" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id OR is_admin_no_rls());

-- Política para INSERT: Usuários podem inserir seu próprio perfil
CREATE POLICY "users_insert_own_profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Política para DELETE: Apenas admins podem excluir perfis
CREATE POLICY "admins_delete_profiles" 
  ON profiles FOR DELETE 
  USING (is_admin_no_rls());

-- 6. Resumo das políticas atuais após a correção
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 7. Verificar se a função de verificação de admin existe
SELECT 
  proname, 
  prosecdef
FROM pg_proc 
WHERE proname = 'is_admin_no_rls';

-- Verificar e corrigir políticas RLS para a tabela profiles

-- Remover políticas existentes que possam estar conflitantes
DROP POLICY IF EXISTS "Administradores podem visualizar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Administradores podem atualizar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Administradores podem inserir perfis" ON profiles;
DROP POLICY IF EXISTS "Administradores podem excluir perfis" ON profiles;

-- Criar políticas corretas para administradores

-- Política para SELECT: administradores podem visualizar todos os perfis
CREATE POLICY "Administradores podem visualizar todos os perfis" 
  ON profiles FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
    OR auth.uid() = id
  );

-- Política para UPDATE: administradores podem atualizar qualquer perfil
CREATE POLICY "Administradores podem atualizar todos os perfis" 
  ON profiles FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
    OR auth.uid() = id
  );

-- Política para INSERT: administradores podem inserir perfis
CREATE POLICY "Administradores podem inserir perfis" 
  ON profiles FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
    OR auth.uid() = id
  );

-- Política para DELETE: administradores podem excluir perfis
CREATE POLICY "Administradores podem excluir perfis" 
  ON profiles FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Garantir que os super admins sempre tenham papel de admin
CREATE OR REPLACE FUNCTION ensure_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IN ('admin@magnificencia.com.br', 'humbertoboxe2022@gmail.com') AND NEW.role != 'admin' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar ou substituir o gatilho
DROP TRIGGER IF EXISTS ensure_admin_role_trigger ON profiles;
CREATE TRIGGER ensure_admin_role_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_admin_role();

-- Atualizar usuários existentes para garantir que super admins tenham papel correto
UPDATE profiles
SET role = 'admin'
WHERE email IN ('admin@magnificencia.com.br', 'humbertoboxe2022@gmail.com'); 