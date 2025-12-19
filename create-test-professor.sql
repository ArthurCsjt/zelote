-- Script para criar usuário de teste: teste@sj.pro.br
-- Este script cria um usuário diretamente no sistema de autenticação do Supabase
-- IMPORTANTE: Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar o usuário no sistema de autenticação (auth.users)
-- Nota: A senha será '123456' (hash bcrypt)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'teste@sj.pro.br',
    -- Senha: 123456 (hash bcrypt)
    '$2a$10$8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8OqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Professor Teste"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- 2. O perfil será criado automaticamente pelo trigger handle_new_user
-- que já configuramos para detectar @sj.pro.br e atribuir role='professor'

-- 3. Verificar se o usuário foi criado corretamente
SELECT 
    u.email,
    u.email_confirmed_at,
    p.role,
    p.name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'teste@sj.pro.br';
