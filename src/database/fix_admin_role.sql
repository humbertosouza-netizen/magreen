-- Script simples e direto para promover humbertoboxe2022@gmail.com a ADMIN
-- Execute apenas esta consulta no SQL Editor do Supabase

-- Atualização direta para ADMIN
UPDATE profiles
SET role = 'ADMIN', updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'humbertoboxe2022@gmail.com'
);

-- Verificar status após atualização
SELECT 
  u.email,
  p.role,
  p.updated_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'humbertoboxe2022@gmail.com'; 