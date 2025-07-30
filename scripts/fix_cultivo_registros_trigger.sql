-- Script para corrigir problemas com a tabela cultivo_registros
-- Verificar e recriar a função update_timestamp se necessário

-- 1. Verificar se a função update_timestamp existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_timestamp') THEN
        -- Criar a função update_timestamp
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.data_atualizacao = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Função update_timestamp criada com sucesso';
    ELSE
        RAISE NOTICE 'Função update_timestamp já existe';
    END IF;
END $$;

-- 2. Verificar se o trigger existe e recriá-lo se necessário
DROP TRIGGER IF EXISTS update_cultivo_registros_timestamp ON cultivo_registros;

CREATE TRIGGER update_cultivo_registros_timestamp
BEFORE UPDATE ON cultivo_registros
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- 3. Verificar se a tabela cultivo_registros tem a estrutura correta
DO $$
BEGIN
    -- Verificar se a coluna data_atualizacao existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cultivo_registros' 
        AND column_name = 'data_atualizacao'
    ) THEN
        -- Adicionar a coluna data_atualizacao se não existir
        ALTER TABLE cultivo_registros 
        ADD COLUMN data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Coluna data_atualizacao adicionada à tabela cultivo_registros';
    ELSE
        RAISE NOTICE 'Coluna data_atualizacao já existe na tabela cultivo_registros';
    END IF;
END $$;

-- 4. Verificar se não há colunas problemáticas
DO $$
BEGIN
    -- Verificar se existe uma coluna updated_at (que não deveria existir)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cultivo_registros' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE 'ATENÇÃO: Coluna updated_at encontrada na tabela cultivo_registros. Esta coluna não deveria existir.';
    ELSE
        RAISE NOTICE 'Tabela cultivo_registros não possui coluna updated_at (correto)';
    END IF;
END $$;

-- 5. Verificar a estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'cultivo_registros' 
ORDER BY ordinal_position; 