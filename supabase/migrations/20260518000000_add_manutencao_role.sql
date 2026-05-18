-- Migration to add manutencao role and auto-assignment for specific emails
-- Date: 2026-05-18

-- 1. Ensure 'manutencao' exists in user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manutencao';

-- 2. Update handle_new_user to assign 'manutencao' role for specific emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'name', new.email),
    CASE 
      -- Admin override
      WHEN new.email = 'arthur.alencar@colegiosaojudas.com.br' THEN 'admin'::public.user_role
      
      -- Specific Maintenance Exceptions
      WHEN new.email IN (
        'paulo.geremias@colegiosaojudas.com.br',
        'ivo@colegiosaojudas.com.br',
        'manutencao.teste@colegiosaojudas.com.br'
      ) THEN 'manutencao'::public.user_role
      
      -- Specific Teacher Exceptions (colegiosaojudas.com.br domain)
      WHEN new.email IN (
        'roberta.celestino@colegiosaojudas.com.br',
        'jade.silva@colegiosaojudas.com.br',
        'nathaly.rosa@colegiosaojudas.com.br',
        'andreza.carbonato@colegiosaojudas.com.br',
        'luciana.oreb@colegiosaojudas.com.br',
        'prof.sineide@colegiosaojudas.com.br',
        'prof.monica@colegiosaojudas.com.br'
      ) THEN 'professor'::public.user_role
      
      -- Standard Teacher Domain
      WHEN new.email LIKE '%@sj.pro.br' THEN 'professor'::public.user_role
      
      -- Default
      ELSE 'user'::public.user_role
    END
  );
  RETURN new;
END;
$$;

-- 3. Update existing profiles with target emails if any exist
UPDATE public.profiles
SET role = 'manutencao'::public.user_role
WHERE email IN ('paulo.geremias@colegiosaojudas.com.br', 'ivo@colegiosaojudas.com.br', 'manutencao.teste@colegiosaojudas.com.br');
