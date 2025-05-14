-- Criar função RPC para acessar usuários do esquema auth
-- Esta função deve ser executada pelo administrador do banco de dados

-- Verifique se já existe antes de criar
DROP FUNCTION IF EXISTS public.get_auth_users();

-- Função para obter usuários de auth.users
CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  raw_user_meta_data jsonb
) 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Esta função tem SECURITY DEFINER, então ela executa com os privilégios do criador
  -- que deve ter acesso ao esquema auth
  RETURN QUERY 
  SELECT 
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data
  FROM auth.users au
  WHERE au.deleted_at IS NULL
  ORDER BY au.created_at DESC
  LIMIT 100; -- Limitar para evitar sobrecarga
END;
$$;

-- Conceder acesso à função para todos os usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_auth_users() TO authenticated;

-- Adicionar comentário à função
COMMENT ON FUNCTION public.get_auth_users() IS 'Retorna usuários do esquema auth de forma segura'; 