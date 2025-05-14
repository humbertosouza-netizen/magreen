-- Script para corrigir a estrutura da tabela blog_posts
-- Executar este script no SQL Editor do Supabase

-- 1. Verificar se a tabela blog_posts existe
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_posts'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Tabela blog_posts não existe. Criando...';
    
    -- Criar a tabela blog_posts
    CREATE TABLE blog_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      titulo TEXT NOT NULL,
      resumo TEXT,
      conteudo TEXT,
      categoria TEXT,
      tags TEXT[],
      imagem_url TEXT,
      publicado BOOLEAN DEFAULT false,
      autor_id UUID REFERENCES auth.users(id),
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      data_atualizacao TIMESTAMP WITH TIME ZONE,
      data_publicacao TIMESTAMP WITH TIME ZONE,
      visualizacoes INTEGER DEFAULT 0,
      comentarios_count INTEGER DEFAULT 0
    );
    
    RAISE NOTICE 'Tabela blog_posts criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela blog_posts já existe';
  END IF;
END $$;

-- 2. Verificar e adicionar a coluna visualizacoes se estiver faltando
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_posts' 
    AND column_name = 'visualizacoes'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE blog_posts ADD COLUMN visualizacoes INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna visualizacoes adicionada à tabela blog_posts';
  ELSE
    RAISE NOTICE 'Coluna visualizacoes já existe na tabela blog_posts';
  END IF;
END $$;

-- 3. Verificar e adicionar a coluna comentarios_count se estiver faltando
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_posts' 
    AND column_name = 'comentarios_count'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE blog_posts ADD COLUMN comentarios_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna comentarios_count adicionada à tabela blog_posts';
  ELSE
    RAISE NOTICE 'Coluna comentarios_count já existe na tabela blog_posts';
  END IF;
END $$;

-- 4. Criar função para incrementar visualizações de forma segura
CREATE OR REPLACE FUNCTION increment_view(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET visualizacoes = COALESCE(visualizacoes, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar se as políticas RLS existem e criá-las se necessário
DO $$
BEGIN
  -- Habilitar RLS na tabela blog_posts
  ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
  
  -- Política para permitir que todos possam ver posts publicados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Todos podem ver posts publicados'
  ) THEN
    CREATE POLICY "Todos podem ver posts publicados" 
      ON blog_posts FOR SELECT 
      USING (publicado = true);
    RAISE NOTICE 'Política "Todos podem ver posts publicados" criada';
  END IF;
  
  -- Política para permitir que autores vejam seus próprios posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Autores podem ver seus próprios posts'
  ) THEN
    CREATE POLICY "Autores podem ver seus próprios posts" 
      ON blog_posts FOR SELECT 
      USING (autor_id = auth.uid());
    RAISE NOTICE 'Política "Autores podem ver seus próprios posts" criada';
  END IF;
  
  -- Política para permitir que autores editem seus próprios posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Autores podem editar seus próprios posts'
  ) THEN
    CREATE POLICY "Autores podem editar seus próprios posts" 
      ON blog_posts FOR UPDATE 
      USING (autor_id = auth.uid());
    RAISE NOTICE 'Política "Autores podem editar seus próprios posts" criada';
  END IF;
  
  -- Política para permitir que autores excluam seus próprios posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Autores podem excluir seus próprios posts'
  ) THEN
    CREATE POLICY "Autores podem excluir seus próprios posts" 
      ON blog_posts FOR DELETE 
      USING (autor_id = auth.uid());
    RAISE NOTICE 'Política "Autores podem excluir seus próprios posts" criada';
  END IF;
  
  -- Política para permitir que administradores vejam todos os posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Admins podem ver todos os posts'
  ) THEN
    CREATE POLICY "Admins podem ver todos os posts" 
      ON blog_posts FOR SELECT 
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
    RAISE NOTICE 'Política "Admins podem ver todos os posts" criada';
  END IF;
  
  -- Política para permitir que administradores editem todos os posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Admins podem editar todos os posts'
  ) THEN
    CREATE POLICY "Admins podem editar todos os posts" 
      ON blog_posts FOR UPDATE 
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
    RAISE NOTICE 'Política "Admins podem editar todos os posts" criada';
  END IF;
  
  -- Política para permitir que administradores excluam todos os posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Admins podem excluir todos os posts'
  ) THEN
    CREATE POLICY "Admins podem excluir todos os posts" 
      ON blog_posts FOR DELETE 
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
    RAISE NOTICE 'Política "Admins podem excluir todos os posts" criada';
  END IF;
END $$;

-- 6. Resumo do estado atual
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') > 0 AS blog_posts_table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog_posts') AS blog_posts_column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_posts') AS blog_posts_policy_count; 