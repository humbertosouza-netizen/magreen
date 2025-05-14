-- Script para promover humbertoboxe2022@gmail.com para ADMIN
-- Este script garante que o usuário tenha um perfil e o papel de administrador

DO $$
DECLARE
  user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- 1. Obter o ID do usuário
  SELECT id INTO user_id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com';
  
  -- Verificar se o usuário existe
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email humbertoboxe2022@gmail.com não encontrado';
  END IF;
  
  -- 2. Verificar se o perfil existe
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id
  ) INTO profile_exists;
  
  -- 3. Se o perfil não existir, criar um
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
    -- 4. Atualizar o perfil existente para ADMIN
    UPDATE profiles 
    SET role = 'ADMIN', 
        updated_at = NOW(),
        nome_completo = COALESCE(nome_completo, 'Humberto Admin')
    WHERE id = user_id;
    RAISE NOTICE 'Perfil atualizado com sucesso para o usuário %', user_id;
  END IF;
  
  -- 5. Verificar resultado
  RAISE NOTICE 'Usuário humbertoboxe2022@gmail.com (ID: %) promovido para ADMIN com sucesso', user_id;
END;
$$;

-- Verificar se o usuário agora é ADMIN
SELECT u.email, p.role, p.nome_completo, p.updated_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com'; 