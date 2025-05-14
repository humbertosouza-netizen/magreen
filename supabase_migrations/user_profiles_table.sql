-- Criar a tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  banned BOOLEAN DEFAULT false,
  banned_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Estabelecer segurança em nível de linha (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas para que os usuários possam ler/atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Permitir administradores ver todos os perfis
CREATE POLICY "Administradores podem ver todos os perfis"
  ON user_profiles FOR SELECT
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar timestamp automaticamente
CREATE TRIGGER update_user_profiles_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- Criar trigger para criar perfil automaticamente quando um novo usuário é registrado
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nome_completo, created_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a function acima quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 