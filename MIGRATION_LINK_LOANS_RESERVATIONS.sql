-- Migration: Link Loans to Reservations
-- Date: 2025-12-28
-- Description: Adds reservation_id to loans table and updates loan_history view to include it.

-- 1. Add reservation_id column to loans table
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.loans.reservation_id IS 'ID da reserva associada a este empréstimo (se houver)';

-- 3. Update loan_history view to include reservation_id
-- We need to drop and recreate the view because we're adding a column
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
  l.reservation_id, -- Nova coluna incluída
  c.chromebook_id,
  c.model as chromebook_model,
  -- Adicionado email de quem criou (se disponível via profiles)
  (SELECT email FROM public.profiles WHERE id = l.created_by) as created_by_email,
  r.return_date,
  r.returned_by_name,
  r.returned_by_email,
  r.returned_by_type,
  r.notes as return_notes,
  CASE 
    WHEN r.id IS NOT NULL THEN 'devolvido'
    WHEN l.expected_return_date < now() THEN 'atrasado'
    ELSE 'ativo'
  END as status
FROM public.loans l
JOIN public.chromebooks c ON l.chromebook_id = c.id
LEFT JOIN public.returns r ON l.id = r.loan_id
ORDER BY l.loan_date DESC;

-- 4. Ensure RLS policies are updated if necessary (usually they cover all columns)
-- No changes needed to RLS policies for loans as they already allow authenticated users to view all columns.
