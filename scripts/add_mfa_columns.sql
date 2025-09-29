-- Adicionar colunas para MFA na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];

-- Comentários para documentação
COMMENT ON COLUMN profiles.mfa_enabled IS 'Indica se a autenticação de dois fatores está ativada';
COMMENT ON COLUMN profiles.mfa_secret IS 'Secret TOTP para geração de códigos';
COMMENT ON COLUMN profiles.mfa_backup_codes IS 'Códigos de backup para recuperação de acesso';
