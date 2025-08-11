-- Remover super_admin e adicionar campo de sala nos chromebooks
-- Primeiro, atualizar o enum de roles para remover super_admin
ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Atualizar a coluna na tabela profiles
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING 
  CASE 
    WHEN role::text = 'super_admin' THEN 'admin'::user_role
    WHEN role::text = 'admin' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END;

-- Remover o tipo antigo
DROP TYPE user_role_old;

-- Adicionar campo de sala nos chromebooks
ALTER TABLE chromebooks ADD COLUMN classroom text;

-- Atualizar o enum de status para incluir 'fixo'
ALTER TYPE chromebook_status RENAME TO chromebook_status_old;

CREATE TYPE chromebook_status AS ENUM ('disponivel', 'emprestado', 'fixo');

-- Atualizar a coluna status
ALTER TABLE chromebooks ALTER COLUMN status TYPE chromebook_status USING 
  CASE 
    WHEN status::text = 'manutencao' THEN 'fixo'::chromebook_status
    WHEN status::text = 'disponivel' THEN 'disponivel'::chromebook_status
    WHEN status::text = 'emprestado' THEN 'emprestado'::chromebook_status
    ELSE 'disponivel'::chromebook_status
  END;

-- Remover o tipo antigo
DROP TYPE chromebook_status_old;

-- Atualizar as funções que usavam super_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = 'admin'
  )
$$;

-- Atualizar a função handle_new_user
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
      WHEN new.email = 'arthur.alencar@colegiosaojudas.com.br' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN new;
END;
$$;

-- Atualizar políticas RLS
DROP POLICY IF EXISTS "Super admins can delete chromebooks" ON chromebooks;
DROP POLICY IF EXISTS "Super admins can delete loans" ON loans;
DROP POLICY IF EXISTS "Super admins can delete returns" ON returns;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Criar novas políticas para admin
CREATE POLICY "Admins can delete chromebooks" ON chromebooks FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete loans" ON loans FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete returns" ON returns FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (is_admin(auth.uid()) AND role <> 'admin'::user_role);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin(auth.uid()));