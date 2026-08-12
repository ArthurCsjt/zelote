-- SOLUÇÃO DEFINITIVA: Correção de Nomes e Acesso aos Perfis
-- Este script resolve:
-- 1. Falta das colunas first_name e last_name
-- 2. Erro de "Usuário Desconhecido" no Calendário
-- 3. Preenchimento de nomes vazios para usuários antigos

-- 1. Garantir que as colunas existem
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Liberar acesso aos nomes para o Calendário (RLS)
-- Permite que usuários autenticados vejam os nomes de outros usuários
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Garante que o próprio usuário possa ver/editar tudo do seu perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- 3. Atualizar função de criação automática de perfil (Trigger)
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
    -- Tenta extrair do meta_data do Supabase Auth
    _first_name := new.raw_user_meta_data ->> 'first_name';
    _last_name := new.raw_user_meta_data ->> 'last_name';
    
    -- Se não houver nome no registro, usa o início do email
    IF _first_name IS NULL OR _first_name = '' THEN
        _first_name := INITCAP(SPLIT_PART(new.email, '@', 1));
    END IF;

    -- Constrói o nome completo para exibição
    _full_name := CASE 
        WHEN _last_name IS NOT NULL AND _last_name <> '' THEN _first_name || ' ' || _last_name
        ELSE _first_name
    END;

    -- Garante que se der erro bizarro, usa o email
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

-- 4. Backfill: Corrigir todos os usuários existentes AGORA
-- Prioriza extrair o nome do email se o nome atual for genérico ou nulo
UPDATE public.profiles
SET 
    first_name = COALESCE(first_name, INITCAP(SPLIT_PART(email, '@', 1))),
    name = CASE 
        WHEN name IS NULL OR name = email OR name = '' OR name = 'Usuário Desconhecido' 
        THEN INITCAP(SPLIT_PART(email, '@', 1))
        ELSE name
    END
WHERE name IS NULL OR name = 'Usuário Desconhecido' OR name = '' OR first_name IS NULL;
