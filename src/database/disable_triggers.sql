-- Script para desabilitar temporariamente o gatilho que causa problemas
-- Isso permitirá identificar se o gatilho é a causa do erro na criação de usuários

-- Desabilitar o gatilho que cria perfis automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar uma versão simplificada da função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Versão simplificada que apenas registra a tentativa sem fazer inserções
  RAISE NOTICE 'Novo usuário criado: %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que os usuários atuais (em especial os administradores) mantenham seus privilégios
UPDATE profiles
SET role = 'admin'
WHERE email IN ('admin@magnificencia.com.br', 'humbertoboxe2022@gmail.com');

-- Mensagem informativa para o log
DO $$
BEGIN
  RAISE NOTICE 'Gatilho de criação automática de perfis desativado temporariamente.';
  RAISE NOTICE 'Após testar a criação de usuários, execute o script restore_triggers.sql para restaurar.';
END $$; 