-- Script para criar o bucket de armazenamento para imagens do conteúdo do blog
-- Execute este script no SQL Editor do Supabase Dashboard

-- Nota: Buckets são criados via API, não via SQL direto
-- Este script apenas configura as políticas após o bucket ser criado

-- Primeiro, vamos verificar se o bucket existe
SELECT name, public FROM storage.buckets WHERE name = 'blog-conteudo';

-- Se o bucket não existir, você precisará criá-lo via Dashboard ou API
-- Vá para Storage > New Bucket e crie um bucket chamado 'blog-conteudo'

-- Depois de criar o bucket, execute as políticas abaixo:

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Public read access for blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own blog content images" ON storage.objects;

-- Política para SELECT (leitura pública)
CREATE POLICY "Public read access for blog content images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'blog-conteudo' 
  AND auth.role() = 'anon'
);

-- Política para INSERT (upload) - apenas usuários autenticados
CREATE POLICY "Authenticated users can upload blog content images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'blog-conteudo' 
  AND auth.role() = 'authenticated'
);

-- Política para UPDATE (atualização) - apenas o usuário que fez o upload
CREATE POLICY "Users can update their own blog content images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'blog-conteudo' 
  AND auth.uid() = owner
);

-- Política para DELETE (exclusão) - apenas o usuário que fez o upload
CREATE POLICY "Users can delete their own blog content images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'blog-conteudo' 
  AND auth.uid() = owner
);

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%blog content%';

-- Verificar se o bucket existe e está público
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'blog-conteudo'; 