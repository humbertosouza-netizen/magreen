-- Script para corrigir e verificar o status de ADMIN

-- Parte 1: Verificar o status atual dos usuários com email humbertoboxe2022@gmail.com
SELECT 
  u.id,
  u.email,
  p.role,
  p.nome_completo
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com';

-- Parte 2: Corrigir a promoção para ADMIN
DO $$
DECLARE
  user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Obter o ID do usuário
  SELECT id INTO user_id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email humbertoboxe2022@gmail.com não encontrado';
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
      role, 
      created_at
    )
    VALUES (
      user_id,
      'Humberto Admin',
      'ADMIN',
      NOW()
    );
    RAISE NOTICE 'Perfil criado com sucesso para o usuário %', user_id;
  ELSE
    -- Se o perfil existir, atualizar o role
    UPDATE profiles 
    SET role = 'ADMIN', updated_at = NOW() 
    WHERE id = user_id;
    RAISE NOTICE 'Perfil atualizado com sucesso para o usuário %', user_id;
  END IF;
END;
$$;

-- Parte 3: Verificar novamente após a atualização
SELECT 
  u.id,
  u.email,
  p.role,
  p.nome_completo
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com';

-- Parte 4: Verificar se a coluna role existe na tabela profiles
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- Parte 5: Verificar sessão atual
SELECT 
  auth.uid() as current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email,
  (SELECT role FROM profiles WHERE id = auth.uid()) as current_role; 