-- Script para corrigir permissões da tabela blog_posts
-- Função auxiliar para verificar se um usuário é administrador (utilizando SECURITY DEFINER)
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

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Posts publicados são visíveis para todos" ON blog_posts;
DROP POLICY IF EXISTS "Autores podem ver todos os seus posts" ON blog_posts;
DROP POLICY IF EXISTS "Autores podem criar posts" ON blog_posts;
DROP POLICY IF EXISTS "Usuários autenticados podem criar posts" ON blog_posts;
DROP POLICY IF EXISTS "Autores podem atualizar seus posts" ON blog_posts;
DROP POLICY IF EXISTS "Autores podem excluir seus posts" ON blog_posts;
DROP POLICY IF EXISTS "Administradores podem ver todos os posts" ON blog_posts;
DROP POLICY IF EXISTS "Administradores podem inserir posts" ON blog_posts;
DROP POLICY IF EXISTS "Administradores podem atualizar todos os posts" ON blog_posts;
DROP POLICY IF EXISTS "Administradores podem excluir todos os posts" ON blog_posts;

-- Garantir que RLS está habilitado
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Recriar as políticas com configurações otimizadas

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

-- Verificar se a coluna tags aceita arrays vazios (em vez de NULL)
DO $$
BEGIN
    -- Verificar se a coluna tags tem o valor padrão correto
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'tags' 
        AND table_schema = 'public'
        AND column_default != '''{}''::text[]'
    ) THEN
        -- Atualizar o valor padrão se necessário
        ALTER TABLE blog_posts ALTER COLUMN tags SET DEFAULT '{}';
        RAISE NOTICE 'Valor padrão da coluna tags atualizado para {}';
    ELSE
        RAISE NOTICE 'Valor padrão da coluna tags já está configurado corretamente';
    END IF;
END $$; 