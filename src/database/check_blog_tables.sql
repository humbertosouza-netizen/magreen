-- Script para verificar se as tabelas do blog existem e mostrar informações básicas

-- Variáveis para armazenar resultados
DO $$
DECLARE
  blog_posts_exists BOOLEAN;
  blog_comments_exists BOOLEAN;
  posts_count INTEGER;
  published_count INTEGER;
  draft_count INTEGER;
  admin_count INTEGER;
  profile_record RECORD;
BEGIN
  -- Verificar se a tabela blog_posts existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_posts'
  ) INTO blog_posts_exists;

  -- Verificar se a tabela blog_comentarios existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_comentarios'
  ) INTO blog_comments_exists;

  -- Exibir resultado da verificação
  RAISE NOTICE '-------------------------------------------------------------';
  RAISE NOTICE 'DIAGNÓSTICO DO SISTEMA DE BLOG';
  RAISE NOTICE '-------------------------------------------------------------';
  
  IF blog_posts_exists THEN
    RAISE NOTICE 'Tabela blog_posts: EXISTE';
    
    -- Contar posts
    SELECT COUNT(*) INTO posts_count FROM blog_posts;
    SELECT COUNT(*) INTO published_count FROM blog_posts WHERE publicado = true;
    SELECT COUNT(*) INTO draft_count FROM blog_posts WHERE publicado = false;
    
    RAISE NOTICE 'Total de posts: %', posts_count;
    RAISE NOTICE 'Posts publicados: %', published_count;
    RAISE NOTICE 'Rascunhos: %', draft_count;
    
    -- Verificar constraints e índices
    RAISE NOTICE 'Colunas da tabela blog_posts:';
    FOR profile_record IN (
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'blog_posts'
      ORDER BY ordinal_position
    ) LOOP
      RAISE NOTICE '  - % (%)', profile_record.column_name, profile_record.data_type;
    END LOOP;
  ELSE
    RAISE NOTICE 'Tabela blog_posts: NÃO EXISTE';
    RAISE NOTICE 'Execute o script blog_tables.sql para criar as tabelas necessárias';
  END IF;
  
  RAISE NOTICE '';
  
  IF blog_comments_exists THEN
    RAISE NOTICE 'Tabela blog_comentarios: EXISTE';
    
    -- Contar comentários se a tabela existir
    SELECT COUNT(*) INTO posts_count FROM blog_comentarios;
    RAISE NOTICE 'Total de comentários: %', posts_count;
  ELSE
    RAISE NOTICE 'Tabela blog_comentarios: NÃO EXISTE';
  END IF;
  
  -- Verificar usuários administradores
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'ADMIN';
  RAISE NOTICE '';
  RAISE NOTICE 'Usuários administradores: %', admin_count;
  
  -- Listar administradores
  RAISE NOTICE 'Lista de administradores:';
  FOR profile_record IN (
    SELECT p.id, u.email, p.nome_completo, p.role
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'ADMIN'
  ) LOOP
    RAISE NOTICE '  - % (%) - %', profile_record.nome_completo, profile_record.email, profile_record.role;
  END LOOP;
  
  RAISE NOTICE '-------------------------------------------------------------';
  RAISE NOTICE 'FIM DO DIAGNÓSTICO';
  RAISE NOTICE '-------------------------------------------------------------';
END $$; 