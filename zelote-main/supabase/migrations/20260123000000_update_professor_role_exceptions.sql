-- Migration to add specific email exceptions for professor role
-- Date: 2026-01-23

-- Update handle_new_user to assign 'professor' role for specific emails
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
