-- Script para criar a tabela blog_posts e suas dependências

-- Criar a tabela blog_posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  imagem_url TEXT,
  publicado BOOLEAN DEFAULT false,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  comentarios_habilitados BOOLEAN DEFAULT true
);

-- Criar índice para busca por autor
CREATE INDEX IF NOT EXISTS idx_blog_posts_autor_id ON blog_posts(autor_id);

-- Criar índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_blog_posts_categoria ON blog_posts(categoria);

-- Criar índice para busca por publicado (filtrado)
CREATE INDEX IF NOT EXISTS idx_blog_posts_publicado ON blog_posts(publicado) WHERE publicado = true;

-- Criar tabela de comentários do blog
CREATE TABLE IF NOT EXISTS blog_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conteudo TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aprovado BOOLEAN DEFAULT false
);

-- Criar índice para busca de comentários por post
CREATE INDEX IF NOT EXISTS idx_blog_comentarios_post_id ON blog_comentarios(post_id);

-- Políticas de segurança RLS para blog_posts

-- Habilitar RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Políticas para blog_posts
CREATE POLICY "Posts públicos visíveis para todos" 
  ON blog_posts FOR SELECT 
  USING (publicado = true);

CREATE POLICY "Admins podem ver todos os posts" 
  ON blog_posts FOR SELECT 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Autores podem ver seus próprios posts" 
  ON blog_posts FOR SELECT 
  USING (autor_id = auth.uid());

CREATE POLICY "Admins podem inserir posts" 
  ON blog_posts FOR INSERT 
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Admins podem atualizar qualquer post" 
  ON blog_posts FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Autores podem atualizar seus próprios posts" 
  ON blog_posts FOR UPDATE 
  USING (autor_id = auth.uid());

CREATE POLICY "Admins podem excluir posts" 
  ON blog_posts FOR DELETE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Políticas de segurança RLS para blog_comentarios

-- Habilitar RLS
ALTER TABLE blog_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas para blog_comentarios
CREATE POLICY "Comentários aprovados visíveis para todos" 
  ON blog_comentarios FOR SELECT 
  USING (aprovado = true);

CREATE POLICY "Admins podem ver todos os comentários" 
  ON blog_comentarios FOR SELECT 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Autores podem ver seus próprios comentários" 
  ON blog_comentarios FOR SELECT 
  USING (autor_id = auth.uid());

CREATE POLICY "Usuários autenticados podem inserir comentários" 
  ON blog_comentarios FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem aprovar/rejeitar comentários" 
  ON blog_comentarios FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Admins podem excluir comentários" 
  ON blog_comentarios FOR DELETE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Função para contar comentários
CREATE OR REPLACE FUNCTION get_comment_count(post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  comment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO comment_count
  FROM blog_comentarios
  WHERE post_id = $1 AND aprovado = true;
  
  RETURN comment_count;
END;
$$ LANGUAGE plpgsql; 