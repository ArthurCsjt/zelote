-- Criar tabelas para gerenciamento de entidades

-- Tabela de alunos
CREATE TABLE public.alunos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  ra TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  turma TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de professores
CREATE TABLE public.professores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para alunos
CREATE POLICY "Authenticated users can view alunos" 
ON public.alunos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert alunos" 
ON public.alunos 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update alunos" 
ON public.alunos 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can delete alunos" 
ON public.alunos 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Políticas RLS para professores
CREATE POLICY "Authenticated users can view professores" 
ON public.professores 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert professores" 
ON public.professores 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update professores" 
ON public.professores 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can delete professores" 
ON public.professores 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Políticas RLS para funcionários
CREATE POLICY "Authenticated users can view funcionarios" 
ON public.funcionarios 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert funcionarios" 
ON public.funcionarios 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update funcionarios" 
ON public.funcionarios 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can delete funcionarios" 
ON public.funcionarios 
FOR DELETE 
USING (is_super_admin(auth.uid()));