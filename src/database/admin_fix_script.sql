-- Script para garantir que o usuário seja reconhecido como administrador
-- Execute este script no SQL Editor do Supabase

DO $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_email TEXT := 'humbertoboxe2022@gmail.com'; -- Substituir pelo seu email se diferente
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', v_email;
  END IF;
  
  -- Atualizar role para ADMIN em maiúsculas
  UPDATE profiles
  SET 
    role = 'ADMIN',
    updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Verificar se foi atualizado corretamente
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  
  RAISE NOTICE 'Usuário % atualizado. Role atual: %', v_email, v_role;
  
  -- Invalidar qualquer cache que possa existir
  -- Isso depende da implementação específica do sistema
  EXECUTE 'NOTIFY user_role_change, ''' || v_user_id || '''';
  
END;
$$;

-- Consultar para verificar o status atual
SELECT 
  u.email,
  p.role,
  p.created_at,
  p.updated_at,
  auth.uid() = p.id as is_current_user
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com'; 