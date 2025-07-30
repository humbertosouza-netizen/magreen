-- Script simplificado para configurar apenas as políticas do bucket blog-conteudo
-- Execute este script no SQL Editor do Supabase Dashboard

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Public read access for blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own blog content images" ON storage.objects;

-- Criar políticas essenciais

-- 1. Leitura pública (qualquer pessoa pode ver as imagens)
CREATE POLICY "Public read access for blog content images" ON storage.objects
FOR SELECT USING (bucket_id = 'blog-conteudo' AND auth.role() = 'anon');

-- 2. Upload para usuários autenticados
CREATE POLICY "Authenticated users can upload blog content images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'blog-conteudo' AND auth.role() = 'authenticated');

-- 3. Atualização para proprietário
CREATE POLICY "Users can update their own blog content images" ON storage.objects
FOR UPDATE USING (bucket_id = 'blog-conteudo' AND auth.uid() = owner);

-- 4. Exclusão para proprietário
CREATE POLICY "Users can delete their own blog content images" ON storage.objects
FOR DELETE USING (bucket_id = 'blog-conteudo' AND auth.uid() = owner);

-- Verificar se as políticas foram criadas
SELECT policyname, cmd, roles FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%blog content%'; 