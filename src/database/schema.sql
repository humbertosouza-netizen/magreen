-- Schema SQL consolidado para a aplicação
-- Este arquivo contém todas as definições de tabelas, funções e políticas de segurança

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela para armazenar perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  telefone TEXT,
  data_nascimento DATE,
  bio TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USUARIO' CHECK (role IN ('ADMIN', 'USUARIO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Estabelecer segurança em nível de linha (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas para que os usuários possam ler/atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis" 
  ON profiles FOR SELECT 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins podem atualizar todos os perfis" 
  ON profiles FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

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

-- Tabela para armazenar posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  tags TEXT[],
  imagem_url TEXT,
  publicado BOOLEAN DEFAULT false,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar índices para o blog
CREATE INDEX IF NOT EXISTS idx_blog_posts_autor ON blog_posts(autor_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_categoria ON blog_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publicado ON blog_posts(publicado);

-- Habilitar RLS (Row Level Security) para a tabela de blog
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para posts do blog
-- Qualquer pessoa pode ver posts publicados
CREATE POLICY "Posts publicados são visíveis para todos" 
  ON blog_posts FOR SELECT 
  USING (publicado = true);

-- Admins podem ver todos os posts (incluindo rascunhos)
CREATE POLICY "Admins podem ver todos os posts" 
  ON blog_posts FOR SELECT 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Autores podem ver seus próprios posts (mesmo não publicados)
CREATE POLICY "Autores podem ver seus próprios posts" 
  ON blog_posts FOR SELECT 
  USING (autor_id = auth.uid());

-- Apenas ADMINs podem inserir posts
CREATE POLICY "Apenas ADMINs podem criar posts" 
  ON blog_posts FOR INSERT 
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Apenas ADMINs podem atualizar posts
CREATE POLICY "Apenas ADMINs podem atualizar posts" 
  ON blog_posts FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Apenas ADMINs podem deletar posts
CREATE POLICY "Apenas ADMINs podem deletar posts" 
  ON blog_posts FOR DELETE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Tabela para comentários do blog
CREATE TABLE IF NOT EXISTS blog_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  likes INTEGER DEFAULT 0
);

-- Criar índice para comentários
CREATE INDEX IF NOT EXISTS idx_blog_comentarios_post ON blog_comentarios(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comentarios_autor ON blog_comentarios(autor_id);

-- Habilitar RLS para comentários
ALTER TABLE blog_comentarios ENABLE ROW LEVEL SECURITY;

-- Todos podem ver comentários
CREATE POLICY "Todos podem ver comentários" 
  ON blog_comentarios FOR SELECT 
  USING (true);

-- Usuários logados podem inserir comentários em posts publicados
CREATE POLICY "Usuários logados podem inserir comentários" 
  ON blog_comentarios FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (SELECT publicado FROM blog_posts WHERE id = post_id) = true
  );

-- Usuários podem editar seus próprios comentários
CREATE POLICY "Usuários podem editar seus próprios comentários" 
  ON blog_comentarios FOR UPDATE 
  USING (autor_id = auth.uid());

-- Admins podem deletar qualquer comentário
CREATE POLICY "Admins podem deletar qualquer comentário" 
  ON blog_comentarios FOR DELETE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Usuários podem deletar seus próprios comentários
CREATE POLICY "Usuários podem deletar seus próprios comentários" 
  ON blog_comentarios FOR DELETE 
  USING (autor_id = auth.uid());

-- Tabela de notificações
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

-- =====================================================
-- FUNÇÕES DE ADMINISTRAÇÃO
-- =====================================================

-- Função para verificar se o usuário atual é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para promover usuário a ADMIN
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é ADMIN
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'ADMIN' THEN
    RAISE EXCEPTION 'Apenas administradores podem promover outros usuários';
    RETURN false;
  END IF;
  
  -- Promover usuário para ADMIN
  UPDATE profiles 
  SET role = 'ADMIN', updated_at = NOW() 
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para rebaixar um ADMIN para USUARIO normal
CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é ADMIN
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'ADMIN' THEN
    RAISE EXCEPTION 'Apenas administradores podem rebaixar outros usuários';
    RETURN false;
  END IF;
  
  -- Não permitir que um admin se rebaixe a si mesmo
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Um administrador não pode rebaixar a si mesmo';
    RETURN false;
  END IF;
  
  -- Rebaixar admin para usuário normal
  UPDATE profiles 
  SET role = 'USUARIO', updated_at = NOW() 
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para banir um usuário
CREATE OR REPLACE FUNCTION ban_user(user_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é ADMIN
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'ADMIN' THEN
    RAISE EXCEPTION 'Apenas administradores podem banir usuários';
    RETURN false;
  END IF;
  
  -- Não permitir que um admin se bane a si mesmo
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Um administrador não pode banir a si mesmo';
    RETURN false;
  END IF;
  
  -- Banir o usuário
  UPDATE profiles 
  SET nome_completo = 'Usuário Banido', 
      telefone = '', 
      data_nascimento = NULL, 
      bio = CONCAT('Banido por: ', reason), 
      avatar_url = '', 
      updated_at = NOW(),
      role = 'USUARIO' -- Garantir que usuário banido não seja ADMIN
  WHERE id = user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÕES PARA NOTIFICAÇÕES
-- =====================================================

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

-- =====================================================
-- TRIGGERS E AUTOMAÇÕES
-- =====================================================

-- Função para criar automaticamente um perfil quando um novo usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    nome_completo, 
    telefone, 
    data_nascimento, 
    bio, 
    avatar_url,
    role, 
    created_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'birthday', NULL),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'USUARIO',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a function acima quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 