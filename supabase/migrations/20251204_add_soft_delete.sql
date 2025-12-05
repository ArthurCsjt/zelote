-- Migração para implementar soft delete
-- Data: 2024-12-04
-- Objetivo: Permitir recuperação de registros deletados e auditoria

-- ========================================
-- ADICIONAR COLUNAS deleted_at
-- ========================================

ALTER TABLE public.chromebooks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ========================================
-- CRIAR ÍNDICES PARA deleted_at
-- ========================================

CREATE INDEX IF NOT EXISTS idx_chromebooks_deleted_at 
  ON public.chromebooks(deleted_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_alunos_deleted_at 
  ON public.alunos(deleted_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_professores_deleted_at 
  ON public.professores(deleted_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_funcionarios_deleted_at 
  ON public.funcionarios(deleted_at) 
  WHERE deleted_at IS NULL;

-- ========================================
-- ATUALIZAR POLÍTICAS RLS PARA OCULTAR DELETADOS
-- ========================================

-- CHROMEBOOKS: Ocultar deletados por padrão
DROP POLICY IF EXISTS "Authenticated users can view chromebooks" ON public.chromebooks;
CREATE POLICY "Authenticated users can view chromebooks" 
  ON public.chromebooks 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

-- Política adicional para admins verem deletados
CREATE POLICY "Admins can view deleted chromebooks" 
  ON public.chromebooks 
  FOR SELECT 
  USING (
    deleted_at IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ALUNOS: Ocultar deletados
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.alunos;
CREATE POLICY "Authenticated users can view students" 
  ON public.alunos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Admins can view deleted students" 
  ON public.alunos 
  FOR SELECT 
  USING (
    deleted_at IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- PROFESSORES: Ocultar deletados
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.professores;
CREATE POLICY "Authenticated users can view teachers" 
  ON public.professores 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Admins can view deleted teachers" 
  ON public.professores 
  FOR SELECT 
  USING (
    deleted_at IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- FUNCIONARIOS: Ocultar deletados
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.funcionarios;
CREATE POLICY "Authenticated users can view staff" 
  ON public.funcionarios 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Admins can view deleted staff" 
  ON public.funcionarios 
  FOR SELECT 
  USING (
    deleted_at IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ========================================
-- CRIAR VIEWS PARA REGISTROS ATIVOS
-- ========================================

-- View para chromebooks ativos (facilita queries)
CREATE OR REPLACE VIEW public.active_chromebooks AS
SELECT * FROM public.chromebooks
WHERE deleted_at IS NULL;

COMMENT ON VIEW public.active_chromebooks IS 
  'View que retorna apenas chromebooks não deletados (soft delete)';

-- View para alunos ativos
CREATE OR REPLACE VIEW public.active_alunos AS
SELECT * FROM public.alunos
WHERE deleted_at IS NULL;

-- View para professores ativos
CREATE OR REPLACE VIEW public.active_professores AS
SELECT * FROM public.professores
WHERE deleted_at IS NULL;

-- View para funcionários ativos
CREATE OR REPLACE VIEW public.active_funcionarios AS
SELECT * FROM public.funcionarios
WHERE deleted_at IS NULL;

-- ========================================
-- FUNÇÃO PARA RESTAURAR REGISTROS
-- ========================================

CREATE OR REPLACE FUNCTION public.restore_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verificar se usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem restaurar registros';
  END IF;

  -- Restaurar registro (remover deleted_at)
  CASE p_table_name
    WHEN 'chromebooks' THEN
      UPDATE public.chromebooks SET deleted_at = NULL WHERE id = p_record_id;
    WHEN 'alunos' THEN
      UPDATE public.alunos SET deleted_at = NULL WHERE id = p_record_id;
    WHEN 'professores' THEN
      UPDATE public.professores SET deleted_at = NULL WHERE id = p_record_id;
    WHEN 'funcionarios' THEN
      UPDATE public.funcionarios SET deleted_at = NULL WHERE id = p_record_id;
    ELSE
      RAISE EXCEPTION 'Tabela não suportada: %', p_table_name;
  END CASE;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.restore_record(TEXT, UUID) IS 
  'Restaura um registro soft-deleted. Apenas administradores podem executar.';

-- ========================================
-- ATUALIZAR VIEW loan_history
-- ========================================

-- Dropar view existente antes de recriar (evita erro de alteração de colunas)
DROP VIEW IF EXISTS public.loan_history;

-- Recriar view para ignorar empréstimos de chromebooks deletados
CREATE VIEW public.loan_history AS
SELECT 
  l.id,
  l.student_name,
  l.student_ra,
  l.student_email,
  l.purpose,
  l.user_type,
  l.loan_type,
  l.loan_date,
  l.expected_return_date,
  c.chromebook_id,
  c.model as chromebook_model,
  r.return_date,
  r.returned_by_name,
  r.returned_by_email,
  r.returned_by_type,
  r.notes as return_notes,
  CASE 
    WHEN r.id IS NOT NULL THEN 'devolvido'
    WHEN l.expected_return_date IS NOT NULL AND l.expected_return_date < NOW() THEN 'atrasado'
    ELSE 'ativo'
  END as status
FROM public.loans l
JOIN public.chromebooks c ON l.chromebook_id = c.id
LEFT JOIN public.returns r ON l.id = r.loan_id
WHERE l.deleted_at IS NULL 
  AND c.deleted_at IS NULL
  AND (r.id IS NULL OR r.deleted_at IS NULL)
ORDER BY l.loan_date DESC;

COMMENT ON VIEW public.loan_history IS 
  'Histórico de empréstimos, ignorando registros soft-deleted';

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN public.chromebooks.deleted_at IS 
  'Data de soft delete. NULL = ativo, NOT NULL = deletado';

COMMENT ON COLUMN public.alunos.deleted_at IS 
  'Data de soft delete. NULL = ativo, NOT NULL = deletado';

COMMENT ON COLUMN public.professores.deleted_at IS 
  'Data de soft delete. NULL = ativo, NOT NULL = deletado';

COMMENT ON COLUMN public.funcionarios.deleted_at IS 
  'Data de soft delete. NULL = ativo, NOT NULL = deletado';
