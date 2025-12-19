-- Migração CORRIGIDA para criar função RPC de exclusão de usuário
-- Data: 2025-12-12
-- Objetivo: Permitir que admins excluam usuários via RPC (VERSÃO CORRIGIDA)

-- Garantir que a coluna deleted_at existe na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Criar índice para deleted_at se não existir
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at 
  ON public.profiles(deleted_at) 
  WHERE deleted_at IS NULL;

-- Função para excluir usuário (VERSÃO CORRIGIDA - sem SET search_path)
CREATE OR REPLACE FUNCTION public.delete_user_profile(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_role TEXT;
  v_current_user_id UUID;
BEGIN
  -- Pegar o ID do usuário atual
  v_current_user_id := auth.uid();
  
  -- Verificar se há um usuário autenticado
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar a role do usuário atual
  SELECT role INTO v_current_user_role
  FROM public.profiles 
  WHERE id = v_current_user_id;

  -- Verificar se o usuário logado é admin ou super_admin
  IF v_current_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Verificar se o usuário está tentando excluir a si mesmo
  IF p_user_id = v_current_user_id THEN
    RAISE EXCEPTION 'Você não pode excluir sua própria conta';
  END IF;

  -- Soft delete: marcar o perfil como deletado
  UPDATE public.profiles 
  SET deleted_at = NOW()
  WHERE id = p_user_id
  AND deleted_at IS NULL;

  -- Verificar se o usuário foi encontrado e deletado
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado ou já foi excluído';
  END IF;

  RETURN TRUE;
END;
$$;

-- Atualizar a RPC get_all_users para não retornar usuários deletados (VERSÃO CORRIGIDA)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_role TEXT;
  v_current_user_id UUID;
BEGIN
  -- Pegar o ID do usuário atual
  v_current_user_id := auth.uid();
  
  -- Verificar se há um usuário autenticado
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar a role do usuário atual
  SELECT profiles.role INTO v_current_user_role
  FROM public.profiles 
  WHERE profiles.id = v_current_user_id;

  -- Verificar se o usuário é admin ou super_admin
  IF v_current_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins or super_admins can access this function';
  END IF;

  -- Retornar todos os usuários não deletados
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(au.email, '') AS email,
    p.name,
    p.role,
    au.last_sign_in_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.deleted_at IS NULL
  ORDER BY au.last_sign_in_at DESC NULLS LAST;
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.delete_user_profile(UUID) IS 
  'Marca um usuário como deletado (soft delete). Apenas administradores podem executar.';

COMMENT ON FUNCTION public.get_all_users() IS 
  'Retorna todos os usuários não deletados. Apenas administradores podem executar.';
