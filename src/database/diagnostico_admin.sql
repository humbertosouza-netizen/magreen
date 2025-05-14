-- Script de diagnóstico completo para identificar problemas na promoção para ADMIN

-- 1. Verificação da estrutura da tabela profiles
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Verificação das políticas RLS na tabela profiles
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles,
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 3. Verificação de triggers na tabela profiles
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public' AND event_object_table = 'profiles';

-- 4. Verificação detalhada do usuário específico (humbertoboxe2022@gmail.com)
SELECT 
  u.id, 
  u.email, 
  u.confirmed_at,
  u.last_sign_in_at,
  p.id as profile_id,
  p.nome_completo,
  p.role,
  p.created_at,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com';

-- 5. Verificação do usuário atual logado
SELECT 
  auth.uid() as current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email;

-- 6. Verificação do perfil do usuário atual
SELECT * FROM profiles WHERE id = auth.uid();

-- 7. Verificar a existência da coluna 'role' especificamente
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE 'A coluna "role" existe na tabela profiles.';
  ELSE
    RAISE NOTICE 'A coluna "role" NÃO existe na tabela profiles. Precisamos adicioná-la.';
  END IF;
END;
$$;

-- 8. Tentar adicionar a coluna 'role' se ela não existir
DO $$
BEGIN
  -- Verificar se a coluna existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    -- Adicionar a coluna role
    ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'USUARIO' CHECK (role IN ('ADMIN', 'USUARIO'));
    RAISE NOTICE 'Coluna "role" adicionada com sucesso à tabela profiles.';
  ELSE
    -- Verificar se o CHECK CONSTRAINT existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
      -- Adicionar a constraint
      ALTER TABLE profiles ADD CONSTRAINT check_role CHECK (role IN ('ADMIN', 'USUARIO'));
      RAISE NOTICE 'CHECK CONSTRAINT adicionada para a coluna "role".';
    END IF;
  END IF;
END;
$$;

-- 9. Forçar a atualização do role para ADMIN
UPDATE profiles 
SET role = 'ADMIN', updated_at = NOW() 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com');

-- 10. Verificar se a atualização foi bem-sucedida
SELECT 
  u.email,
  p.role,
  p.updated_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com';

-- 11. Verificar se as funções de administrador existem
SELECT 
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('promote_to_admin', 'demote_from_admin', 'ban_user', 'create_user')
ORDER BY routine_name;

-- 12. Verificar todos os usuários e suas funções
SELECT 
  u.id,
  u.email,
  p.role,
  p.nome_completo,
  u.created_at as user_created,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10; 