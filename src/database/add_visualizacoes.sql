-- Script para adicionar a coluna visualizacoes na tabela blog_posts

-- Verificar se a coluna visualizacoes já existe na tabela blog_posts
DO $$
BEGIN
    -- Verificar se a coluna visualizacoes existe
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'visualizacoes'
    ) THEN
        -- Adicionar a coluna visualizacoes
        ALTER TABLE blog_posts ADD COLUMN visualizacoes INTEGER DEFAULT 0;
        
        -- Criar um índice para a coluna visualizacoes para melhorar performance
        CREATE INDEX IF NOT EXISTS idx_blog_posts_visualizacoes ON blog_posts(visualizacoes);
        
        RAISE NOTICE 'Coluna visualizacoes adicionada com sucesso à tabela blog_posts';
    ELSE
        RAISE NOTICE 'A coluna visualizacoes já existe na tabela blog_posts';
    END IF;
END$$; 