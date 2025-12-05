-- Migração para adicionar índices de performance
-- Data: 2024-12-04
-- Objetivo: Otimizar queries frequentes e melhorar performance do sistema

-- ========================================
-- ÍNDICES PARA CHROMEBOOKS
-- ========================================

-- Índice para filtros por status (query mais comum)
CREATE INDEX IF NOT EXISTS idx_chromebooks_status 
  ON public.chromebooks(status) 
  WHERE status IS NOT NULL;

-- Índice para busca por chromebook_id (usado em empréstimos e devoluções)
CREATE INDEX IF NOT EXISTS idx_chromebooks_chromebook_id 
  ON public.chromebooks(chromebook_id);

-- Índice para filtros por localização
CREATE INDEX IF NOT EXISTS idx_chromebooks_location 
  ON public.chromebooks(location) 
  WHERE location IS NOT NULL;

-- Índice para filtros por sala de aula
CREATE INDEX IF NOT EXISTS idx_chromebooks_classroom 
  ON public.chromebooks(classroom) 
  WHERE classroom IS NOT NULL;

-- Índice para filtros por fabricante
CREATE INDEX IF NOT EXISTS idx_chromebooks_manufacturer 
  ON public.chromebooks(manufacturer) 
  WHERE manufacturer IS NOT NULL;

-- Índice composto para queries de inventário (status + location)
CREATE INDEX IF NOT EXISTS idx_chromebooks_status_location 
  ON public.chromebooks(status, location) 
  WHERE status IS NOT NULL AND location IS NOT NULL;

-- ========================================
-- ÍNDICES PARA LOANS
-- ========================================

-- Índice para buscar empréstimos por chromebook (usado em devoluções)
CREATE INDEX IF NOT EXISTS idx_loans_chromebook_id 
  ON public.loans(chromebook_id);

-- Índice para ordenação por data de empréstimo (query padrão)
CREATE INDEX IF NOT EXISTS idx_loans_loan_date 
  ON public.loans(loan_date DESC);

-- Índice para filtros por tipo de usuário
CREATE INDEX IF NOT EXISTS idx_loans_user_type 
  ON public.loans(user_type);

-- Índice para filtros por tipo de empréstimo
CREATE INDEX IF NOT EXISTS idx_loans_loan_type 
  ON public.loans(loan_type);

-- Índice para buscar empréstimos próximos ao vencimento
CREATE INDEX IF NOT EXISTS idx_loans_expected_return_date 
  ON public.loans(expected_return_date) 
  WHERE expected_return_date IS NOT NULL;

-- Índice composto para buscar empréstimos ativos de um chromebook
-- Nota: Removido predicado WHERE com NOW() pois não é IMMUTABLE
-- A filtragem por data será feita na query, o índice ainda otimiza a busca
CREATE INDEX IF NOT EXISTS idx_loans_chromebook_active 
  ON public.loans(chromebook_id, loan_date);

-- ========================================
-- ÍNDICES PARA RETURNS
-- ========================================

-- Índice para JOIN com loans (usado na view loan_history)
CREATE INDEX IF NOT EXISTS idx_returns_loan_id 
  ON public.returns(loan_id);

-- Índice para ordenação por data de devolução
CREATE INDEX IF NOT EXISTS idx_returns_return_date 
  ON public.returns(return_date DESC);

-- ========================================
-- ÍNDICES PARA ALUNOS
-- ========================================

-- Índice único para email (busca e validação de duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_alunos_email_unique 
  ON public.alunos(LOWER(email));

-- Índice único para RA (busca e validação de duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_alunos_ra_unique 
  ON public.alunos(UPPER(ra));

-- Índice para filtros por turma
CREATE INDEX IF NOT EXISTS idx_alunos_turma 
  ON public.alunos(turma);

-- Índice para busca por nome (autocomplete)
CREATE INDEX IF NOT EXISTS idx_alunos_nome 
  ON public.alunos USING gin(to_tsvector('portuguese', nome_completo));

-- ========================================
-- ÍNDICES PARA PROFESSORES
-- ========================================

-- Índice único para email
CREATE UNIQUE INDEX IF NOT EXISTS idx_professores_email_unique 
  ON public.professores(LOWER(email));

-- Índice para busca por nome (autocomplete)
CREATE INDEX IF NOT EXISTS idx_professores_nome 
  ON public.professores USING gin(to_tsvector('portuguese', nome_completo));

-- ========================================
-- ÍNDICES PARA FUNCIONARIOS
-- ========================================

-- Índice único para email
CREATE UNIQUE INDEX IF NOT EXISTS idx_funcionarios_email_unique 
  ON public.funcionarios(LOWER(email));

-- Índice para busca por nome (autocomplete)
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome 
  ON public.funcionarios USING gin(to_tsvector('portuguese', nome_completo));

-- ========================================
-- ÍNDICES PARA RESERVATIONS (AGENDAMENTO)
-- ========================================

-- Índice composto para buscar reservas por data e horário
CREATE INDEX IF NOT EXISTS idx_reservations_date_time 
  ON public.reservations(date, time_slot);

-- Índice para buscar reservas de um professor
CREATE INDEX IF NOT EXISTS idx_reservations_professor 
  ON public.reservations(professor_id);

-- ========================================
-- ÍNDICES PARA AUDIT (INVENTÁRIO)
-- ========================================

-- Índice para buscar itens de uma auditoria
CREATE INDEX IF NOT EXISTS idx_audit_items_audit_id 
  ON public.audit_items(audit_id);

-- Índice para buscar auditorias por status
CREATE INDEX IF NOT EXISTS idx_inventory_audits_status 
  ON public.inventory_audits(status);

-- Índice para buscar auditorias por criador
CREATE INDEX IF NOT EXISTS idx_inventory_audits_created_by 
  ON public.inventory_audits(created_by);

-- ========================================
-- ANÁLISE E COMENTÁRIOS
-- ========================================

-- Comentários para documentação
COMMENT ON INDEX idx_chromebooks_status IS 
  'Otimiza filtros por status (disponivel, emprestado, etc)';

COMMENT ON INDEX idx_loans_chromebook_id IS 
  'Otimiza busca de empréstimos por chromebook (usado em devoluções)';

COMMENT ON INDEX idx_alunos_email_unique IS 
  'Garante unicidade de email (case-insensitive) e otimiza buscas';

-- Atualizar estatísticas das tabelas para o query planner
ANALYZE public.chromebooks;
ANALYZE public.loans;
ANALYZE public.returns;
ANALYZE public.alunos;
ANALYZE public.professores;
ANALYZE public.funcionarios;
