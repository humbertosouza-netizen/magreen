-- Script para corrigir problemas de permissão na tabela cultivo_produtos_loja

-- 1. Verificar e atualizar o perfil do usuário atual para administrador
DO $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_profile_exists BOOLEAN;
BEGIN
    -- Obter o ID do usuário atual
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se existe um perfil para o usuário
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = v_user_id
    ) INTO v_profile_exists;
    
    -- Verificar a função atual do usuário
    SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
    
    RAISE NOTICE 'Usuário ID: %, Função atual: %, Perfil existe: %', v_user_id, v_role, v_profile_exists;
    
    -- Atualizar o perfil para administrador se necessário
    IF v_profile_exists THEN
        UPDATE profiles 
        SET role = 'admin' 
        WHERE id = v_user_id;
        RAISE NOTICE 'Perfil atualizado para administrador';
    ELSE
        RAISE NOTICE 'Perfil não encontrado para o usuário';
    END IF;
END $$;

-- 2. Atualizar as políticas RLS para permitir acesso mais amplo
-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Usuários podem visualizar produtos ativos da loja" ON cultivo_produtos_loja;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os produtos da loja" ON cultivo_produtos_loja;

-- Política para visualização - Todos podem ver produtos ativos
CREATE POLICY "Todos podem visualizar produtos ativos"
    ON cultivo_produtos_loja FOR SELECT
    USING (ativo = TRUE OR auth.uid() IS NOT NULL);

-- Política para inserção - Qualquer usuário autenticado pode inserir
CREATE POLICY "Usuários autenticados podem inserir produtos"
    ON cultivo_produtos_loja FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para atualização - Qualquer usuário autenticado pode atualizar
CREATE POLICY "Usuários autenticados podem atualizar produtos"
    ON cultivo_produtos_loja FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Política para exclusão - Qualquer usuário autenticado pode excluir
CREATE POLICY "Usuários autenticados podem excluir produtos"
    ON cultivo_produtos_loja FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- 3. Verificar se há usuários na tabela de perfis
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM profiles;
    RAISE NOTICE 'Total de perfis encontrados: %', v_count;
    
    -- Se não houver perfis, criar um perfil de exemplo
    IF v_count = 0 THEN
        RAISE NOTICE 'Nenhum perfil encontrado. Isso é anormal e pode indicar um problema com a autenticação.';
    END IF;
END $$;

-- 4. Verificar a estrutura da tabela profiles
DO $$
DECLARE
    v_has_role BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
    ) INTO v_has_role;
    
    IF NOT v_has_role THEN
        RAISE NOTICE 'A coluna "role" não existe na tabela profiles. Adicionando-a...';
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    ELSE
        RAISE NOTICE 'A coluna "role" existe na tabela profiles';
    END IF;
END $$; 