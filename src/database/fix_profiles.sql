-- Script para corrigir a estrutura da tabela profiles para permitir criação de usuários
-- Executar este script no SQL Editor do Supabase

-- 1. Verificar se a tabela profiles existe
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Tabela profiles não existe. Criando...';
    
    -- Criar a tabela profiles
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      nome_completo TEXT,
      email TEXT,
      role TEXT DEFAULT 'user',
      avatar_url TEXT,
      telefone TEXT,
      data_nascimento DATE,
      bio TEXT,
      banned BOOLEAN DEFAULT false,
      banned_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Tabela profiles criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela profiles já existe';
  END IF;
END $$;

-- 2. Verificar e adicionar colunas faltantes
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Verificar coluna nome_completo
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'nome_completo'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE profiles ADD COLUMN nome_completo TEXT;
    RAISE NOTICE 'Coluna nome_completo adicionada';
  END IF;
  
  -- Verificar coluna email
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Coluna email adicionada';
  END IF;
  
  -- Verificar coluna role
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    RAISE NOTICE 'Coluna role adicionada';
  END IF;
  
  -- Verificar coluna banned
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'banned'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE profiles ADD COLUMN banned BOOLEAN DEFAULT false;
    RAISE NOTICE 'Coluna banned adicionada';
  END IF;
  
  -- Verificar coluna created_at
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Coluna created_at adicionada';
  END IF;
  
  -- Verificar coluna updated_at
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Coluna updated_at adicionada';
  END IF;
END $$;

-- 3. Criar função segura para verificar se um usuário é administrador (evita recursão infinita)
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

-- 4. Remover políticas RLS existentes que podem causar recursão
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Admins podem editar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis" ON profiles;

-- 5. Habilitar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Criar novas políticas RLS otimizadas que não causam recursão
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

-- 7. Criar função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar o campo updated_at
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 9. Criar ou substituir a função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo, role, created_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Resumo do estado atual
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') > 0 AS profiles_table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles') AS profiles_column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') AS profiles_policy_count,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') > 0 AS trigger_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_admin_no_rls') > 0 AS admin_function_exists; 