-- Verificar se a função update_timestamp existe, se não, criar
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de Produtos da Loja
CREATE TABLE IF NOT EXISTS cultivo_produtos_loja (
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

-- Política RLS para segurança da tabela de produtos da loja
ALTER TABLE cultivo_produtos_loja ENABLE ROW LEVEL SECURITY;

-- Remover políticas anteriores se existirem
DROP POLICY IF EXISTS "Usuários podem visualizar produtos ativos da loja" ON cultivo_produtos_loja;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os produtos da loja" ON cultivo_produtos_loja;

-- Políticas para usuários normais (somente leitura)
CREATE POLICY "Usuários podem visualizar produtos ativos da loja"
    ON cultivo_produtos_loja FOR SELECT
    USING (ativo = TRUE OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

-- Políticas para administradores (gerenciamento completo)
CREATE POLICY "Administradores podem gerenciar todos os produtos da loja"
    ON cultivo_produtos_loja FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Remover trigger anterior se existir
DROP TRIGGER IF EXISTS update_cultivo_produtos_loja_timestamp ON cultivo_produtos_loja;

-- Criar trigger para atualizar automaticamente o timestamp de atualização
CREATE TRIGGER update_cultivo_produtos_loja_timestamp
BEFORE UPDATE ON cultivo_produtos_loja
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- Inserir alguns produtos de exemplo se a tabela estiver vazia
INSERT INTO cultivo_produtos_loja (nome, descricao, valor, imagem_url, link_checkout, ativo)
SELECT 
    'Fertilizante Orgânico Premium',
    'Fertilizante 100% orgânico para cultivo indoor, rico em nitrogênio e fósforo.',
    89.90,
    'https://example.com/imagens/fertilizante.jpg',
    'https://checkout.store.com/produto/fertilizante',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM cultivo_produtos_loja LIMIT 1);

INSERT INTO cultivo_produtos_loja (nome, descricao, valor, imagem_url, link_checkout, ativo)
SELECT
    'Kit Iluminação LED Full Spectrum',
    'Painel LED completo com espectro ideal para todas as fases do cultivo.',
    459.90,
    'https://example.com/imagens/led-kit.jpg',
    'https://checkout.store.com/produto/led-kit',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM cultivo_produtos_loja LIMIT 1);

INSERT INTO cultivo_produtos_loja (nome, descricao, valor, imagem_url, link_checkout, ativo)
SELECT
    'Substrato Especial',
    'Substrato balanceado com perlita e vermiculita para melhor drenagem e aeração das raízes.',
    45.50,
    'https://example.com/imagens/substrato.jpg',
    'https://checkout.store.com/produto/substrato',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM cultivo_produtos_loja LIMIT 1);

INSERT INTO cultivo_produtos_loja (nome, descricao, valor, imagem_url, link_checkout, ativo)
SELECT
    'Medidor de pH Digital',
    'Equipamento preciso para monitoramento do pH da solução nutritiva.',
    120.00,
    'https://example.com/imagens/medidor-ph.jpg',
    'https://checkout.store.com/produto/medidor-ph',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM cultivo_produtos_loja LIMIT 1); 