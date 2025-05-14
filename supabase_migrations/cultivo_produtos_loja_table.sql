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

-- Trigger para atualizar automaticamente o timestamp de atualização
-- A função update_timestamp já deve existir no banco de dados
CREATE TRIGGER update_cultivo_produtos_loja_timestamp
BEFORE UPDATE ON cultivo_produtos_loja
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp(); 