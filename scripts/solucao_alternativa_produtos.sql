-- Script de solução alternativa para problemas de permissão na tabela cultivo_produtos_loja
-- ATENÇÃO: Este script desativa a segurança em nível de linha (RLS) para a tabela de produtos
-- Use apenas em ambiente de desenvolvimento ou quando estiver ciente das implicações de segurança

-- 1. Desativar completamente o RLS para a tabela e informar
DO $$
BEGIN
    ALTER TABLE cultivo_produtos_loja DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Segurança em nível de linha (RLS) desativada para a tabela cultivo_produtos_loja';
END $$;

-- 2. Remover políticas existentes e informar
DO $$
BEGIN
    DROP POLICY IF EXISTS "Usuários podem visualizar produtos ativos da loja" ON cultivo_produtos_loja;
    DROP POLICY IF EXISTS "Administradores podem gerenciar todos os produtos da loja" ON cultivo_produtos_loja;
    DROP POLICY IF EXISTS "Todos podem visualizar produtos ativos" ON cultivo_produtos_loja;
    DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON cultivo_produtos_loja;
    DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON cultivo_produtos_loja;
    DROP POLICY IF EXISTS "Usuários autenticados podem excluir produtos" ON cultivo_produtos_loja;
    RAISE NOTICE 'Políticas RLS removidas da tabela cultivo_produtos_loja';
END $$;

-- 3. Verificar permissões gerais de acesso à tabela
DO $$
BEGIN
    GRANT ALL PRIVILEGES ON TABLE cultivo_produtos_loja TO authenticated;
    GRANT ALL PRIVILEGES ON TABLE cultivo_produtos_loja TO anon;
    GRANT ALL PRIVILEGES ON TABLE cultivo_produtos_loja TO service_role;
    RAISE NOTICE 'Permissões de acesso concedidas a todos os usuários';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao conceder permissões: %', SQLERRM;
END $$;

-- 4. Confirmar status do RLS corretamente
DO $$
DECLARE
    v_has_rls BOOLEAN;
BEGIN
    -- Consulta correta para verificar se o RLS está habilitado
    SELECT relrowsecurity INTO v_has_rls 
    FROM pg_class 
    WHERE relname = 'cultivo_produtos_loja'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF v_has_rls THEN
        RAISE NOTICE 'ALERTA: RLS ainda está ativado para cultivo_produtos_loja';
    ELSE
        RAISE NOTICE 'Confirmado: RLS está desativado para cultivo_produtos_loja';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao verificar status do RLS: %', SQLERRM;
END $$; 