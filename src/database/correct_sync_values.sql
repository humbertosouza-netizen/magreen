-- Script corrigido para sincronizar auth.users e a tabela profiles
-- Usando os valores corretos para a coluna role

-- 1. Determinar quais valores são permitidos na coluna role
DO $$
DECLARE
    v_constraint_def TEXT;
    v_role_values TEXT;
    v_default_role TEXT := 'client'; -- Usaremos 'client' como valor padrão em vez de 'user'
BEGIN
    -- Obter a definição da restrição
    SELECT pg_get_constraintdef(oid)
    INTO v_constraint_def
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
    AND conrelid = 'profiles'::regclass;

    -- Extrair os valores permitidos da definição da restrição
    v_role_values := regexp_replace(v_constraint_def, '.*CHECK \(\(role\)::text = ANY \(\(ARRAY\[(.*)\]\)::text\[\]\)\).*', '\1', 'g');
    
    RAISE NOTICE 'Valores permitidos para role: %', v_role_values;
    RAISE NOTICE 'Usando o valor padrão: %', v_default_role;
END $$;

-- 2. Inserir usuários que existem em auth.users mas não em profiles
INSERT INTO profiles (
  id, 
  nome_completo, 
  email, 
  telefone, 
  bio, 
  avatar_url, 
  created_at, 
  updated_at, 
  role
)
SELECT 
  au.id, 
  COALESCE(au.raw_user_meta_data->>'nickname', split_part(au.email, '@', 1)), 
  au.email,
  '',
  '',
  '',
  au.created_at,
  NOW(),
  'client'  -- Usar 'client' em vez de 'user'
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 3. Atualizar emails em profiles que possam estar ausentes ou desatualizados
UPDATE profiles p
SET email = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id AND (p.email IS NULL OR p.email <> au.email);

-- 4. Mostrar a contagem antes e depois
DO $$
DECLARE
    v_count_auth INTEGER;
    v_count_profiles INTEGER;
    v_count_synced INTEGER;
BEGIN
    -- Contagem de usuários em auth.users
    SELECT COUNT(*) INTO v_count_auth FROM auth.users;
    
    -- Contagem de perfis em profiles
    SELECT COUNT(*) INTO v_count_profiles FROM profiles;
    
    -- Contagem de registros sincronizados agora
    SELECT COUNT(*) INTO v_count_synced 
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE p.id IS NULL;

    RAISE NOTICE 'Contagem de usuários em auth.users: %', v_count_auth;
    RAISE NOTICE 'Contagem de perfis em profiles antes da sincronização: %', v_count_profiles;
    RAISE NOTICE 'Registros sincronizados nesta operação: %', v_count_synced;
    RAISE NOTICE 'Contagem de perfis em profiles após sincronização: %', (v_count_profiles + v_count_synced);
END $$; 