-- Migração para criar função RPC create_staff
-- Data: 2024-12-04
-- Problema: Função create_staff não existe, causando erro ao cadastrar funcionários

-- 1. Criar função RPC para cadastrar funcionário com validação de domínio
CREATE OR REPLACE FUNCTION public.create_staff(
  p_nome_completo TEXT,
  p_email TEXT
)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validação: Email deve terminar com @colegiosaojudas.com.br
  IF p_email NOT LIKE '%@colegiosaojudas.com.br' THEN
    RAISE EXCEPTION 'Email de funcionário deve terminar com @colegiosaojudas.com.br';
  END IF;

  -- Validação: Nome completo não pode estar vazio
  IF p_nome_completo IS NULL OR TRIM(p_nome_completo) = '' THEN
    RAISE EXCEPTION 'Nome completo é obrigatório';
  END IF;

  -- Validação: Email não pode estar vazio
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RAISE EXCEPTION 'Email é obrigatório';
  END IF;

  -- Verificar se o email já existe
  IF EXISTS (SELECT 1 FROM public.funcionarios WHERE public.funcionarios.email = TRIM(LOWER(p_email))) THEN
    RAISE EXCEPTION 'O e-mail informado já está em uso';
  END IF;

  -- Inserir funcionário
  RETURN QUERY
  INSERT INTO public.funcionarios (nome_completo, email)
  VALUES (
    TRIM(p_nome_completo),
    TRIM(LOWER(p_email))
  )
  RETURNING 
    public.funcionarios.id,
    public.funcionarios.nome_completo,
    public.funcionarios.email,
    public.funcionarios.created_at;
END;
$$;

-- 2. Comentário da função
COMMENT ON FUNCTION public.create_staff(TEXT, TEXT) IS 
  'Cria um novo funcionário com validação de domínio @colegiosaojudas.com.br e verificação de email duplicado';

-- 3. Garantir que a tabela funcionarios tem RLS habilitado
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para funcionarios (se não existirem)
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.funcionarios;
CREATE POLICY "Authenticated users can view staff" 
  ON public.funcionarios 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert staff" ON public.funcionarios;
CREATE POLICY "Authenticated users can insert staff" 
  ON public.funcionarios 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update staff" ON public.funcionarios;
CREATE POLICY "Authenticated users can update staff" 
  ON public.funcionarios 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can delete staff" ON public.funcionarios;
CREATE POLICY "Admins can delete staff" 
  ON public.funcionarios 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
