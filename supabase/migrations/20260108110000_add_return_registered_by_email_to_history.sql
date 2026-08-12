-- Atualizar a view loan_history para incluir o email de quem registrou a devolução
-- Data: 2026-01-08

DROP VIEW IF EXISTS public.loan_history;

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
  p_loan.email as created_by_email,
  r.return_date,
  r.returned_by_name,
  r.returned_by_email,
  r.returned_by_type,
  r.notes as return_notes,
  p_return.email as return_registered_by_email,
  CASE 
    WHEN r.id IS NOT NULL THEN 'devolvido'
    WHEN l.expected_return_date IS NOT NULL AND l.expected_return_date < NOW() THEN 'atrasado'
    ELSE 'ativo'
  END as status
FROM public.loans l
JOIN public.chromebooks c ON l.chromebook_id = c.id
LEFT JOIN public.profiles p_loan ON l.created_by = p_loan.id
LEFT JOIN public.returns r ON l.id = r.loan_id
LEFT JOIN public.profiles p_return ON r.created_by = p_return.id
WHERE l.deleted_at IS NULL 
  AND c.deleted_at IS NULL
  AND (r.id IS NULL OR r.deleted_at IS NULL)
ORDER BY l.loan_date DESC;

COMMENT ON VIEW public.loan_history IS 
  'Histórico de empréstimos com informações de quem registrou o empréstimo e a devolução.';
