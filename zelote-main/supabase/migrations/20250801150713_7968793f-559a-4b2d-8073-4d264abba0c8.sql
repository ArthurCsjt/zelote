-- Corrigir função para incluir search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Corrigir função para incluir search_path
CREATE OR REPLACE FUNCTION public.update_chromebook_status_on_loan()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
  -- Atualizar status para emprestado
  UPDATE public.chromebooks 
  SET status = 'emprestado'
  WHERE id = NEW.chromebook_id;
  RETURN NEW;
END;
$$;

-- Corrigir função para incluir search_path
CREATE OR REPLACE FUNCTION public.update_chromebook_status_on_return()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
  -- Atualizar status para disponível
  UPDATE public.chromebooks 
  SET status = 'disponivel'
  WHERE id = (SELECT chromebook_id FROM public.loans WHERE id = NEW.loan_id);
  RETURN NEW;
END;
$$;

-- Remover a view com security definer e criar uma view normal
DROP VIEW IF EXISTS public.loan_history;

-- Criar view normal para relatórios combinados
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
    ELSE 'ativo'
  END as status
FROM public.loans l
JOIN public.chromebooks c ON l.chromebook_id = c.id
LEFT JOIN public.returns r ON l.id = r.loan_id
ORDER BY l.loan_date DESC;