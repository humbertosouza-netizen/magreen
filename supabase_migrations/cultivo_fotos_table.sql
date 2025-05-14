-- Tabela de Fotos de Cultivo
CREATE TABLE IF NOT EXISTS cultivo_fotos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registro_id UUID NOT NULL REFERENCES cultivo_registros(id) ON DELETE CASCADE,
    url_imagem VARCHAR(1000) NOT NULL,
    descricao TEXT,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ordem INTEGER DEFAULT 0
);

-- Política RLS para segurança da tabela de fotos
ALTER TABLE cultivo_fotos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Usuários podem visualizar suas próprias fotos de cultivo"
    ON cultivo_fotos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cultivo_registros
            JOIN cultivos ON cultivo_registros.cultivo_id = cultivos.id
            WHERE cultivo_registros.id = cultivo_fotos.registro_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem inserir fotos nos seus próprios cultivos"
    ON cultivo_fotos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cultivo_registros
            JOIN cultivos ON cultivo_registros.cultivo_id = cultivos.id
            WHERE cultivo_registros.id = cultivo_fotos.registro_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar fotos nos seus próprios cultivos"
    ON cultivo_fotos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cultivo_registros
            JOIN cultivos ON cultivo_registros.cultivo_id = cultivos.id
            WHERE cultivo_registros.id = cultivo_fotos.registro_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir fotos nos seus próprios cultivos"
    ON cultivo_fotos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM cultivo_registros
            JOIN cultivos ON cultivo_registros.cultivo_id = cultivos.id
            WHERE cultivo_registros.id = cultivo_fotos.registro_id
            AND cultivos.user_id = auth.uid()
        )
    );

-- Políticas para administradores
CREATE POLICY "Administradores podem visualizar todas as fotos de cultivo"
    ON cultivo_fotos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Administradores podem gerenciar todas as fotos de cultivo"
    ON cultivo_fotos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    ); 