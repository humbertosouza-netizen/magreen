-- Use este comando SQL para tornar humbertoboxe2022@gmail.com um administrador.
-- Este é um comando SQL para executar diretamente no Supabase SQL Editor

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Busca o ID do usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email humbertoboxe2022@gmail.com não encontrado';
  END IF;
  
  -- Atualiza o perfil para ADMIN
  UPDATE profiles
  SET role = 'ADMIN'
  WHERE id = v_user_id;
  
  -- Verifica se a atualização teve sucesso
  IF FOUND THEN
    RAISE NOTICE 'Usuário % agora é ADMIN', 'humbertoboxe2022@gmail.com';
  ELSE
    RAISE EXCEPTION 'Falha ao promover usuário para ADMIN';
  END IF;
END;
$$;

-- Verificar se a alteração foi realizada com sucesso
SELECT u.email, p.role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com'; 