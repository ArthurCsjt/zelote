-- Script para verificar o perfil do usuário jose.silva
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe na tabela auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'jose.silva@colegiosaojudas.com.br';

-- 2. Verificar se existe perfil na tabela profiles
SELECT id, email, name, role, created_at
FROM profiles
WHERE email = 'jose.silva@colegiosaojudas.com.br';

-- 3. Listar todos os perfis existentes
SELECT id, email, name, role, created_at
FROM profiles
ORDER BY created_at DESC;

-- 4. Verificar se a função get_my_role existe
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_my_role';
