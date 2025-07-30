-- Script para configurar o bucket blog-conteudo com todas as políticas necessárias
-- Execute este script no SQL Editor do Supabase Dashboard

-- =====================================================
-- CONFIGURAÇÃO DO BUCKET BLOG-CONTEUDO
-- =====================================================

-- Primeiro, vamos verificar se o bucket existe
SELECT 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE name = 'blog-conteudo';

-- =====================================================
-- REMOVER POLÍTICAS EXISTENTES (se houver)
-- =====================================================

DROP POLICY IF EXISTS "Public read access for blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own blog content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own blog content images" ON storage.objects;

-- =====================================================
-- CRIAR POLÍTICAS DE ACESSO
-- =====================================================

-- 1. POLÍTICA PARA LEITURA PÚBLICA (qualquer pessoa pode ver as imagens)
CREATE POLICY "Public read access for blog content images" ON storage.objects
FOR SELECT USING (
    bucket_id = 'blog-conteudo' 
    AND auth.role() = 'anon'
);

-- 2. POLÍTICA PARA UPLOAD (apenas usuários autenticados podem fazer upload)
CREATE POLICY "Authenticated users can upload blog content images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'blog-conteudo' 
    AND auth.role() = 'authenticated'
);

-- 3. POLÍTICA PARA ATUALIZAÇÃO (apenas o proprietário pode atualizar)
CREATE POLICY "Users can update their own blog content images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'blog-conteudo' 
    AND auth.uid() = owner
);

-- 4. POLÍTICA PARA EXCLUSÃO (apenas o proprietário pode deletar)
CREATE POLICY "Users can delete their own blog content images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'blog-conteudo' 
    AND auth.uid() = owner
);

-- =====================================================
-- VERIFICAR CONFIGURAÇÃO
-- =====================================================

-- Verificar se o bucket está configurado corretamente
SELECT 
    'BUCKET INFO' as info_type,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'blog-conteudo'

UNION ALL

-- Verificar se as políticas foram criadas
SELECT 
    'POLICY INFO' as info_type,
    policyname as name,
    cmd as public,
    roles as file_size_limit,
    qual as allowed_mime_types
FROM pg_policies 
WHERE tablename = 'objects' 
    AND policyname LIKE '%blog content%'
ORDER BY info_type, name;

-- =====================================================
-- TESTE DE CONFIGURAÇÃO
-- =====================================================

-- Verificar se podemos listar objetos no bucket (teste de leitura)
SELECT 
    'TESTE DE LEITURA' as teste,
    COUNT(*) as total_objetos
FROM storage.objects 
WHERE bucket_id = 'blog-conteudo';

-- =====================================================
-- RESUMO DA CONFIGURAÇÃO
-- =====================================================

SELECT 
    'CONFIGURAÇÃO CONCLUÍDA' as status,
    'Bucket blog-conteudo configurado com sucesso!' as mensagem,
    'Agora você pode fazer upload de imagens no conteúdo do blog' as instrucao; 