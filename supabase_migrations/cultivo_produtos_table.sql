-- Tabela de Produtos Nutricionais do Cultivo
CREATE TABLE IF NOT EXISTS cultivo_produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registro_id UUID NOT NULL REFERENCES cultivo_registros(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    fabricante VARCHAR(255),
    categoria VARCHAR(100), -- nutriente, estimulante, pesticida, etc
    dosagem VARCHAR(100),
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política RLS para segurança da tabela de produtos
ALTER TABLE cultivo_produtos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Usuários podem visualizar seus próprios produtos de cultivo"
    ON cultivo_produtos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cultivo_registros
            JOIN cultivos ON cultivo_registros.cultivo_id = cultivos.id
            WHERE cultivo_registros.id = cultivo_produtos.registro_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem inserir produtos nos seus próprios cultivos"
    ON cultivo_produtos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cultivo_registros
            JOIN cultivos ON cultivo_registros.cultivo_id = cultivos.id
            WHERE cultivo_registros.id = cultivo_produtos.registro_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar produtos nos seus próprios cultivos"
    ON cultivo_produtos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cultivo_registros
            JOIN cultivos ON cultivo_registros.cultivo_id = cultivos.id
            WHERE cultivo_registros.id = cultivo_produtos.registro_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir produtos nos seus próprios cultivos"
    ON cultivo_produtos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM cultivo_registros
            JOIN cultivos ON cultivo_registros.cultivo_id = cultivos.id
            WHERE cultivo_registros.id = cultivo_produtos.registro_id
            AND cultivos.user_id = auth.uid()
        )
    );

-- Políticas para administradores
CREATE POLICY "Administradores podem visualizar todos os produtos de cultivo"
    ON cultivo_produtos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Administradores podem gerenciar todos os produtos de cultivo"
    ON cultivo_produtos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Trigger para atualizar automaticamente o timestamp de atualização
CREATE TRIGGER update_cultivo_produtos_timestamp
BEFORE UPDATE ON cultivo_produtos
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp(); 