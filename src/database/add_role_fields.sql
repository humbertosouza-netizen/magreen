-- Adicionar campos de gestão de usuários à tabela de perfis
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Adicionar comentários para documentação
COMMENT ON COLUMN profiles.role IS 'Papel do usuário: "admin" ou "user"';
COMMENT ON COLUMN profiles.banned IS 'Indica se o usuário está banido';
COMMENT ON COLUMN profiles.banned_reason IS 'Motivo pelo qual o usuário foi banido';
COMMENT ON COLUMN profiles.email IS 'Email do usuário para correspondência com auth.users';
COMMENT ON COLUMN profiles.last_login IS 'Última vez que o usuário fez login';

-- Criar política para que administradores possam visualizar e editar todos os perfis
CREATE POLICY "Administradores podem visualizar todos os perfis" 
  ON profiles FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Administradores podem atualizar todos os perfis" 
  ON profiles FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Atualizar os perfis existentes com os emails dos usuários
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id AND profiles.email IS NULL;

-- Garantir que os usuários especiais sejam administradores
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@magnificencia.com.br'
   OR email = 'humbertoboxe2022@gmail.com';

-- Criar índice para pesquisa rápida por email
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email); 