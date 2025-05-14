-- Script para verificar o status do usuário humbertoboxe2022@gmail.com
-- Execute este script no SQL Editor do Supabase para diagnóstico

-- 1. Verificar se o usuário existe
SELECT 
  id, 
  email, 
  confirmed_at, 
  last_sign_in_at 
FROM auth.users 
WHERE email = 'humbertoboxe2022@gmail.com';

-- 2. Verificar o perfil do usuário na tabela profiles
SELECT * FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com'
);

-- 3. Verificar a estrutura da tabela e a constraint de role
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM
  pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE
  rel.relname = 'profiles'
  AND con.conname LIKE '%role%';

-- 4. Verificar a definição da coluna role
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'profiles' 
  AND column_name = 'role';

-- 5. Verificar o usuário autenticado atualmente
SELECT 
  auth.uid() as current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email,
  (SELECT role FROM profiles WHERE id = auth.uid()) as current_role; 