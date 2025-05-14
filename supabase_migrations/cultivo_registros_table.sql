-- Tabela de Registros Semanais de Cultivo
CREATE TABLE IF NOT EXISTS cultivo_registros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cultivo_id UUID NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
    semana INTEGER NOT NULL,
    fase VARCHAR(20) NOT NULL, -- 'germinacao', 'vegetativo', 'floracao'
    altura DECIMAL(6,2), -- cm
    ph DECIMAL(4,2),
    ec DECIMAL(6,2), -- μS/cm
    temperatura DECIMAL(5,2), -- °C
    umidade INTEGER, -- %
    vpd DECIMAL(4,2), -- kPa
    horas_luz INTEGER, -- Horas de luz por dia
    temperatura_solucao DECIMAL(5,2), -- Temperatura da solução nutritiva °C
    volume_reservatorio INTEGER, -- Volume do reservatório em litros
    area_cultivo DECIMAL(5,2), -- Área de cultivo em m²
    aroma TEXT, -- Descrição do aroma (específico para fase floração)
    tecnicas_aplicadas TEXT,
    observacoes TEXT,
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restrição para garantir que cada cultivo tenha apenas um registro por semana
    UNIQUE(cultivo_id, semana)
);

-- Política RLS para segurança da tabela de registros
ALTER TABLE cultivo_registros ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Usuários podem visualizar seus próprios registros de cultivo"
    ON cultivo_registros FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cultivos
            WHERE cultivos.id = cultivo_registros.cultivo_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem inserir registros nos seus próprios cultivos"
    ON cultivo_registros FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cultivos
            WHERE cultivos.id = cultivo_registros.cultivo_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar registros nos seus próprios cultivos"
    ON cultivo_registros FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cultivos
            WHERE cultivos.id = cultivo_registros.cultivo_id
            AND cultivos.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir registros nos seus próprios cultivos"
    ON cultivo_registros FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM cultivos
            WHERE cultivos.id = cultivo_registros.cultivo_id
            AND cultivos.user_id = auth.uid()
        )
    );

-- Políticas para administradores
CREATE POLICY "Administradores podem visualizar todos os registros de cultivo"
    ON cultivo_registros FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Administradores podem atualizar todos os registros de cultivo"
    ON cultivo_registros FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Administradores podem excluir todos os registros de cultivo"
    ON cultivo_registros FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Trigger para atualizar automaticamente o timestamp de atualização
CREATE TRIGGER update_cultivo_registros_timestamp
BEFORE UPDATE ON cultivo_registros
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp(); 