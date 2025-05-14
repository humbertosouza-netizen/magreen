-- =========================================================
-- SCRIPT DE DIAGNÓSTICO DO SISTEMA
-- =========================================================
-- Este script verifica o estado do banco de dados e relata 
-- problemas comuns que podem afetar o funcionamento do sistema
-- =========================================================

DO $$
DECLARE
  user_count INTEGER;
  admin_count INTEGER;
  posts_count INTEGER;
  published_posts_count INTEGER;
  draft_posts_count INTEGER;
  comments_count INTEGER;
  notifications_count INTEGER;
  v_role TEXT;
  v_admin_email TEXT := 'humbertoboxe2022@gmail.com';
  v_admin_id UUID;
  v_admin_exists BOOLEAN;
  profile_record RECORD;
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'DIAGNÓSTICO DO SISTEMA - VERIFICAÇÃO DE INTEGRIDADE';
  RAISE NOTICE '=================================================================';
  
  -- PARTE 1: Verificação da existência de tabelas
  RAISE NOTICE '';
  RAISE NOTICE '1. VERIFICAÇÃO DE TABELAS:';
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE NOTICE '   ✓ Tabela profiles existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Tabela profiles não existe!';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    RAISE NOTICE '   ✓ Tabela blog_posts existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Tabela blog_posts não existe!';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comentarios') THEN
    RAISE NOTICE '   ✓ Tabela blog_comentarios existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Tabela blog_comentarios não existe!';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notificacoes') THEN
    RAISE NOTICE '   ✓ Tabela notificacoes existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Tabela notificacoes não existe!';
  END IF;
  
  -- PARTE 2: Verificação da estrutura da tabela profiles
  RAISE NOTICE '';
  RAISE NOTICE '2. VERIFICAÇÃO DA ESTRUTURA DA TABELA PROFILES:';
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'nome_completo') THEN
    RAISE NOTICE '   ✓ Coluna profiles.nome_completo existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Coluna profiles.nome_completo não existe!';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    RAISE NOTICE '   ✓ Coluna profiles.role existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Coluna profiles.role não existe!';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'banned') THEN
    RAISE NOTICE '   ✓ Coluna profiles.banned existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Coluna profiles.banned não existe!';
  END IF;
  
  -- PARTE 3: Estatísticas do sistema
  RAISE NOTICE '';
  RAISE NOTICE '3. ESTATÍSTICAS DO SISTEMA:';
  
  -- Contar usuários
  SELECT COUNT(*) INTO user_count FROM profiles;
  RAISE NOTICE '   • Total de usuários: %', user_count;
  
  -- Contar administradores
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE UPPER(role) = 'ADMIN';
  RAISE NOTICE '   • Total de administradores: %', admin_count;
  
  IF admin_count = 0 THEN
    RAISE NOTICE '   ✗ AVISO: Não há administradores no sistema!';
  END IF;
  
  -- Verificar se existe o administrador específico
  SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;
  IF v_admin_id IS NULL THEN
    RAISE NOTICE '   ✗ AVISO: O usuário % não existe!', v_admin_email;
  ELSE
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_admin_id) INTO v_admin_exists;
    IF v_admin_exists THEN
      SELECT role INTO v_role FROM profiles WHERE id = v_admin_id;
      IF UPPER(v_role) = 'ADMIN' THEN
        RAISE NOTICE '   ✓ Usuário % é administrador', v_admin_email;
      ELSE
        RAISE NOTICE '   ✗ AVISO: Usuário % existe mas NÃO é administrador!', v_admin_email;
      END IF;
    ELSE
      RAISE NOTICE '   ✗ AVISO: Usuário % existe na auth.users mas não tem perfil!', v_admin_email;
    END IF;
  END IF;
  
  -- Estatísticas do blog
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    SELECT COUNT(*) INTO posts_count FROM blog_posts;
    SELECT COUNT(*) INTO published_posts_count FROM blog_posts WHERE publicado = true;
    SELECT COUNT(*) INTO draft_posts_count FROM blog_posts WHERE publicado = false;
    
    RAISE NOTICE '   • Total de posts no blog: %', posts_count;
    RAISE NOTICE '   • Posts publicados: %', published_posts_count;
    RAISE NOTICE '   • Rascunhos: %', draft_posts_count;
  END IF;
  
  -- Estatísticas de comentários
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comentarios') THEN
    SELECT COUNT(*) INTO comments_count FROM blog_comentarios;
    RAISE NOTICE '   • Total de comentários: %', comments_count;
  END IF;
  
  -- Estatísticas de notificações
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notificacoes') THEN
    SELECT COUNT(*) INTO notifications_count FROM notificacoes;
    RAISE NOTICE '   • Total de notificações: %', notifications_count;
  END IF;
  
  -- PARTE 4: Verificação das políticas de segurança
  RAISE NOTICE '';
  RAISE NOTICE '4. VERIFICAÇÃO DE POLÍTICAS DE SEGURANÇA:';
  
  -- Verificar RLS para profiles
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '   ✓ Row Level Security está ativado para profiles';
  ELSE
    RAISE NOTICE '   ✗ AVISO: Row Level Security NÃO está ativado para profiles!';
  END IF;
  
  -- Verificar número de políticas para profiles
  IF (
    SELECT COUNT(*) 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) > 0 THEN
    RAISE NOTICE '   ✓ Existem políticas de segurança para profiles';
  ELSE
    RAISE NOTICE '   ✗ AVISO: Não existem políticas de segurança para profiles!';
  END IF;
  
  -- PARTE 5: Verificação das funções do sistema
  RAISE NOTICE '';
  RAISE NOTICE '5. VERIFICAÇÃO DE FUNÇÕES DO SISTEMA:';
  
  IF EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'is_admin'
  ) THEN
    RAISE NOTICE '   ✓ Função is_admin() existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Função is_admin() não existe!';
  END IF;
  
  IF EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'promote_to_admin'
  ) THEN
    RAISE NOTICE '   ✓ Função promote_to_admin() existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Função promote_to_admin() não existe!';
  END IF;
  
  IF EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '   ✓ Função handle_new_user() existe';
  ELSE
    RAISE NOTICE '   ✗ ERRO: Função handle_new_user() não existe!';
  END IF;
  
  -- PARTE 6: Lista de administradores
  RAISE NOTICE '';
  RAISE NOTICE '6. LISTA DE ADMINISTRADORES:';
  
  FOR profile_record IN (
    SELECT p.id, u.email, p.nome_completo, p.role
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE UPPER(p.role) = 'ADMIN'
  ) LOOP
    RAISE NOTICE '   • % (%) - %', profile_record.nome_completo, profile_record.email, profile_record.role;
  END LOOP;
  
  IF admin_count = 0 THEN
    RAISE NOTICE '   Nenhum administrador encontrado.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'FIM DO DIAGNÓSTICO';
  RAISE NOTICE '=================================================================';
END $$; 