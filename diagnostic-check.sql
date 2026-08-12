-- Script de diagnóstico para verificar o estado atual do banco de dados
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a função get_my_role existe
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'get_my_role';

-- 2. Verificar políticas RLS da tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2b. Verificar políticas RLS da tabela chromebooks
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'chromebooks'
ORDER BY policyname;

-- 3. Verificar se o trigger existe
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgtype
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 4. Verificar perfil do jose.silva
SELECT 
  id,
  email,
  name,
  role,
  created_at,
  updated_at
FROM profiles
WHERE email = 'jose.silva@colegiosaojudas.com.br';

-- 5. Verificar usuário no auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'jose.silva@colegiosaojudas.com.br';

-- 6. Contar total de perfis
SELECT COUNT(*) as total_profiles FROM profiles;

-- 7. Listar todos os perfis (para debug)
SELECT id, email, name, role, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
