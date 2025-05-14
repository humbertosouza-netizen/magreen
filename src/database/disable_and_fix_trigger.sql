-- Desabilitar temporariamente o gatilho que está causando problemas
-- Esta é uma solução imediata para permitir registrar usuários 

-- 1. Remover o gatilho que está causando o problema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Crie uma versão simplificada da função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Versão simplificada que apenas registra a tentativa sem fazer inserções
  RAISE NOTICE 'Novo usuário criado: %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir que a restrição role seja correta
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role::text = ANY (ARRAY['admin', 'user', 'ADMIN', 'USUARIO', 'client']::text[]));

-- 4. Garantir que todos os IDs estão corretos na tabela profiles
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.email IS NULL OR profiles.email <> auth.users.email;

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Gatilho desabilitado. Agora você pode registrar usuários manualmente.';
END $$; 