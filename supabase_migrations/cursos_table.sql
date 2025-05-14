-- Definição da tabela de cursos
CREATE TABLE IF NOT EXISTS cursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  instrutor TEXT NOT NULL,
  imagem_url TEXT,
  video_url TEXT,
  material_url TEXT,
  total_aulas INTEGER DEFAULT 0,
  duracao_total TEXT,
  nivel TEXT CHECK (nivel IN ('Iniciante', 'Intermediário', 'Avançado')),
  publicado BOOLEAN DEFAULT false,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visualizacoes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona permissões RLS (Row Level Security)
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso autenticado para visualização de cursos publicados
CREATE POLICY "Usuários autenticados podem ver cursos publicados" ON cursos
  FOR SELECT
  USING (publicado = true OR auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ));

-- Política para permitir que admins vejam todos os cursos
CREATE POLICY "Admins podem ver todos os cursos" ON cursos
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ));

-- Política para permitir apenas admins para inserir/atualizar/deletar cursos
CREATE POLICY "Apenas admins podem modificar cursos" ON cursos
  FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ));

-- Trigger para atualizar o updated_at sempre que um registro for modificado
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cursos_timestamp
BEFORE UPDATE ON cursos
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp(); 