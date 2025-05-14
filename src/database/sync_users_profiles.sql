-- Script para sincronizar auth.users e a tabela profiles
-- Este script verifica usuários que estão em auth.users mas não em profiles e vice-versa

-- 1. Inserir usuários que existem em auth.users mas não em profiles
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
  'user'
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. Atualizar emails em profiles que possam estar ausentes ou desatualizados
UPDATE profiles p
SET email = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id AND (p.email IS NULL OR p.email <> au.email);

-- 3. Melhorar a visibilidade para debugar
-- Exibir contagem antes e depois da sincronização
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

-- 4. Verificar se há registros em profiles que não existem em auth.users
-- (Estes são perfis órfãos que podem ser removidos se necessário)
DO $$
DECLARE
    v_orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_orphan_count
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE au.id IS NULL;

    RAISE NOTICE 'Perfis órfãos (em profiles mas não em auth.users): %', v_orphan_count;
    
    -- Opcionalmente, você pode descomentar o código abaixo para remover perfis órfãos
    /*
    DELETE FROM profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users au WHERE au.id = p.id
    );
    */
END $$; 