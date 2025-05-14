-- Script para alinhar a interface e o banco de dados
-- Este script ajusta o gatilho de criação de perfis para mapear corretamente
-- os campos do formulário para a estrutura da tabela

-- 1. Primeiro, desabilitar o gatilho existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Atualizar a função handle_new_user para mapear corretamente os campos
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela profiles com mapeamento correto
  INSERT INTO public.profiles (
    id,                  -- ID do usuário (obrigatório)
    nome_completo,       -- Mapear para o nickname do formulário
    email,               -- Email do usuário (obrigatório)
    telefone,            -- Deixar vazio, não está no formulário
    data_nascimento,     -- NULL, não está no formulário
    bio,                 -- Deixar vazio, não está no formulário
    avatar_url,          -- Deixar vazio, não está no formulário
    created_at,          -- Data atual
    updated_at,          -- Data atual
    role,                -- Função do usuário (padrão: 'user')
    instagram            -- Campo do formulário
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    NEW.email,
    '',                                                  -- telefone vazio
    NULL,                                                -- data_nascimento NULL
    '',                                                  -- bio vazia
    '',                                                  -- avatar_url vazio
    NOW(),                                               -- created_at
    NOW(),                                               -- updated_at
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),  -- role (padrão: 'user')
    COALESCE(NEW.raw_user_meta_data->>'instagram', '')  -- instagram
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Restaurar o gatilho com a função corrigida
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar se o campo instagram existe na tabela profiles
DO $$
BEGIN
  -- Adicionar o campo instagram se ele não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE profiles ADD COLUMN instagram TEXT;
    RAISE NOTICE 'Campo instagram adicionado à tabela profiles';
  ELSE
    RAISE NOTICE 'Campo instagram já existe na tabela profiles';
  END IF;
END $$;

-- 5. Garantir que as políticas RLS permitam a criação de novos perfis
-- Isso evita o erro "Database error saving new user"
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (true);  -- Permite qualquer inserção durante o cadastro

-- Mensagem informativa
RAISE NOTICE 'Gatilho e políticas RLS foram atualizados para alinhar com a interface.'; 