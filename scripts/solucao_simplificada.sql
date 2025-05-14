-- Script simplificado para resolver problemas de permissão
-- Este script desativa a segurança RLS e remove todas as políticas existentes

-- Desativar o RLS para a tabela (isso permite acesso completo)
ALTER TABLE cultivo_produtos_loja DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Usuários podem visualizar produtos ativos da loja" ON cultivo_produtos_loja;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os produtos da loja" ON cultivo_produtos_loja;
DROP POLICY IF EXISTS "Todos podem visualizar produtos ativos" ON cultivo_produtos_loja;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON cultivo_produtos_loja;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON cultivo_produtos_loja;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir produtos" ON cultivo_produtos_loja; 