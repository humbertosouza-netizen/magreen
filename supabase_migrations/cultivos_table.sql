-- Tabela de Cultivos
CREATE TABLE IF NOT EXISTS cultivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    genetica VARCHAR(255) NOT NULL,
    ambiente VARCHAR(50) NOT NULL, -- indoor, outdoor, estufa
    iluminacao VARCHAR(255),
    substrato VARCHAR(255),
    sistema VARCHAR(100), -- hidroponia, solo, coco, etc
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'em_andamento', -- em_andamento, finalizado, cancelado
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política RLS para segurança da tabela cultivos
ALTER TABLE cultivos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Usuários podem visualizar seus próprios cultivos"
    ON cultivos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios cultivos"
    ON cultivos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios cultivos"
    ON cultivos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios cultivos"
    ON cultivos FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para administradores
CREATE POLICY "Administradores podem visualizar todos os cultivos"
    ON cultivos FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Administradores podem atualizar todos os cultivos"
    ON cultivos FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Administradores podem excluir todos os cultivos"
    ON cultivos FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

-- Trigger para atualizar automaticamente o timestamp de atualização
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cultivos_timestamp
BEFORE UPDATE ON cultivos
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp(); 