-- Add expected_return_date column to loans table if it doesn't exist
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS expected_return_date timestamp with time zone;

-- Add function to check overdue loans
CREATE OR REPLACE FUNCTION public.get_overdue_loans()
RETURNS TABLE (
  loan_id uuid,
  chromebook_id text,
  student_name text,
  student_email text,
  loan_date timestamp with time zone,
  expected_return_date timestamp with time zone,
  days_overdue integer
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  SELECT 
    l.id as loan_id,
    c.chromebook_id,
    l.student_name,
    l.student_email,
    l.loan_date,
    l.expected_return_date,
    EXTRACT(days FROM (now() - l.expected_return_date))::integer as days_overdue
  FROM loans l
  JOIN chromebooks c ON l.chromebook_id = c.id
  WHERE l.expected_return_date IS NOT NULL 
    AND l.expected_return_date < now()
    AND NOT EXISTS (
      SELECT 1 FROM returns r WHERE r.loan_id = l.id
    );
$$;

-- Add function to get loans with due dates approaching (next 3 days)
CREATE OR REPLACE FUNCTION public.get_upcoming_due_loans()
RETURNS TABLE (
  loan_id uuid,
  chromebook_id text,
  student_name text,
  student_email text,
  loan_date timestamp with time zone,
  expected_return_date timestamp with time zone,
  days_until_due integer
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  SELECT 
    l.id as loan_id,
    c.chromebook_id,
    l.student_name,
    l.student_email,
    l.loan_date,
    l.expected_return_date,
    EXTRACT(days FROM (l.expected_return_date - now()))::integer as days_until_due
  FROM loans l
  JOIN chromebooks c ON l.chromebook_id = c.id
  WHERE l.expected_return_date IS NOT NULL 
    AND l.expected_return_date > now()
    AND l.expected_return_date <= (now() + INTERVAL '3 days')
    AND NOT EXISTS (
      SELECT 1 FROM returns r WHERE r.loan_id = l.id
    );
$$;

-- Update the loan_history view to include the expected return date
DROP VIEW IF EXISTS public.loan_history;
CREATE VIEW public.loan_history 
WITH (security_invoker=true) AS
SELECT 
  l.id,
  l.user_type,
  l.loan_type,
  l.loan_date,
  l.expected_return_date,
  r.return_date,
  r.returned_by_type,
  c.model as chromebook_model,
  l.student_name,
  l.student_ra,
  l.student_email,
  l.purpose,
  r.notes as return_notes,
  r.returned_by_name,
  r.returned_by_email,
  CASE 
    WHEN r.id IS NOT NULL THEN 'devolvido'
    WHEN l.expected_return_date IS NOT NULL AND l.expected_return_date < now() THEN 'atrasado'
    ELSE 'ativo'
  END as status,
  c.chromebook_id
FROM loans l
JOIN chromebooks c ON l.chromebook_id = c.id
LEFT JOIN returns r ON r.loan_id = l.id
ORDER BY l.loan_date DESC;