-- Criar enum para tipos de usuário
CREATE TYPE user_type AS ENUM ('aluno', 'professor', 'funcionario');

-- Criar enum para status do Chromebook
CREATE TYPE chromebook_status AS ENUM ('disponivel', 'emprestado', 'manutencao', 'fora_uso');

-- Criar enum para tipo de empréstimo
CREATE TYPE loan_type AS ENUM ('individual', 'lote');

-- Criar tabela de Chromebooks
CREATE TABLE public.chromebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chromebook_id TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  serial_number TEXT,
  patrimony_number TEXT,
  status chromebook_status NOT NULL DEFAULT 'disponivel',
  condition TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Criar tabela de empréstimos
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chromebook_id UUID NOT NULL REFERENCES public.chromebooks(id),
  student_name TEXT NOT NULL,
  student_ra TEXT,
  student_email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'aluno',
  loan_type loan_type NOT NULL DEFAULT 'individual',
  loan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_return_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de devoluções
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  returned_by_name TEXT NOT NULL,
  returned_by_ra TEXT,
  returned_by_email TEXT NOT NULL,
  returned_by_type user_type NOT NULL DEFAULT 'aluno',
  return_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.chromebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Políticas para chromebooks
CREATE POLICY "Users can view chromebooks" ON public.chromebooks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert chromebooks" ON public.chromebooks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update chromebooks" ON public.chromebooks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super admins can delete chromebooks" ON public.chromebooks FOR DELETE USING (is_super_admin(auth.uid()));

-- Políticas para empréstimos
CREATE POLICY "Users can view loans" ON public.loans FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update loans" ON public.loans FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super admins can delete loans" ON public.loans FOR DELETE USING (is_super_admin(auth.uid()));

-- Políticas para devoluções
CREATE POLICY "Users can view returns" ON public.returns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert returns" ON public.returns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update returns" ON public.returns FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super admins can delete returns" ON public.returns FOR DELETE USING (is_super_admin(auth.uid()));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_chromebooks_updated_at
  BEFORE UPDATE ON public.chromebooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar status do chromebook quando emprestado
CREATE OR REPLACE FUNCTION public.update_chromebook_status_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar status para emprestado
  UPDATE public.chromebooks 
  SET status = 'emprestado'
  WHERE id = NEW.chromebook_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER loan_update_chromebook_status
  AFTER INSERT ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chromebook_status_on_loan();

-- Trigger para atualizar status do chromebook quando devolvido
CREATE OR REPLACE FUNCTION public.update_chromebook_status_on_return()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar status para disponível
  UPDATE public.chromebooks 
  SET status = 'disponivel'
  WHERE id = (SELECT chromebook_id FROM public.loans WHERE id = NEW.loan_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER return_update_chromebook_status
  AFTER INSERT ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chromebook_status_on_return();

-- View para relatórios combinados
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