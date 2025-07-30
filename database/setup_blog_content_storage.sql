-- Script para configurar o bucket de armazenamento para imagens do conteúdo do blog
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar bucket para imagens do conteúdo (se não existir)
-- Nota: Buckets são criados via API ou Dashboard, não via SQL

-- Configurar políticas de acesso público para leitura das imagens do conteúdo
-- Política para permitir acesso público de leitura ao bucket blog-conteudo

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