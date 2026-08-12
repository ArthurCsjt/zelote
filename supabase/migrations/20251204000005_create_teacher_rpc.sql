-- Migração para criar função RPC create_teacher
-- Data: 2024-12-04
-- Problema: Função create_teacher não existe, causando erro ao cadastrar professores

-- 1. Criar função RPC para cadastrar professor com validação de domínio
CREATE OR REPLACE FUNCTION public.create_teacher(
  p_nome_completo TEXT,
  p_email TEXT,
  p_materia TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  email TEXT,
  materia TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validação: Email deve terminar com @sj.pro.br
  IF p_email NOT LIKE '%@sj.pro.br' THEN
    RAISE EXCEPTION 'Email de professor deve terminar com @sj.pro.br';
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
  IF EXISTS (SELECT 1 FROM public.professores WHERE public.professores.email = TRIM(LOWER(p_email))) THEN
    RAISE EXCEPTION 'O e-mail informado já está em uso';
  END IF;

  -- Inserir professor
  RETURN QUERY
  INSERT INTO public.professores (nome_completo, email)
  VALUES (
    TRIM(p_nome_completo),
    TRIM(LOWER(p_email))
  )
  RETURNING 
    public.professores.id,
    public.professores.nome_completo,
    public.professores.email,
    NULL::TEXT as materia,
    public.professores.created_at;
END;
$$;

-- 2. Comentário da função
COMMENT ON FUNCTION public.create_teacher(TEXT, TEXT, TEXT) IS 
  'Cria um novo professor com validação de domínio @sj.pro.br e verificação de email duplicado';

-- 3. Garantir que a tabela professores tem RLS habilitado
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para professores (se não existirem)
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.professores;
CREATE POLICY "Authenticated users can view teachers" 
  ON public.professores 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert teachers" ON public.professores;
CREATE POLICY "Authenticated users can insert teachers" 
  ON public.professores 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update teachers" ON public.professores;
CREATE POLICY "Authenticated users can update teachers" 
  ON public.professores 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can delete teachers" ON public.professores;
CREATE POLICY "Admins can delete teachers" 
  ON public.professores 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
