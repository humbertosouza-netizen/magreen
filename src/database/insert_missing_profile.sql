-- Script para inserir o perfil faltante

-- Verificar se precisamos criar o perfil
DO $$
DECLARE
  v_user_exists BOOLEAN;
  v_email TEXT;
  v_username TEXT;
BEGIN
  -- Verificar se o usuário existe no auth mas não tem perfil
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE au.id = 'bec7e97e-b030-473b-841c-9e865991df63'
    AND p.id IS NULL
  ) INTO v_user_exists;
  
  IF v_user_exists THEN
    -- Obter email do usuário
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = 'bec7e97e-b030-473b-841c-9e865991df63';
    
    -- Definir nome de usuário a partir do email
    v_username := split_part(v_email, '@', 1);
    
    -- Inserir o perfil faltante
    INSERT INTO profiles (
      id, 
      nome_completo, 
      telefone, 
      bio, 
      avatar_url, 
      created_at, 
      updated_at,
      role, 
      email, 
      banned
    ) VALUES (
      'bec7e97e-b030-473b-841c-9e865991df63',
      v_username,
      '',
      '',
      '',
      NOW(),
      NOW(),
      'USUARIO',
      v_email,
      false
    );
    
    RAISE NOTICE 'Perfil criado com sucesso para o usuário: %', v_email;
  ELSE
    RAISE NOTICE 'Usuário não encontrado ou já possui perfil.';
  END IF;
END $$;

-- Verificar novamente se há usuários sem perfil
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  WHERE p.id IS NULL
  AND au.deleted_at IS NULL;
  
  IF v_count = 0 THEN
    RAISE NOTICE 'Todos os usuários possuem perfil agora!';
  ELSE
    RAISE NOTICE 'Ainda existem % usuários sem perfil!', v_count;
  END IF;
END $$; 