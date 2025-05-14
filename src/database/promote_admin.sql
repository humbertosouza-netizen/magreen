-- Arquivo SQL para promover humbertoboxe2022@gmail.com para ADMIN

-- Primeiro, vamos encontrar o ID do usuário pelo email
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Obter o ID do usuário a partir do email
  SELECT id INTO user_id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com';
  
  -- Verificar se o usuário existe
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email humbertoboxe2022@gmail.com não encontrado';
  END IF;
  
  -- Promover o usuário para ADMIN
  UPDATE profiles 
  SET role = 'ADMIN', updated_at = NOW() 
  WHERE id = user_id;
  
  -- Mostrar mensagem de confirmação
  RAISE NOTICE 'Usuário humbertoboxe2022@gmail.com (ID: %) promovido para ADMIN com sucesso', user_id;
END;
$$;

-- Verificar se o usuário agora é ADMIN
SELECT u.email, p.role 
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com'; 