-- Fix critical security vulnerabilities in database functions
-- Add search_path protection to prevent SQL injection attacks

CREATE OR REPLACE FUNCTION public.get_overdue_loans()
 RETURNS TABLE(loan_id uuid, chromebook_id text, student_name text, student_email text, loan_date timestamp with time zone, expected_return_date timestamp with time zone, days_overdue integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_upcoming_due_loans()
 RETURNS TABLE(loan_id uuid, chromebook_id text, student_name text, student_email text, loan_date timestamp with time zone, expected_return_date timestamp with time zone, days_until_due integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;