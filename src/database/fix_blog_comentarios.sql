-- Script para verificar e corrigir a tabela blog_comentarios

DO $$
BEGIN
    -- Verificar se a tabela blog_comentarios existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_comentarios'
    ) THEN
        -- Criar a tabela blog_comentarios
        CREATE TABLE blog_comentarios (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
            autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            conteudo TEXT NOT NULL,
            data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            aprovado BOOLEAN DEFAULT true,
            likes INTEGER DEFAULT 0
        );
        
        -- Criar índice para busca de comentários por post
        CREATE INDEX IF NOT EXISTS idx_blog_comentarios_post_id ON blog_comentarios(post_id);
        
        RAISE NOTICE 'Tabela blog_comentarios criada com sucesso.';
    ELSE
        RAISE NOTICE 'A tabela blog_comentarios já existe.';
        
        -- Verificar se a coluna likes existe
        IF NOT EXISTS (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'blog_comentarios' AND column_name = 'likes'
        ) THEN
            -- Adicionar a coluna likes
            ALTER TABLE blog_comentarios ADD COLUMN likes INTEGER DEFAULT 0;
            
            RAISE NOTICE 'Coluna likes adicionada à tabela blog_comentarios.';
        ELSE
            RAISE NOTICE 'A coluna likes já existe na tabela blog_comentarios.';
        END IF;
        
        -- Verificar se a coluna aprovado existe
        IF NOT EXISTS (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'blog_comentarios' AND column_name = 'aprovado'
        ) THEN
            -- Adicionar a coluna aprovado
            ALTER TABLE blog_comentarios ADD COLUMN aprovado BOOLEAN DEFAULT true;
            
            RAISE NOTICE 'Coluna aprovado adicionada à tabela blog_comentarios.';
        ELSE
            RAISE NOTICE 'A coluna aprovado já existe na tabela blog_comentarios.';
        END IF;
    END IF;
    
    -- Verificar políticas RLS para a tabela blog_comentarios
    -- Habilitar RLS se ainda não estiver habilitado
    ALTER TABLE blog_comentarios ENABLE ROW LEVEL SECURITY;
    
    -- Verificar e criar políticas para blog_comentarios
    -- Política para visualizar comentários aprovados
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'blog_comentarios' 
        AND policyname = 'Comentários aprovados visíveis para todos'
    ) THEN
        CREATE POLICY "Comentários aprovados visíveis para todos" 
            ON blog_comentarios FOR SELECT 
            USING (aprovado = true);
            
        RAISE NOTICE 'Política "Comentários aprovados visíveis para todos" criada.';
    END IF;
    
    -- Política para usuários autenticados criarem comentários
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'blog_comentarios' 
        AND policyname = 'Usuários autenticados podem inserir comentários'
    ) THEN
        CREATE POLICY "Usuários autenticados podem inserir comentários" 
            ON blog_comentarios FOR INSERT 
            WITH CHECK (auth.uid() IS NOT NULL);
            
        RAISE NOTICE 'Política "Usuários autenticados podem inserir comentários" criada.';
    END IF;
    
    -- Política para usuários verem seus próprios comentários não aprovados
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'blog_comentarios' 
        AND policyname = 'Usuários podem ver seus próprios comentários'
    ) THEN
        CREATE POLICY "Usuários podem ver seus próprios comentários" 
            ON blog_comentarios FOR SELECT 
            USING (autor_id = auth.uid());
            
        RAISE NOTICE 'Política "Usuários podem ver seus próprios comentários" criada.';
    END IF;
    
    -- Política para administradores verem todos os comentários
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'blog_comentarios' 
        AND policyname = 'Admins podem ver todos os comentários'
    ) THEN
        CREATE POLICY "Admins podem ver todos os comentários" 
            ON blog_comentarios FOR SELECT 
            USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
            
        RAISE NOTICE 'Política "Admins podem ver todos os comentários" criada.';
    END IF;
    
END$$; 