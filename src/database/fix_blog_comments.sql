-- Script para corrigir a estrutura da tabela blog_comentarios
-- Executar este script no SQL Editor do Supabase

-- 1. Verificar se a tabela blog_comentarios existe
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_comentarios'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Tabela blog_comentarios não existe. Criando...';
    
    -- Criar a tabela blog_comentarios
    CREATE TABLE blog_comentarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
      autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      conteudo TEXT NOT NULL,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      aprovado BOOLEAN DEFAULT true,
      likes INTEGER DEFAULT 0
    );
    
    RAISE NOTICE 'Tabela blog_comentarios criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela blog_comentarios já existe';
  END IF;
END $$;

-- 2. Criar função para incrementar contador de comentários
CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET comentarios_count = COALESCE(comentarios_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Verificar se as políticas RLS existem e criá-las se necessário
DO $$
BEGIN
  -- Habilitar RLS na tabela blog_comentarios
  ALTER TABLE blog_comentarios ENABLE ROW LEVEL SECURITY;
  
  -- Política para permitir que todos possam ver comentários aprovados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_comentarios' 
    AND policyname = 'Todos podem ver comentários aprovados'
  ) THEN
    CREATE POLICY "Todos podem ver comentários aprovados" 
      ON blog_comentarios FOR SELECT 
      USING (aprovado = true);
    RAISE NOTICE 'Política "Todos podem ver comentários aprovados" criada';
  END IF;
  
  -- Política para permitir que autores vejam seus próprios comentários
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_comentarios' 
    AND policyname = 'Autores podem ver seus próprios comentários'
  ) THEN
    CREATE POLICY "Autores podem ver seus próprios comentários" 
      ON blog_comentarios FOR SELECT 
      USING (autor_id = auth.uid());
    RAISE NOTICE 'Política "Autores podem ver seus próprios comentários" criada';
  END IF;
  
  -- Política para permitir que usuários autenticados adicionem comentários
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_comentarios' 
    AND policyname = 'Usuários autenticados podem adicionar comentários'
  ) THEN
    CREATE POLICY "Usuários autenticados podem adicionar comentários" 
      ON blog_comentarios FOR INSERT 
      WITH CHECK (auth.uid() IS NOT NULL AND autor_id = auth.uid());
    RAISE NOTICE 'Política "Usuários autenticados podem adicionar comentários" criada';
  END IF;
  
  -- Política para permitir que usuários atualizem seus próprios comentários
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_comentarios' 
    AND policyname = 'Usuários podem atualizar seus próprios comentários'
  ) THEN
    CREATE POLICY "Usuários podem atualizar seus próprios comentários" 
      ON blog_comentarios FOR UPDATE 
      USING (autor_id = auth.uid());
    RAISE NOTICE 'Política "Usuários podem atualizar seus próprios comentários" criada';
  END IF;
  
  -- Política para permitir que usuários excluam seus próprios comentários
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_comentarios' 
    AND policyname = 'Usuários podem excluir seus próprios comentários'
  ) THEN
    CREATE POLICY "Usuários podem excluir seus próprios comentários" 
      ON blog_comentarios FOR DELETE 
      USING (autor_id = auth.uid());
    RAISE NOTICE 'Política "Usuários podem excluir seus próprios comentários" criada';
  END IF;
  
  -- Política para permitir que administradores gerenciem todos os comentários
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_comentarios' 
    AND policyname = 'Admins podem gerenciar todos os comentários'
  ) THEN
    CREATE POLICY "Admins podem gerenciar todos os comentários" 
      ON blog_comentarios 
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
    RAISE NOTICE 'Política "Admins podem gerenciar todos os comentários" criada';
  END IF;
END $$;

-- 4. Verificar contagem de comentários nos posts e atualizá-la
DO $$
DECLARE
  post_record RECORD;
  comment_count INTEGER;
BEGIN
  FOR post_record IN SELECT id FROM blog_posts LOOP
    -- Contar comentários para este post
    SELECT COUNT(*) INTO comment_count 
    FROM blog_comentarios 
    WHERE post_id = post_record.id AND aprovado = true;
    
    -- Atualizar a contagem no post
    UPDATE blog_posts 
    SET comentarios_count = comment_count 
    WHERE id = post_record.id;
    
    RAISE NOTICE 'Atualizando contagem de comentários para post %: %', post_record.id, comment_count;
  END LOOP;
END $$;

-- 5. Resumo do estado atual
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comentarios') > 0 AS blog_comentarios_table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog_comentarios') AS blog_comentarios_column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_comentarios') AS blog_comentarios_policy_count,
  (SELECT COUNT(*) FROM blog_posts) AS total_posts,
  (SELECT COUNT(*) FROM blog_comentarios) AS total_comentarios; 