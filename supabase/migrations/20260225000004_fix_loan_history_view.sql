
-- Update loan_history view to include return_registered_by_email
CREATE OR REPLACE VIEW public.loan_history AS
 SELECT l.id,
    l.student_name,
    l.student_ra,
    l.student_email,
    l.purpose,
    l.user_type,
    l.loan_type,
    l.loan_date,
    l.expected_return_date,
    l.reservation_id,
    c.chromebook_id,
    c.model AS chromebook_model,
    ( SELECT profiles.email
           FROM profiles
          WHERE profiles.id = l.created_by) AS created_by_email,
    r.return_date,
    r.returned_by_name,
    r.returned_by_email,
    r.returned_by_type,
    r.notes AS return_notes,
    ( SELECT profiles.email
           FROM profiles
          WHERE profiles.id = r.created_by) AS return_registered_by_email,
        CASE
            WHEN r.id IS NOT NULL THEN 'devolvido'::text
            WHEN l.expected_return_date < now() THEN 'atrasado'::text
            ELSE 'ativo'::text
        END AS status
   FROM loans l
     JOIN chromebooks c ON l.chromebook_id = c.id
     LEFT JOIN returns r ON l.id = r.loan_id
  ORDER BY l.loan_date DESC;
