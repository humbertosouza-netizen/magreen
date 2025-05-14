-- Definição da tabela de aulas
CREATE TABLE IF NOT EXISTS aulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  video_url TEXT NOT NULL,
  material_url TEXT,
  duracao TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona permissões RLS (Row Level Security)
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados possam ver aulas de cursos publicados
CREATE POLICY "Usuários autenticados podem ver aulas de cursos publicados" ON aulas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cursos
      WHERE cursos.id = aulas.curso_id
      AND (cursos.publicado = true OR auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE role = 'admin'
      ))
    )
  );

-- Política para permitir que admins vejam todas as aulas
CREATE POLICY "Admins podem ver todas as aulas" ON aulas
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ));

-- Política para permitir apenas admins para inserir/atualizar/deletar aulas
CREATE POLICY "Apenas admins podem modificar aulas" ON aulas
  FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ));

-- Trigger para atualizar o updated_at sempre que um registro for modificado
CREATE TRIGGER update_aulas_timestamp
BEFORE UPDATE ON aulas
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp(); 