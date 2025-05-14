-- Script para verificar e corrigir problemas na tabela cultivo_produtos_loja

-- 1. Verificar se a função update_timestamp existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_timestamp'
    ) THEN
        -- Criar a função se não existir
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Função update_timestamp criada com sucesso';
    ELSE
        RAISE NOTICE 'Função update_timestamp já existe';
    END IF;
END $$;

-- 2. Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cultivo_produtos_loja'
    ) THEN
        -- Criar a tabela se não existir
        CREATE TABLE cultivo_produtos_loja (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(255) NOT NULL,
            descricao TEXT,
            valor DECIMAL(10, 2) NOT NULL,
            imagem_url TEXT,
            link_checkout TEXT,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela cultivo_produtos_loja criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela cultivo_produtos_loja já existe';
    END IF;
END $$;

-- 3. Verificar e recriar trigger para atualizar o timestamp
DROP TRIGGER IF EXISTS update_cultivo_produtos_loja_timestamp ON cultivo_produtos_loja;

CREATE TRIGGER update_cultivo_produtos_loja_timestamp
BEFORE UPDATE ON cultivo_produtos_loja
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

RAISE NOTICE 'Trigger update_cultivo_produtos_loja_timestamp recriado com sucesso';

-- 4. Verificar e recriar políticas RLS
ALTER TABLE cultivo_produtos_loja ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar duplicatas
DROP POLICY IF EXISTS "Usuários podem visualizar produtos ativos da loja" ON cultivo_produtos_loja;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os produtos da loja" ON cultivo_produtos_loja;

-- Recriar as políticas
CREATE POLICY "Usuários podem visualizar produtos ativos da loja"
    ON cultivo_produtos_loja FOR SELECT
    USING (ativo = TRUE OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Administradores podem gerenciar todos os produtos da loja"
    ON cultivo_produtos_loja FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

RAISE NOTICE 'Políticas RLS recriadas com sucesso';

-- 5. Verificar se há dados na tabela
DO $$
DECLARE
    count_produtos INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_produtos FROM cultivo_produtos_loja;
    
    IF count_produtos = 0 THEN
        -- Inserir dados de exemplo se a tabela estiver vazia
        INSERT INTO cultivo_produtos_loja (nome, descricao, valor, imagem_url, link_checkout, ativo)
        VALUES 
            ('Fertilizante Orgânico Premium', 'Fertilizante 100% orgânico para cultivo indoor, rico em nitrogênio e fósforo.', 89.90, 'https://example.com/imagens/fertilizante.jpg', 'https://checkout.store.com/produto/fertilizante', TRUE),
            ('Kit Iluminação LED Full Spectrum', 'Painel LED completo com espectro ideal para todas as fases do cultivo.', 459.90, 'https://example.com/imagens/led-kit.jpg', 'https://checkout.store.com/produto/led-kit', TRUE),
            ('Substrato Especial', 'Substrato balanceado com perlita e vermiculita para melhor drenagem e aeração das raízes.', 45.50, 'https://example.com/imagens/substrato.jpg', 'https://checkout.store.com/produto/substrato', TRUE);
            
        RAISE NOTICE 'Dados de exemplo inseridos com sucesso';
    ELSE
        RAISE NOTICE 'A tabela já contém % produto(s)', count_produtos;
    END IF;
END $$; 