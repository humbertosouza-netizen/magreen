-- Script para corrigir a restrição CHECK na coluna "role" da tabela profiles

-- 1. Verificar a restrição atual
DO $$
DECLARE
    v_constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid)
    INTO v_constraint_def
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
    AND conrelid = 'profiles'::regclass;

    RAISE NOTICE 'Definição atual da restrição: %', v_constraint_def;
END $$;

-- 2. Verificar valores existentes na coluna role
DO $$
DECLARE
    v_distinct_roles TEXT;
BEGIN
    SELECT string_agg(DISTINCT role, ', ' ORDER BY role)
    INTO v_distinct_roles
    FROM profiles
    WHERE role IS NOT NULL;

    RAISE NOTICE 'Valores distintos existentes na coluna role: %', v_distinct_roles;
END $$;

-- 3. Remover a restrição existente
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 4. Adicionar a nova restrição que aceite todos os valores necessários
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role::text = ANY (ARRAY['admin', 'user', 'ADMIN', 'USUARIO', 'client']::text[]));

-- 5. Garantir que os usuários atuais tenham seus perfis corretamente mapeados
UPDATE profiles SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id 
AND (profiles.email IS NULL OR profiles.email <> auth.users.email);

-- 6. Sincronizar usuários que não têm perfil
INSERT INTO profiles (
    id, 
    nome_completo, 
    email, 
    role, 
    telefone, 
    bio, 
    avatar_url, 
    created_at, 
    updated_at,
    banned
)
SELECT 
    au.id, 
    COALESCE(au.raw_user_meta_data->>'nickname', split_part(au.email, '@', 1)), 
    au.email,
    'USUARIO', -- Use o valor padrão conforme existente no seu banco
    '',
    '',
    '',
    au.created_at,
    NOW(),
    false
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 7. Verificar se os perfis foram sincronizados
DO $$
DECLARE
    v_auth_count INTEGER;
    v_profiles_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_auth_count FROM auth.users WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_profiles_count FROM profiles;
    
    RAISE NOTICE 'Usuários em auth: %, Perfis em profiles: %', v_auth_count, v_profiles_count;
    
    IF v_auth_count = v_profiles_count THEN
        RAISE NOTICE 'Sincronização completa!';
    ELSE
        RAISE NOTICE 'Ainda há uma diferença de % registros', v_auth_count - v_profiles_count;
    END IF;
END $$; 