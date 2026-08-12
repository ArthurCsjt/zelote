-- Migração para criar função RPC create_student
-- Data: 2024-12-04
-- Problema: Função create_student não existe, causando erro ao cadastrar alunos

-- 1. Criar função RPC para cadastrar aluno com validação de domínio
CREATE OR REPLACE FUNCTION public.create_student(
  p_nome_completo TEXT,
  p_ra TEXT,
  p_email TEXT,
  p_turma TEXT
)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  ra TEXT,
  email TEXT,
  turma TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validação: Email deve terminar com @sj.g12.br
  IF p_email NOT LIKE '%@sj.g12.br' THEN
    RAISE EXCEPTION 'Email de aluno deve terminar com @sj.g12.br';
  END IF;

  -- Validação: Nome completo não pode estar vazio
  IF p_nome_completo IS NULL OR TRIM(p_nome_completo) = '' THEN
    RAISE EXCEPTION 'Nome completo é obrigatório';
  END IF;

  -- Validação: RA não pode estar vazio
  IF p_ra IS NULL OR TRIM(p_ra) = '' THEN
    RAISE EXCEPTION 'RA é obrigatório';
  END IF;

  -- Validação: Email não pode estar vazio
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RAISE EXCEPTION 'Email é obrigatório';
  END IF;

  -- Validação: Turma não pode estar vazia
  IF p_turma IS NULL OR TRIM(p_turma) = '' THEN
    RAISE EXCEPTION 'Turma é obrigatória';
  END IF;

  -- Verificar se o RA já existe
  IF EXISTS (SELECT 1 FROM public.alunos WHERE public.alunos.ra = TRIM(p_ra)) THEN
    RAISE EXCEPTION 'RA ou E-mail informado já está em uso';
  END IF;

  -- Verificar se o email já existe
  IF EXISTS (SELECT 1 FROM public.alunos WHERE public.alunos.email = TRIM(LOWER(p_email))) THEN
    RAISE EXCEPTION 'RA ou E-mail informado já está em uso';
  END IF;

  -- Inserir aluno
  RETURN QUERY
  INSERT INTO public.alunos (nome_completo, ra, email, turma)
  VALUES (
    TRIM(p_nome_completo),
    TRIM(p_ra),
    TRIM(LOWER(p_email)),
    TRIM(p_turma)
  )
  RETURNING 
    public.alunos.id,
    public.alunos.nome_completo,
    public.alunos.ra,
    public.alunos.email,
    public.alunos.turma,
    public.alunos.created_at;
END;
$$;

-- 2. Comentário da função
COMMENT ON FUNCTION public.create_student(TEXT, TEXT, TEXT, TEXT) IS 
  'Cria um novo aluno com validação de domínio @sj.g12.br e verificação de RA/email duplicado';

-- 3. Garantir que a tabela alunos tem RLS habilitado
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para alunos (se não existirem)
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.alunos;
CREATE POLICY "Authenticated users can view students" 
  ON public.alunos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.alunos;
CREATE POLICY "Authenticated users can insert students" 
  ON public.alunos 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update students" ON public.alunos;
CREATE POLICY "Authenticated users can update students" 
  ON public.alunos 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can delete students" ON public.alunos;
CREATE POLICY "Admins can delete students" 
  ON public.alunos 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
