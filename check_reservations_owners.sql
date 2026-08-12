SELECT 
    id, 
    professor_id, 
    created_by, 
    justification, 
    (SELECT email FROM auth.users WHERE id = reservations.created_by) as creator_email,
    (SELECT email FROM auth.users WHERE id = reservations.professor_id) as professor_email
FROM public.reservations
LIMIT 20;
