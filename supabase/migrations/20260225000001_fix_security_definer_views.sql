-- Fix Security Definer Views
-- Replaces SECURITY DEFINER with SECURITY INVOKER on all views.
-- This ensures that the RLS policies of the QUERYING USER are enforced.

CREATE OR REPLACE VIEW public.active_alunos
WITH (security_invoker = true)
AS
 SELECT alunos.id, alunos.nome_completo, alunos.ra, alunos.email, alunos.turma, alunos.created_at, alunos.deleted_at
   FROM alunos WHERE (alunos.deleted_at IS NULL);

CREATE OR REPLACE VIEW public.active_chromebooks
WITH (security_invoker = true)
AS
 SELECT chromebooks.id, chromebooks.chromebook_id, chromebooks.model, chromebooks.serial_number,
    chromebooks.patrimony_number, chromebooks.status, chromebooks.condition, chromebooks.location,
    chromebooks.created_at, chromebooks.updated_at, chromebooks.created_by, chromebooks.classroom,
    chromebooks.manufacturer, chromebooks.is_deprovisioned, chromebooks.deleted_at
   FROM chromebooks WHERE (chromebooks.deleted_at IS NULL);

CREATE OR REPLACE VIEW public.active_funcionarios
WITH (security_invoker = true)
AS
 SELECT funcionarios.id, funcionarios.nome_completo, funcionarios.email, funcionarios.created_at, funcionarios.deleted_at
   FROM funcionarios WHERE (funcionarios.deleted_at IS NULL);

CREATE OR REPLACE VIEW public.active_professores
WITH (security_invoker = true)
AS
 SELECT professores.id, professores.nome_completo, professores.email, professores.created_at, professores.materia, professores.deleted_at
   FROM professores WHERE (professores.deleted_at IS NULL);

CREATE OR REPLACE VIEW public.loan_history
WITH (security_invoker = true)
AS
 SELECT l.id, l.student_name, l.student_ra, l.student_email, l.purpose, l.user_type, l.loan_type,
    l.loan_date, l.expected_return_date, l.reservation_id, c.chromebook_id, c.model AS chromebook_model,
    ( SELECT profiles.email FROM profiles WHERE (profiles.id = l.created_by)) AS created_by_email,
    r.return_date, r.returned_by_name, r.returned_by_email, r.returned_by_type, r.notes AS return_notes,
    CASE WHEN (r.id IS NOT NULL) THEN 'devolvido'::text WHEN (l.expected_return_date < now()) THEN 'atrasado'::text ELSE 'ativo'::text END AS status
   FROM ((loans l JOIN chromebooks c ON ((l.chromebook_id = c.id))) LEFT JOIN returns r ON ((l.id = r.loan_id)))
  ORDER BY l.loan_date DESC;
