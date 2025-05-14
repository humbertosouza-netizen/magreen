-- Adicionar colunas de nickname e instagram à tabela de perfis
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Atualizar os perfis existentes com os dados do auth.users.user_metadata
UPDATE profiles
SET 
  nickname = (auth.users.raw_user_meta_data->>'nickname'),
  instagram = (auth.users.raw_user_meta_data->>'instagram')
FROM auth.users
WHERE profiles.id = auth.users.id
  AND (auth.users.raw_user_meta_data->>'nickname' IS NOT NULL 
    OR auth.users.raw_user_meta_data->>'instagram' IS NOT NULL);

COMMENT ON COLUMN profiles.nickname IS 'Nickname do usuário para exibição';
COMMENT ON COLUMN profiles.instagram IS 'Nome de usuário ou link do Instagram'; 