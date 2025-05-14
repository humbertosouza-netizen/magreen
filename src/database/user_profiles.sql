-- Tabela para armazenar perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  telefone TEXT,
  data_nascimento DATE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Índices para melhorar a performance das consultas
CREATE INDEX idx_profiles_id ON profiles(id);

-- Estabelecer segurança em nível de linha (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas para que os usuários possam ler/atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar timestamp automaticamente
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar a tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('evento', 'webinar', 'conteudo', 'interacao')),
  data TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  lida BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Estabelecer segurança em nível de linha (RLS)
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas para que os usuários possam ver/atualizar apenas suas próprias notificações
CREATE POLICY "Usuários podem ver suas próprias notificações" 
  ON notificacoes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notificações" 
  ON notificacoes FOR UPDATE 
  USING (auth.uid() = user_id);

-- Criar índices para otimizar consultas comuns
CREATE INDEX IF NOT EXISTS notificacoes_user_id_idx ON notificacoes (user_id);
CREATE INDEX IF NOT EXISTS notificacoes_lida_idx ON notificacoes (user_id, lida);
CREATE INDEX IF NOT EXISTS notificacoes_tipo_idx ON notificacoes (user_id, tipo);

-- Função para criar notificações para um usuário
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_titulo TEXT,
  p_descricao TEXT,
  p_tipo TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notificacoes (user_id, titulo, descricao, tipo, link)
  VALUES (p_user_id, p_titulo, p_descricao, p_tipo, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificações como lidas
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM notificacoes WHERE id = p_notification_id;
  
  -- Verificar se a notificação pertence ao usuário atual
  IF v_user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  UPDATE notificacoes SET lida = true WHERE id = p_notification_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas as notificações de um usuário como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read() 
RETURNS VOID AS $$
BEGIN
  UPDATE notificacoes SET lida = true WHERE user_id = auth.uid() AND lida = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar automaticamente um perfil quando um novo usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, telefone, data_nascimento, bio, avatar_url, created_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'birthday', NULL),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a function acima quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criação do primeiro usuário administrador (substitua os valores conforme necessário)
INSERT INTO profiles (id, nome_completo, telefone, data_nascimento, bio, avatar_url, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID real do usuário
  'Administrador',                        -- Nome do administrador
  'admin@exemplo.com',                    -- Substitua pelo email real do administrador
  '1970-01-01',                           -- Data de nascimento do administrador
  'Este é o administrador do sistema.',    -- Biografia do administrador
  'https://example.com/admin.jpg',         -- URL do avatar do administrador
  NOW()
) ON CONFLICT (id) DO UPDATE 
SET nome_completo = EXCLUDED.nome_completo, 
    telefone = EXCLUDED.telefone,
    data_nascimento = EXCLUDED.data_nascimento,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

-- Função para definir usuário como administrador (apenas para ser usada pelo primeiro administrador)
CREATE OR REPLACE FUNCTION promote_to_admin(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET nome_completo = 'Administrador', telefone = 'admin@exemplo.com', data_nascimento = '1970-01-01', bio = 'Este é o administrador do sistema.', avatar_url = 'https://example.com/admin.jpg', updated_at = NOW() 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para banir um usuário
CREATE OR REPLACE FUNCTION ban_user(user_id UUID, reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET nome_completo = 'Usuário Banido', telefone = '', data_nascimento = NULL, bio = CONCAT('Banido por: ', reason), avatar_url = '', updated_at = NOW() 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 