-- Migration to add first_name and last_name to profiles
-- Date: 2025-12-22

-- 1. Add first_name and last_name columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Update handle_new_user function to use first_name and last_name
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
    );
    RETURN new;
END;
$$;

-- 3. Backfill existing users
UPDATE public.profiles
SET 
    first_name = INITCAP(SPLIT_PART(email, '@', 1)),
    name = CASE 
        WHEN name IS NULL OR name = email OR name = '' THEN INITCAP(SPLIT_PART(email, '@', 1))
        ELSE name
    END
WHERE first_name IS NULL;
