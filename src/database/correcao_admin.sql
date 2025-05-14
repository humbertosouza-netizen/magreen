-- Script para corrigir as permissões de admin do usuário empresarialkluge@gmail.com
-- Este script tenta atualizar o usuário em todas as tabelas possíveis
-- que poderiam armazenar informações de perfil e permissões

-- Tentar obter o ID do usuário primeiro
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Tentar obter o ID na tabela auth.users
  BEGIN
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'empresarialkluge@gmail.com';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao buscar na tabela auth.users: %', SQLERRM;
  END;
  
  RAISE NOTICE 'ID do usuário encontrado: %', user_id;
  
  -- Atualizar na tabela profiles usando ID se disponível
  IF user_id IS NOT NULL THEN
    BEGIN
      UPDATE profiles
      SET role = 'admin',
          tipo = 'admin',
          admin = TRUE,
          is_admin = TRUE,
          updated_at = NOW()
      WHERE id = user_id;
      
      RAISE NOTICE 'Perfil atualizado na tabela profiles por ID';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao atualizar tabela profiles por ID: %', SQLERRM;
    END;
    
    -- Atualizar na tabela perfis usando ID
    BEGIN
      UPDATE perfis
      SET role = 'admin',
          tipo = 'admin',
          admin = TRUE,
          is_admin = TRUE,
          updated_at = NOW()
      WHERE id = user_id;
      
      RAISE NOTICE 'Perfil atualizado na tabela perfis por ID';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao atualizar tabela perfis por ID: %', SQLERRM;
    END;
    
    -- Atualizar na tabela user_profiles usando ID
    BEGIN
      UPDATE user_profiles
      SET role = 'admin',
          updated_at = NOW()
      WHERE id = user_id;
      
      RAISE NOTICE 'Perfil atualizado na tabela user_profiles por ID';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao atualizar tabela user_profiles por ID: %', SQLERRM;
    END;
  END IF;
  
  -- Também atualizar usando email, caso o ID esteja em um formato diferente
  -- ou em caso de discrepâncias
  
  -- Atualizar na tabela profiles por email
  BEGIN
    UPDATE profiles
    SET role = 'admin',
        tipo = 'admin',
        admin = TRUE,
        is_admin = TRUE,
        updated_at = NOW()
    WHERE email = 'empresarialkluge@gmail.com';
    
    RAISE NOTICE 'Perfil atualizado na tabela profiles por email';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar tabela profiles por email: %', SQLERRM;
  END;
  
  -- Atualizar na tabela perfis por email
  BEGIN
    UPDATE perfis
    SET role = 'admin',
        tipo = 'admin',
        admin = TRUE,
        is_admin = TRUE,
        updated_at = NOW()
    WHERE email = 'empresarialkluge@gmail.com';
    
    RAISE NOTICE 'Perfil atualizado na tabela perfis por email';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar tabela perfis por email: %', SQLERRM;
  END;
  
  -- Atualizar na tabela user_profiles por email
  BEGIN
    UPDATE user_profiles
    SET role = 'admin',
        updated_at = NOW()
    WHERE email = 'empresarialkluge@gmail.com';
    
    RAISE NOTICE 'Perfil atualizado na tabela user_profiles por email';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar tabela user_profiles por email: %', SQLERRM;
  END;
  
  RAISE NOTICE 'Script de correção concluído';
END $$;

-- Script de correção abrangente para resolver problemas de acesso ADMIN

-- 1. Garantir que a coluna 'role' exista com a configuração correta
DO $$
BEGIN
  -- Verificar se a coluna 'role' existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    -- Adicionar a coluna se não existir
    ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'USUARIO';
    RAISE NOTICE 'Coluna "role" adicionada à tabela profiles.';
  END IF;
  
  -- Adicionar a CHECK CONSTRAINT se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    -- Adicionar a restrição
    ALTER TABLE profiles ADD CONSTRAINT check_role CHECK (role IN ('ADMIN', 'USUARIO'));
    RAISE NOTICE 'CHECK CONSTRAINT adicionada para a coluna "role".';
  END IF;
END;
$$;

-- 2. Corrigir o perfil do usuário específico (garantir que ele exista)
DO $$
DECLARE
  user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Obter o ID do usuário
  SELECT id INTO user_id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email humbertoboxe2022@gmail.com não encontrado no banco de dados';
  END IF;
  
  -- Verificar se o perfil existe
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id
  ) INTO profile_exists;
  
  -- Se o perfil não existir, criar um
  IF NOT profile_exists THEN
    INSERT INTO profiles (
      id, 
      nome_completo, 
      telefone,
      bio,
      role, 
      created_at
    )
    VALUES (
      user_id,
      'Humberto Admin',
      'admin@exemplo.com',
      'Administrador do sistema',
      'ADMIN',
      NOW()
    );
    RAISE NOTICE 'Perfil criado com sucesso para o usuário %', user_id;
  ELSE
    -- Atualizar o perfil existente para ADMIN
    UPDATE profiles 
    SET 
      role = 'ADMIN', 
      updated_at = NOW(),
      nome_completo = COALESCE(nome_completo, 'Humberto Admin')
    WHERE id = user_id;
    RAISE NOTICE 'Perfil atualizado com sucesso para o usuário %', user_id;
  END IF;
END;
$$;

-- 3. Verificar se a política RLS específica existe e criá-la se necessário
DO $$
BEGIN
  -- Verificar se a política 'Admins podem ver todos os perfis' existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' 
    AND policyname = 'Admins podem ver todos os perfis'
  ) THEN
    -- Criar a política
    CREATE POLICY "Admins podem ver todos os perfis" 
      ON profiles FOR SELECT 
      USING (
        auth.uid() = id OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
      );
    RAISE NOTICE 'Política RLS "Admins podem ver todos os perfis" criada com sucesso.';
  END IF;
  
  -- Verificar se a política 'Admins podem atualizar todos os perfis' existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' 
    AND policyname = 'Admins podem atualizar todos os perfis'
  ) THEN
    -- Criar a política
    CREATE POLICY "Admins podem atualizar todos os perfis" 
      ON profiles FOR UPDATE 
      USING (
        auth.uid() = id OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
      );
    RAISE NOTICE 'Política RLS "Admins podem atualizar todos os perfis" criada com sucesso.';
  END IF;
END;
$$;

-- 4. Criar funções para verificação e atualização de status admin se não existirem
DO $$
BEGIN
  -- Verificar se a função 'is_admin' existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'is_admin'
  ) THEN
    -- Criar a função is_admin
    CREATE OR REPLACE FUNCTION is_admin()
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    RAISE NOTICE 'Função "is_admin" criada com sucesso.';
  END IF;
  
  -- Verificar se a função 'promote_to_admin' existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'promote_to_admin'
  ) THEN
    -- Criar a função promote_to_admin
    CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
      -- Verificar se o usuário atual é ADMIN
      IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'ADMIN' THEN
        RAISE EXCEPTION 'Apenas administradores podem promover outros usuários';
        RETURN false;
      END IF;
      
      -- Promover usuário para ADMIN
      UPDATE profiles 
      SET role = 'ADMIN', updated_at = NOW() 
      WHERE id = target_user_id;
      
      RETURN true;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    RAISE NOTICE 'Função "promote_to_admin" criada com sucesso.';
  END IF;
END;
$$;

-- 5. Verificar e corrigir perfil do usuário atual
DO $$
DECLARE
  current_user_id UUID;
  current_user_exists BOOLEAN;
BEGIN
  -- Obter o ID do usuário atual
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'Nenhum usuário logado atualmente.';
    RETURN;
  END IF;
  
  -- Verificar se o perfil do usuário atual existe
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = current_user_id
  ) INTO current_user_exists;
  
  -- Se o perfil do usuário atual não existir, criar um
  IF NOT current_user_exists THEN
    INSERT INTO profiles (
      id, 
      nome_completo, 
      role, 
      created_at
    )
    VALUES (
      current_user_id,
      (SELECT email FROM auth.users WHERE id = current_user_id),
      'USUARIO',
      NOW()
    );
    RAISE NOTICE 'Perfil criado para o usuário atual: %', current_user_id;
  END IF;
  
  -- Verificar se o usuário atual é o mesmo que humbertoboxe2022@gmail.com
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = current_user_id AND email = 'humbertoboxe2022@gmail.com'
  ) THEN
    -- Forçar a atualização para ADMIN
    UPDATE profiles 
    SET role = 'ADMIN', updated_at = NOW() 
    WHERE id = current_user_id;
    RAISE NOTICE 'Usuário atual promovido a ADMIN: %', current_user_id;
  END IF;
END;
$$;

-- 6. Verificação final após todas as correções
SELECT 
  'Verificação do usuário humbertoboxe2022@gmail.com' as info,
  u.id, 
  u.email, 
  p.role,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com'

UNION ALL

SELECT 
  'Verificação do usuário atual' as info,
  auth.uid() as id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
  (SELECT role FROM profiles WHERE id = auth.uid()) as role,
  (SELECT updated_at FROM profiles WHERE id = auth.uid()) as updated_at; 