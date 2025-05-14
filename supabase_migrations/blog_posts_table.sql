-- Tabela de Posts do Blog
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    resumo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    autor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    categoria VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    imagem_url TEXT,
    publicado BOOLEAN DEFAULT false,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_publicacao TIMESTAMP WITH TIME ZONE,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS blog_posts_autor_id_idx ON blog_posts(autor_id);
CREATE INDEX IF NOT EXISTS blog_posts_publicado_idx ON blog_posts(publicado);
CREATE INDEX IF NOT EXISTS blog_posts_categoria_idx ON blog_posts(categoria);

-- Comentários na tabela e colunas para documentação
COMMENT ON TABLE blog_posts IS 'Posts do blog da plataforma';
COMMENT ON COLUMN blog_posts.id IS 'Identificador único do post';
COMMENT ON COLUMN blog_posts.titulo IS 'Título do post';
COMMENT ON COLUMN blog_posts.resumo IS 'Resumo curto do conteúdo';
COMMENT ON COLUMN blog_posts.conteudo IS 'Conteúdo completo do post';
COMMENT ON COLUMN blog_posts.autor_id IS 'Referência ao usuário autor do post';
COMMENT ON COLUMN blog_posts.categoria IS 'Categoria principal do post';
COMMENT ON COLUMN blog_posts.tags IS 'Array de tags relacionadas ao post';
COMMENT ON COLUMN blog_posts.imagem_url IS 'URL da imagem de capa do post';
COMMENT ON COLUMN blog_posts.publicado IS 'Indica se o post está publicado ou é um rascunho';
COMMENT ON COLUMN blog_posts.data_criacao IS 'Data de criação do post';
COMMENT ON COLUMN blog_posts.data_publicacao IS 'Data em que o post foi publicado';
COMMENT ON COLUMN blog_posts.data_atualizacao IS 'Data da última atualização do post';

-- Trigger para atualizar a data de atualização automaticamente
CREATE OR REPLACE FUNCTION update_blog_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_timestamp
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE PROCEDURE update_blog_post_timestamp();

-- Função auxiliar para verificar se um usuário é administrador
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_id
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para segurança dos posts do blog
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Política para visualização pública somente de posts publicados
CREATE POLICY "Posts publicados são visíveis para todos"
    ON blog_posts FOR SELECT
    USING (publicado = true);

-- Política para autores verem seus próprios posts (publicados ou não)
CREATE POLICY "Autores podem ver todos os seus posts"
    ON blog_posts FOR SELECT
    USING (autor_id = auth.uid());

-- Política simplificada para permitir que qualquer usuário autenticado crie posts
CREATE POLICY "Usuários autenticados podem criar posts"
    ON blog_posts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para permitir que autores atualizem seus próprios posts
CREATE POLICY "Autores podem atualizar seus posts"
    ON blog_posts FOR UPDATE
    USING (autor_id = auth.uid());

-- Política para permitir que autores excluam seus próprios posts
CREATE POLICY "Autores podem excluir seus posts"
    ON blog_posts FOR DELETE
    USING (autor_id = auth.uid());

-- Políticas para administradores usando a função segura
CREATE POLICY "Administradores podem ver todos os posts"
    ON blog_posts FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Administradores podem atualizar todos os posts"
    ON blog_posts FOR UPDATE
    USING (is_admin(auth.uid()));

CREATE POLICY "Administradores podem excluir todos os posts"
    ON blog_posts FOR DELETE
    USING (is_admin(auth.uid())); 