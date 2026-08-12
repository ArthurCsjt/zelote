-- Migration: Create email_rules table and update handle_new_user trigger
-- Date: 2026-06-17

-- 1. Create the email_rules table
CREATE TABLE IF NOT EXISTS public.email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role public.user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.email_rules ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for email_rules
-- Allow authenticated admins/super_admins to do all operations
DROP POLICY IF EXISTS "Admins can manage email_rules" ON public.email_rules;
CREATE POLICY "Admins can manage email_rules" 
  ON public.email_rules 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 4. Create trigger to sync profiles.role when email_rules change
CREATE OR REPLACE FUNCTION public.sync_profile_role_on_rule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.profiles
  SET role = NEW.role
  WHERE email = NEW.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_email_rule_upsert ON public.email_rules;
CREATE TRIGGER on_email_rule_upsert
  AFTER INSERT OR UPDATE ON public.email_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_on_rule_change();

-- 5. Update handle_new_user() function to check email_rules dynamically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  -- Check if email exists in email_rules
  SELECT role INTO v_role 
  FROM public.email_rules 
  WHERE email = NEW.email;
  
  -- Fallback to default logic if no specific rule exists
  IF v_role IS NULL THEN
    v_role := CASE 
      -- Admin override
      WHEN NEW.email = 'arthur.alencar@colegiosaojudas.com.br' THEN 'admin'::public.user_role
      
      -- Standard Teacher Domain
      WHEN NEW.email LIKE '%@sj.pro.br' THEN 'professor'::public.user_role
      
      -- Default
      ELSE 'user'::public.user_role
    END;
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    v_role
  );
  RETURN NEW;
END;
$$;

-- 6. Seed legacy hardcoded exceptions into email_rules
INSERT INTO public.email_rules (email, role)
VALUES 
  ('paulo.geremias@colegiosaojudas.com.br', 'manutencao'),
  ('ivo@colegiosaojudas.com.br', 'manutencao'),
  ('manutencao.teste@colegiosaojudas.com.br', 'manutencao'),
  ('roberta.celestino@colegiosaojudas.com.br', 'professor'),
  ('jade.silva@colegiosaojudas.com.br', 'professor'),
  ('nathaly.rosa@colegiosaojudas.com.br', 'professor'),
  ('andreza.carbonato@colegiosaojudas.com.br', 'professor'),
  ('luciana.oreb@colegiosaojudas.com.br', 'professor'),
  ('prof.sineide@colegiosaojudas.com.br', 'professor'),
  ('prof.monica@colegiosaojudas.com.br', 'professor')
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role;
