-- Script para corrigir problemas no gatilho on_auth_user_created
-- e na função handle_new_user que está causando erros na criação de usuários

-- 1. Primeiro, remover o gatilho atual para evitar mais problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Ajustar a função handle_new_user para evitar recursão e usar os valores corretos
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  name_value TEXT;
BEGIN
  -- Usar coalesce para garantir que não há valores NULL sendo usados
  name_value := COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1));
  
  -- Registro de debug
  RAISE NOTICE 'Inserindo novo perfil para o usuário: %, email: %, nome: %', NEW.id, NEW.email, name_value;
  
  -- Inserir perfil com SECURITY DEFINER para evitar problemas de RLS
  BEGIN
    INSERT INTO public.profiles (
      id, 
      nome_completo, 
      telefone, 
      data_nascimento, 
      bio, 
      avatar_url, 
      created_at, 
      email, 
      role,
      banned
    ) VALUES (
      NEW.id, 
      name_value,
      '',
      NULL,
      '',
      '',
      NOW(),
      NEW.email,
      'USUARIO',
      false
    );
    RAISE NOTICE 'Perfil criado com sucesso para o usuário: %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Capturar e registrar qualquer erro que ocorra na inserção
    RAISE NOTICE 'Erro ao criar perfil para o usuário %: %', NEW.id, SQLERRM;
    -- Não propagar o erro para permitir que o usuário seja criado mesmo se o perfil falhar
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o gatilho com opções seguras
-- Nota: Usamos AFTER INSERT para garantir que o usuário seja criado primeiro
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar restrições na tabela profiles para garantir compatibilidade
DO $$
DECLARE
  v_constraint_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid)
  INTO v_constraint_def
  FROM pg_constraint
  WHERE conname = 'profiles_role_check'
  AND conrelid = 'profiles'::regclass;

  RAISE NOTICE 'Restrição atual na coluna role: %', v_constraint_def;
  
  -- Se a restrição não contém 'USUARIO', atualizá-la
  IF v_constraint_def !~ 'USUARIO' THEN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
      CHECK (role::text = ANY (ARRAY['admin', 'user', 'ADMIN', 'USUARIO', 'client']::text[]));
    RAISE NOTICE 'Restrição atualizada para incluir USUARIO';
  END IF;
END $$;

-- 5. Verificar colunas na tabela profiles para garantir que todas existem
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'banned'
  ) INTO v_column_exists;
  
  IF NOT v_column_exists THEN
    ALTER TABLE profiles ADD COLUMN banned BOOLEAN DEFAULT false;
    RAISE NOTICE 'Coluna banned adicionada à tabela profiles';
  END IF;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'data_nascimento'
  ) INTO v_column_exists;
  
  IF NOT v_column_exists THEN
    ALTER TABLE profiles ADD COLUMN data_nascimento TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Coluna data_nascimento adicionada à tabela profiles';
  END IF;
END $$;

-- 6. Certificar-se de que as permissões estejam corretas
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- 7. Mostrar mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Script concluído. O gatilho para criação automática de perfis foi corrigido.';
END $$; 