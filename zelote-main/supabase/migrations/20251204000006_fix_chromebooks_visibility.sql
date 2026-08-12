-- Migração para garantir acesso de leitura aos chromebooks para todos os usuários autenticados
-- Data: 2024-12-04
-- Problema: Usuários não conseguem visualizar chromebooks no inventário

-- 1. Remover política antiga se existir
DROP POLICY IF EXISTS "Users can view chromebooks" ON public.chromebooks;
DROP POLICY IF EXISTS "Authenticated users can view chromebooks" ON public.chromebooks;

-- 2. Criar política que permite todos os usuários autenticados verem chromebooks
CREATE POLICY "Authenticated users can view chromebooks" 
  ON public.chromebooks 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- 3. Comentário para documentação
COMMENT ON POLICY "Authenticated users can view chromebooks" ON public.chromebooks IS 
  'Permite que todos os usuários autenticados visualizem os chromebooks no inventário.';

-- 4. Verificar outras tabelas relacionadas ao inventário
-- Garantir que alunos, professores e funcionários também são visíveis

DROP POLICY IF EXISTS "Users can view students" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.alunos;
CREATE POLICY "Authenticated users can view students" 
  ON public.alunos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view teachers" ON public.professores;
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.professores;
CREATE POLICY "Authenticated users can view teachers" 
  ON public.professores 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view staff" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.funcionarios;
CREATE POLICY "Authenticated users can view staff" 
  ON public.funcionarios 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- 5. Garantir que empréstimos e devoluções também são visíveis
DROP POLICY IF EXISTS "Users can view loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can view loans" ON public.loans;
CREATE POLICY "Authenticated users can view loans" 
  ON public.loans 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view returns" ON public.returns;
DROP POLICY IF EXISTS "Authenticated users can view returns" ON public.returns;
CREATE POLICY "Authenticated users can view returns" 
  ON public.returns 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
