-- Migração para corrigir políticas RLS muito permissivas
-- Data: 2024-12-04
-- Problema: Políticas USING (true) permitem acesso público a dados sensíveis
-- VERSÃO CORRIGIDA: Usa CREATE OR REPLACE para evitar erros de duplicação

-- ========================================
-- CHROMEBOOKS - CORRIGIR POLÍTICAS
-- ========================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view chromebooks" ON public.chromebooks;
DROP POLICY IF EXISTS "Authenticated users can view chromebooks" ON public.chromebooks;
DROP POLICY IF EXISTS "Authenticated users can insert chromebooks" ON public.chromebooks;
DROP POLICY IF EXISTS "Authenticated users can update chromebooks" ON public.chromebooks;
DROP POLICY IF EXISTS "Super admins can delete chromebooks" ON public.chromebooks;
DROP POLICY IF EXISTS "Admins can delete chromebooks" ON public.chromebooks;

-- Criar políticas restritivas
CREATE POLICY "Authenticated users can view chromebooks" 
  ON public.chromebooks 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert chromebooks" 
  ON public.chromebooks 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update chromebooks" 
  ON public.chromebooks 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete chromebooks" 
  ON public.chromebooks 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ========================================
-- LOANS - CORRIGIR POLÍTICAS
-- ========================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can view loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can insert loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can update loans" ON public.loans;
DROP POLICY IF EXISTS "Super admins can delete loans" ON public.loans;
DROP POLICY IF EXISTS "Admins can delete loans" ON public.loans;

-- Criar políticas restritivas
CREATE POLICY "Authenticated users can view loans" 
  ON public.loans 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert loans" 
  ON public.loans 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update loans" 
  ON public.loans 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete loans" 
  ON public.loans 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ========================================
-- RETURNS - CORRIGIR POLÍTICAS
-- ========================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view returns" ON public.returns;
DROP POLICY IF EXISTS "Authenticated users can view returns" ON public.returns;
DROP POLICY IF EXISTS "Authenticated users can insert returns" ON public.returns;
DROP POLICY IF EXISTS "Authenticated users can update returns" ON public.returns;
DROP POLICY IF EXISTS "Super admins can delete returns" ON public.returns;
DROP POLICY IF EXISTS "Admins can delete returns" ON public.returns;

-- Criar políticas restritivas
CREATE POLICY "Authenticated users can view returns" 
  ON public.returns 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert returns" 
  ON public.returns 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update returns" 
  ON public.returns 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete returns" 
  ON public.returns 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ========================================
-- RESERVATIONS - ADICIONAR POLÍTICAS
-- ========================================

-- Garantir que RLS está habilitado
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete own reservations" ON public.reservations;

-- Criar políticas para reservations
CREATE POLICY "Authenticated users can view reservations" 
  ON public.reservations 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create reservations" 
  ON public.reservations 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own reservations" 
  ON public.reservations 
  FOR UPDATE 
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Users can delete own reservations" 
  ON public.reservations 
  FOR DELETE 
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ));

-- ========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

COMMENT ON POLICY "Authenticated users can view chromebooks" ON public.chromebooks IS 
  'Permite que apenas usuários autenticados vejam o inventário de chromebooks. Corrige vulnerabilidade de acesso público.';

COMMENT ON POLICY "Admins can delete chromebooks" ON public.chromebooks IS 
  'Apenas administradores podem deletar chromebooks do sistema.';

COMMENT ON POLICY "Authenticated users can view loans" ON public.loans IS 
  'Permite que apenas usuários autenticados vejam empréstimos. Protege dados sensíveis de alunos.';

COMMENT ON POLICY "Users can update own reservations" ON public.reservations IS 
  'Usuários podem atualizar suas próprias reservas. Admins podem atualizar qualquer reserva.';
