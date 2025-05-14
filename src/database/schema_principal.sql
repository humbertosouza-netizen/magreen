-- =========================================================
-- SCHEMA PRINCIPAL - SISTEMA COMPLETO
-- =========================================================
-- Este arquivo contém toda a estrutura de banco de dados do sistema
-- Organizado por seções para fácil manutenção
-- =========================================================

-- =========================================================
-- PARTE 1: TABELAS DE USUÁRIOS
-- =========================================================

-- Tabela para armazenar perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  telefone TEXT,
  data_nascimento DATE,
  bio TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USUARIO' CHECK (role IN ('ADMIN', 'USUARIO')),
  banned BOOLEAN DEFAULT false,
  banned_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Estabelecer segurança em nível de linha (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verificar e criar políticas RLS apenas se não existirem
DO $$
BEGIN
  -- Verificar se a política "Usuários podem ver seu próprio perfil" existe
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Usuários podem ver seu próprio perfil'
  ) THEN
    -- Criar a política se não existir
    CREATE POLICY "Usuários podem ver seu próprio perfil" 
      ON profiles FOR SELECT 
      USING (auth.uid() = id);
  END IF;

  -- Verificar se a política "Usuários podem atualizar seu próprio perfil" existe
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Usuários podem atualizar seu próprio perfil'
  ) THEN
    -- Criar a política se não existir
    CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
      ON profiles FOR UPDATE 
      USING (auth.uid() = id);
  END IF;

  -- Verificar se a política "Usuários podem inserir seu próprio perfil" existe
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Usuários podem inserir seu próprio perfil'
  ) THEN
    -- Criar a política se não existir
    CREATE POLICY "Usuários podem inserir seu próprio perfil" 
      ON profiles FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Verificar se a política "Admins podem ver todos os perfis" existe
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins podem ver todos os perfis'
  ) THEN
    -- Criar a política se não existir
    CREATE POLICY "Admins podem ver todos os perfis" 
      ON profiles FOR SELECT 
      USING (
        auth.uid() = id OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
      );
  END IF;

  -- Verificar se a política "Admins podem atualizar todos os perfis" existe
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins podem atualizar todos os perfis'
  ) THEN
    -- Criar a política se não existir
    CREATE POLICY "Admins podem atualizar todos os perfis" 
      ON profiles FOR UPDATE 
      USING (
        auth.uid() = id OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
      );
  END IF;
END$$;

-- =========================================================
-- PARTE 2: TABELAS DO BLOG
-- =========================================================

-- Criar a tabela blog_posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  imagem_url TEXT,
  publicado BOOLEAN DEFAULT false,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  comentarios_habilitados BOOLEAN DEFAULT true
);

-- Criar índices para o blog
CREATE INDEX IF NOT EXISTS idx_blog_posts_autor_id ON blog_posts(autor_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_categoria ON blog_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publicado ON blog_posts(publicado) WHERE publicado = true;

-- Criar tabela de comentários do blog
CREATE TABLE IF NOT EXISTS blog_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conteudo TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aprovado BOOLEAN DEFAULT false
);

-- Criar índice para comentários
CREATE INDEX IF NOT EXISTS idx_blog_comentarios_post_id ON blog_comentarios(post_id);

-- Estabelecer segurança em nível de linha (RLS) para blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Verificar e criar políticas RLS para blog_posts
DO $$
BEGIN
  -- Política para visualizar posts publicados (todos os usuários)
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Todos podem ver posts publicados'
  ) THEN
    CREATE POLICY "Todos podem ver posts publicados" 
      ON blog_posts FOR SELECT 
      USING (publicado = TRUE);
  END IF;

  -- Política para autores verem seus próprios posts (publicados ou não)
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Autores podem ver seus próprios posts'
  ) THEN
    CREATE POLICY "Autores podem ver seus próprios posts" 
      ON blog_posts FOR SELECT 
      USING (autor_id = auth.uid());
  END IF;

  -- Política para administradores verem todos os posts
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Admins podem ver todos os posts'
  ) THEN
    CREATE POLICY "Admins podem ver todos os posts" 
      ON blog_posts FOR SELECT 
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
  END IF;

  -- Política para autores atualizarem seus próprios posts
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Autores podem atualizar seus posts'
  ) THEN
    CREATE POLICY "Autores podem atualizar seus posts" 
      ON blog_posts FOR UPDATE 
      USING (autor_id = auth.uid());
  END IF;

  -- Política para admins atualizarem qualquer post
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Admins podem atualizar qualquer post'
  ) THEN
    CREATE POLICY "Admins podem atualizar qualquer post" 
      ON blog_posts FOR UPDATE 
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
  END IF;

  -- Política para admins e autores excluírem posts
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Admins e autores podem excluir posts'
  ) THEN
    CREATE POLICY "Admins e autores podem excluir posts" 
      ON blog_posts FOR DELETE 
      USING (
        autor_id = auth.uid() OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
      );
  END IF;

  -- Política para admins e autores inserirem posts
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Admins e autores podem inserir posts'
  ) THEN
    CREATE POLICY "Admins e autores podem inserir posts" 
      ON blog_posts FOR INSERT 
      WITH CHECK (
        autor_id = auth.uid() OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
      );
  END IF;
END$$;

-- Estabelecer segurança em nível de linha (RLS) para blog_comentarios
ALTER TABLE blog_comentarios ENABLE ROW LEVEL SECURITY;

-- Verificar e criar políticas RLS para blog_comentarios
DO $$
BEGIN
  -- Política para visualizar comentários aprovados
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_comentarios' 
    AND policyname = 'Todos podem ver comentários aprovados'
  ) THEN
    CREATE POLICY "Todos podem ver comentários aprovados" 
      ON blog_comentarios FOR SELECT 
      USING (aprovado = TRUE);
  END IF;

  -- Política para autores verem seus próprios comentários
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_comentarios' 
    AND policyname = 'Usuários podem ver seus próprios comentários'
  ) THEN
    CREATE POLICY "Usuários podem ver seus próprios comentários" 
      ON blog_comentarios FOR SELECT 
      USING (autor_id = auth.uid());
  END IF;

  -- Política para administradores verem todos os comentários
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_comentarios' 
    AND policyname = 'Admins podem ver todos os comentários'
  ) THEN
    CREATE POLICY "Admins podem ver todos os comentários" 
      ON blog_comentarios FOR SELECT 
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
  END IF;

  -- Política para autores atualizarem seus próprios comentários
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_comentarios' 
    AND policyname = 'Usuários podem atualizar seus comentários'
  ) THEN
    CREATE POLICY "Usuários podem atualizar seus comentários" 
      ON blog_comentarios FOR UPDATE 
      USING (autor_id = auth.uid());
  END IF;

  -- Política para administradores atualizarem qualquer comentário
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_comentarios' 
    AND policyname = 'Admins podem atualizar qualquer comentário'
  ) THEN
    CREATE POLICY "Admins podem atualizar qualquer comentário" 
      ON blog_comentarios FOR UPDATE 
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
  END IF;

  -- Política para inserir comentários
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'blog_comentarios' 
    AND policyname = 'Usuários autenticados podem inserir comentários'
  ) THEN
    CREATE POLICY "Usuários autenticados podem inserir comentários" 
      ON blog_comentarios FOR INSERT 
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- =========================================================
-- PARTE 3: TABELA DE NOTIFICAÇÕES
-- =========================================================

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

-- Criar políticas RLS para notificações
DO $$
BEGIN
  -- Verificar se a política "Usuários podem ver suas próprias notificações" existe
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'notificacoes' 
    AND policyname = 'Usuários podem ver suas próprias notificações'
  ) THEN
    CREATE POLICY "Usuários podem ver suas próprias notificações" 
      ON notificacoes FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  -- Verificar se a política "Usuários podem atualizar suas próprias notificações" existe
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'notificacoes' 
    AND policyname = 'Usuários podem atualizar suas próprias notificações'
  ) THEN
    CREATE POLICY "Usuários podem atualizar suas próprias notificações" 
      ON notificacoes FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Criar índices para otimizar consultas comuns
CREATE INDEX IF NOT EXISTS notificacoes_user_id_idx ON notificacoes (user_id);
CREATE INDEX IF NOT EXISTS notificacoes_lida_idx ON notificacoes (user_id, lida);
CREATE INDEX IF NOT EXISTS notificacoes_tipo_idx ON notificacoes (user_id, tipo);

-- =========================================================
-- PARTE 4: TRIGGERS E FUNÇÕES
-- =========================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
DO $$
BEGIN
  -- Verificar se o trigger já existe
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'set_updated_at' 
    AND tgrelid = 'profiles'::regclass
  ) THEN
    -- Criar o trigger se não existir
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Função para criar automaticamente um perfil quando um novo usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, telefone, bio, avatar_url, role, created_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'USUARIO',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a function acima quando um novo usuário é criado
DO $$
BEGIN
  -- Verificar se o trigger já existe
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    -- Criar o trigger se não existir
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

-- Função para contar comentários
CREATE OR REPLACE FUNCTION get_comment_count(post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  comment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO comment_count
  FROM blog_comentarios
  WHERE post_id = $1 AND aprovado = true;
  
  RETURN comment_count;
END;
$$ LANGUAGE plpgsql;

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

-- =========================================================
-- PARTE 5: FUNÇÕES DE ADMINISTRAÇÃO
-- =========================================================

-- Função para verificar se o usuário atual é administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT UPPER(role) = 'ADMIN' FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para promover um usuário a administrador
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é ADMIN
  IF NOT (SELECT is_admin()) THEN
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

-- Função para remover privilégios de administrador
CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é ADMIN
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Apenas administradores podem despromover outros usuários';
    RETURN false;
  END IF;
  
  -- Remover privilégios de ADMIN
  UPDATE profiles 
  SET role = 'USUARIO', updated_at = NOW() 
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para banir um usuário
CREATE OR REPLACE FUNCTION ban_user(target_user_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é ADMIN
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Apenas administradores podem banir usuários';
    RETURN false;
  END IF;
  
  -- Banir o usuário
  UPDATE profiles 
  SET banned = true, banned_reason = reason, updated_at = NOW() 
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para desbanir um usuário
CREATE OR REPLACE FUNCTION unban_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é ADMIN
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Apenas administradores podem desbanir usuários';
    RETURN false;
  END IF;
  
  -- Desbanir o usuário
  UPDATE profiles 
  SET banned = false, banned_reason = NULL, updated_at = NOW() 
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- PARTE 6: SCRIPT PARA CRIAR ADMIN INICIAL
-- =========================================================

-- Executar apenas se não houver nenhum admin
DO $$
DECLARE
  admin_count INTEGER;
  admin_email TEXT := 'humbertoboxe2022@gmail.com';
  admin_id UUID;
BEGIN
  -- Verificar quantos admins existem
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'ADMIN';
  
  -- Verificar se o usuário específico existe
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
  
  -- Se não há admins e o usuário existe, torná-lo admin
  IF admin_count = 0 AND admin_id IS NOT NULL THEN
    -- Verificar se o perfil existe
    IF EXISTS (SELECT 1 FROM profiles WHERE id = admin_id) THEN
      -- Atualizar perfil existente
      UPDATE profiles 
      SET 
        role = 'ADMIN',
        nome_completo = COALESCE(nome_completo, 'Humberto Admin'),
        updated_at = NOW()
      WHERE id = admin_id;
      
      RAISE NOTICE 'Usuário % promovido a administrador com sucesso!', admin_email;
    ELSE
      -- Criar perfil para o administrador
      INSERT INTO profiles (
        id,
        nome_completo,
        role,
        created_at
      )
      VALUES (
        admin_id,
        'Humberto Admin',
        'ADMIN',
        NOW()
      );
      
      RAISE NOTICE 'Perfil de administrador criado para %!', admin_email;
    END IF;
  ELSIF admin_id IS NULL THEN
    RAISE NOTICE 'Usuário % não encontrado. Crie este usuário antes de executar este script.', admin_email;
  ELSE
    RAISE NOTICE 'Já existem administradores no sistema. Nenhuma alteração foi feita.';
  END IF;
END $$; 