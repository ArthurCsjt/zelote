-- Migration to allow @sj.pro.br domain and assign professor role
-- Date: 2025-12-19

-- 1. Ensure 'professor' exists in user_role enum
-- Note: ALTER TYPE ... ADD VALUE cannot be executed in a transaction block in some PG versions.
-- However, Supabase migrations usually handle this if they are not wrapped in a single transaction or if using specialized syntax.
-- To be safe, we use this syntax which is common in Supabase migrations.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'professor';

-- 2. Update handle_new_user to assign 'professor' role for @sj.pro.br domain
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
      WHEN new.email = 'arthur.alencar@colegiosaojudas.com.br' THEN 'admin'::public.user_role
      WHEN new.email LIKE '%@sj.pro.br' THEN 'professor'::public.user_role
      ELSE 'user'::public.user_role
    END
  );
  RETURN new;
END;
$$;

-- 3. Update existing profiles with @sj.pro.br to professor role
UPDATE public.profiles
SET role = 'professor'::public.user_role
WHERE email LIKE '%@sj.pro.br' AND role <> 'admin'::public.user_role;
