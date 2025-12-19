-- Migração para corrigir acesso aos perfis e criar função get_my_role()
-- Data: 2025-12-03
-- Problema: Usuários não conseguem ver seus próprios perfis devido a políticas RLS restritivas
--           e a função get_my_role() não existe
-- ATUALIZAÇÃO: Adicionar políticas RLS para inventory_audits e audit_items

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

-- 5. NOVO: Adicionar políticas RLS para inventory_audits
-- Permite que usuários vejam apenas suas próprias auditorias
DROP POLICY IF EXISTS "Users can view own audits" ON public.inventory_audits;
CREATE POLICY "Users can view own audits" 
  ON public.inventory_audits 
  FOR SELECT 
  USING (auth.uid() = created_by);

-- Permite que usuários criem suas próprias auditorias
DROP POLICY IF EXISTS "Users can create own audits" ON public.inventory_audits;
CREATE POLICY "Users can create own audits" 
  ON public.inventory_audits 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Permite que usuários atualizem suas próprias auditorias
DROP POLICY IF EXISTS "Users can update own audits" ON public.inventory_audits;
CREATE POLICY "Users can update own audits" 
  ON public.inventory_audits 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Permite que usuários deletem suas próprias auditorias
DROP POLICY IF EXISTS "Users can delete own audits" ON public.inventory_audits;
CREATE POLICY "Users can delete own audits" 
  ON public.inventory_audits 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- 6. NOVO: Adicionar políticas RLS para audit_items
-- Permite que usuários vejam itens de suas próprias auditorias
DROP POLICY IF EXISTS "Users can view own audit items" ON public.audit_items;
CREATE POLICY "Users can view own audit items" 
  ON public.audit_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_audits 
      WHERE id = audit_items.audit_id 
      AND created_by = auth.uid()
    )
  );

-- Permite que usuários criem itens em suas próprias auditorias
DROP POLICY IF EXISTS "Users can create own audit items" ON public.audit_items;
CREATE POLICY "Users can create own audit items" 
  ON public.audit_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventory_audits 
      WHERE id = audit_items.audit_id 
      AND created_by = auth.uid()
    )
  );

-- Permite que usuários atualizem itens de suas próprias auditorias
DROP POLICY IF EXISTS "Users can update own audit items" ON public.audit_items;
CREATE POLICY "Users can update own audit items" 
  ON public.audit_items 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_audits 
      WHERE id = audit_items.audit_id 
      AND created_by = auth.uid()
    )
  );

-- Permite que usuários deletem itens de suas próprias auditorias
DROP POLICY IF EXISTS "Users can delete own audit items" ON public.audit_items;
CREATE POLICY "Users can delete own audit items" 
  ON public.audit_items 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_audits 
      WHERE id = audit_items.audit_id 
      AND created_by = auth.uid()
    )
  );

-- 7. Garantir que as tabelas têm RLS habilitado
ALTER TABLE public.inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_items ENABLE ROW LEVEL SECURITY;

-- 8. Comentários para documentação
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
  'Permite que usuários autenticados vejam seu próprio perfil. Necessário para o funcionamento do hook useProfileRole.';

-- Removido comentário restrito sobre o trigger no auth.users

COMMENT ON POLICY "Users can view own audits" ON public.inventory_audits IS 
  'Permite que usuários vejam apenas suas próprias auditorias de inventário.';

COMMENT ON POLICY "Users can view own audit items" ON public.audit_items IS 
  'Permite que usuários vejam apenas itens de auditorias que eles criaram.';

