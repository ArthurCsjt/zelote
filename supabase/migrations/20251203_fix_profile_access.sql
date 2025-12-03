-- Migração para corrigir acesso aos perfis e criar função get_my_role()
-- Data: 2025-12-03
-- Problema: Usuários não conseguem ver seus próprios perfis devido a políticas RLS restritivas
--           e a função get_my_role() não existe

-- 1. Criar função get_my_role() para retornar o role do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role::text
  FROM public.profiles
  WHERE id = auth.uid()
$$;

-- Comentário da função
COMMENT ON FUNCTION public.get_my_role() IS 'Retorna o role do usuário autenticado. Usado pelo frontend para controle de acesso.';

-- 2. Adicionar política RLS para permitir que usuários vejam seu próprio perfil
-- Primeiro, verificar se a política já existe e removê-la se necessário
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Criar a política
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- 3. Verificar e recriar o trigger de criação automática de perfil se necessário
-- Primeiro, garantir que a função handle_new_user existe
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

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Garantir que a tabela profiles tem RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Comentários para documentação
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
  'Permite que usuários autenticados vejam seu próprio perfil. Necessário para o funcionamento do hook useProfileRole.';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Cria automaticamente um perfil na tabela profiles quando um novo usuário é criado no auth.users.';
