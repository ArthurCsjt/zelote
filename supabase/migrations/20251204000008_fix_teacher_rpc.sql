-- Migração para corrigir função create_teacher e adicionar coluna materia
-- Data: 2024-12-04
-- Problema: Função create_teacher aceita parâmetro p_materia mas não o salva no banco

-- 1. Adicionar coluna materia na tabela professores (se não existir)
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS materia TEXT;

-- 2. Criar índice para materia (facilita buscas por disciplina)
CREATE INDEX IF NOT EXISTS idx_professores_materia ON public.professores(materia);

-- 3. Recriar função create_teacher com correção
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

  -- Inserir professor COM o campo materia
  RETURN QUERY
  INSERT INTO public.professores (nome_completo, email, materia)
  VALUES (
    TRIM(p_nome_completo),
    TRIM(LOWER(p_email)),
    CASE WHEN p_materia IS NOT NULL AND TRIM(p_materia) != '' 
         THEN TRIM(p_materia) 
         ELSE NULL 
    END
  )
  RETURNING 
    public.professores.id,
    public.professores.nome_completo,
    public.professores.email,
    public.professores.materia,  -- ✅ CORRIGIDO: Retorna o valor real
    public.professores.created_at;
END;
$$;

-- 4. Atualizar comentário da função
COMMENT ON FUNCTION public.create_teacher(TEXT, TEXT, TEXT) IS 
  'Cria um novo professor com validação de domínio @sj.pro.br, verificação de email duplicado e salva a matéria lecionada';

-- 5. Comentário na coluna
COMMENT ON COLUMN public.professores.materia IS 
  'Matéria ou disciplina lecionada pelo professor';
