-- =========================================================
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS
-- =========================================================
-- Este script executa todos os passos necessários para inicializar
-- o banco de dados do sistema em um ambiente limpo ou atualizar 
-- um ambiente existente de forma segura
-- =========================================================

-- Exibir mensagem de início
DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'INICIALIZANDO BANCO DE DADOS DO SISTEMA';
  RAISE NOTICE 'Data e hora: % (Horário do servidor)', NOW();
  RAISE NOTICE '=================================================================';
END $$;

-- Verificar se o script está sendo executado com permissões adequadas
DO $$
DECLARE
  current_user_name TEXT;
  is_super BOOLEAN;
BEGIN
  SELECT current_user INTO current_user_name;
  SELECT usesuper INTO is_super FROM pg_user WHERE usename = current_user_name;
  
  RAISE NOTICE '';
  RAISE NOTICE '>> VERIFICANDO PERMISSÕES...';
  RAISE NOTICE '   • Usuário atual: %', current_user_name;
  
  IF is_super THEN
    RAISE NOTICE '   ✓ Usuário tem permissões de superusuário';
  ELSE
    RAISE NOTICE '   ⚠ AVISO: Usuário não tem permissões de superusuário';
    RAISE NOTICE '     Algumas operações podem falhar. Considere executar como superusuário.';
  END IF;
END $$;

-- Parte 1: Aplicar schema principal
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '>> APLICANDO SCHEMA PRINCIPAL...';
END $$;

-- Incluir o arquivo schema_principal.sql (as verificações estão no próprio arquivo)
\i 'schema_principal.sql'

DO $$
BEGIN
  RAISE NOTICE 'Schema principal aplicado com sucesso!';
END $$;

-- Parte 2: Verificar estado atual do banco de dados
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '>> VERIFICANDO ESTADO DO BANCO DE DADOS...';
END $$;

-- Executar verificação do sistema
\i 'verificar_sistema.sql'

-- Adicionar dados de exemplo para desenvolvimento (opcional)
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '>> VERIFICANDO NECESSIDADE DE DADOS DE EXEMPLO...';
  
  -- Verificar se já existem dados no sistema
  DECLARE
    user_count INTEGER;
    post_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
      SELECT COUNT(*) INTO post_count FROM blog_posts;
    ELSE
      post_count := 0;
    END IF;
    
    IF user_count <= 1 AND post_count = 0 THEN
      RAISE NOTICE '   • Sistema sem dados. Considere adicionar dados de exemplo para desenvolvimento.';
      RAISE NOTICE '   • Execute o arquivo dados_exemplo.sql manualmente se necessário.';
    ELSE
      RAISE NOTICE '   ✓ O sistema já possui dados. Pulando criação de dados de exemplo.';
    END IF;
  END;
END $$;

-- Parte 3: Informações finais
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'BANCO DE DADOS INICIALIZADO COM SUCESSO!';
  RAISE NOTICE 'Agora você pode utilizar seu aplicativo.';
  RAISE NOTICE '=================================================================';
END $$; 