-- Script SQL para promover humbertoboxe2022@gmail.com para admin
-- Execute este script no SQL Editor do Supabase

DO $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email humbertoboxe2022@gmail.com não encontrado';
  END IF;
  
  -- Verificar se o usuário já tem um perfil e qual é seu papel atual
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  
  IF v_role IS NULL THEN
    -- Se não existe um perfil, criar um com papel de admin
    INSERT INTO profiles (
      id,
      nome_completo,
      email,
      role,
      created_at,
      banned
    ) VALUES (
      v_user_id,
      'Humberto Admin',
      'humbertoboxe2022@gmail.com',
      'ADMIN',
      NOW(),
      false
    );
    
    RAISE NOTICE 'Perfil de administrador criado para o usuário %', v_user_id;
  ELSE
    -- Se já existe um perfil, atualizar para admin
    UPDATE profiles
    SET role = 'ADMIN',
        updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Perfil do usuário % atualizado para administrador', v_user_id;
  END IF;
  
  -- Verificar se a atualização foi bem-sucedida
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  
  IF v_role = 'ADMIN' THEN
    RAISE NOTICE 'Promoção para administrador concluída com sucesso!';
  ELSE
    RAISE EXCEPTION 'Falha ao promover usuário para administrador!';
  END IF;
END;
$$;

-- Verificar se a promoção funcionou
SELECT 
  u.email,
  p.role,
  p.nome_completo,
  p.created_at,
  p.updated_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com'; 