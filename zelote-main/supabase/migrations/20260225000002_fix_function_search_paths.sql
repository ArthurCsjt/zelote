-- Fix mutable search_path on database functions.
-- Prevents schema injection attacks by fixing the search path to empty string.

-- 1. sync_chromebook_status
CREATE OR REPLACE FUNCTION public.sync_chromebook_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chromebooks SET status = 'emprestado'::public.chromebook_status
    WHERE id = NEW.chromebook_id AND public.chromebooks.deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. normalize_email_professores
CREATE OR REPLACE FUNCTION public.normalize_email_professores()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

-- 3. get_all_users (RPC)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz, role text)
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT au.id, au.email, au.created_at, p.role::text
  FROM auth.users au LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.deleted_at IS NULL ORDER BY au.created_at DESC;
$$;

-- 4. reservation_tsrange
CREATE OR REPLACE FUNCTION public.reservation_tsrange(r_date date, r_time text)
RETURNS tsrange LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
BEGIN
  RETURN tsrange(
    (r_date + r_time::time)::timestamp,
    (r_date + r_time::time + '50 minutes'::interval)::timestamp,
    '[]'
  );
END;
$$;
