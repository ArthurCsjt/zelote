-- Migration to fix profile access for the scheduling calendar
-- Date: 2025-12-22

-- 1. Relax RLS on profiles to allow all authenticated users to see basic info
-- This is required so users can see who made the reservations in the calendar.
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- 2. Ensure admins and super_admins can see all profiles without restrictions
-- (Though the SELECT policy above covers them, this is for completeness)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 3. Update the handle_new_user function one more time to ensure the 'name' is never empty
-- It should already be updated by the previous migration, but this ensures consistency.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    _first_name TEXT;
    _last_name TEXT;
    _full_name TEXT;
BEGIN
    -- Extract first and last name from raw_user_meta_data
    _first_name := new.raw_user_meta_data ->> 'first_name';
    _last_name := new.raw_user_meta_data ->> 'last_name';
    
    -- Fallback for first_name from email if not provided
    IF _first_name IS NULL OR _first_name = '' THEN
        _first_name := INITCAP(SPLIT_PART(new.email, '@', 1));
    END IF;

    -- Construct full name
    _full_name := CASE 
        WHEN _last_name IS NOT NULL AND _last_name <> '' THEN _first_name || ' ' || _last_name
        ELSE _first_name
    END;

    -- Ensure we don't have an empty name
    IF _full_name IS NULL OR _full_name = '' THEN
        _full_name := new.email;
    END IF;

    INSERT INTO public.profiles (id, email, name, first_name, last_name, role)
    VALUES (
        new.id,
        new.email,
        _full_name,
        _first_name,
        _last_name,
        CASE 
            WHEN new.email = 'arthur.alencar@colegiosaojudas.com.br' THEN 'admin'::public.user_role
            WHEN new.email LIKE '%@sj.pro.br' OR new.email LIKE '%@colegiosaojudas.com.br' THEN 'professor'::public.user_role
            ELSE 'user'::public.user_role
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email;
        
    RETURN new;
END;
$$;

-- 4. Backfill: If any profile still has 'Usuário Desconhecido' or is null, fix it
UPDATE public.profiles
SET 
    name = INITCAP(SPLIT_PART(email, '@', 1)),
    first_name = INITCAP(SPLIT_PART(email, '@', 1))
WHERE name IS NULL OR name = 'Usuário Desconhecido' OR name = '';
