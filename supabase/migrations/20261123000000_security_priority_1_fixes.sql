-- ==============================================================================
-- Migração: Correções de Segurança - Prioridade 1 (Proteção de RLS e Perfis)
-- Data: 2026-11-23
-- Descrição:
-- 1. Impede autoelevação de papéis (role escalation) na tabela profiles via trigger.
-- 2. Restringe escrita na tabela system_settings exclusivamente para administradores.
-- 3. Restringe visualização de alunos (LGPD) apenas para funções autorizadas.
-- 4. Restringe movimentações de empréstimos e devoluções para funções autorizadas.
-- 5. Restringe visualização de reservas para usuários autenticados.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROTEÇÃO CONTRA AUTOELEVAÇÃO DE PAPEL EM PROFILES (A5)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Se o campo 'role' estiver sendo alterado
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Bloqueia a alteração se chamada por um usuário que NÃO seja admin ou super_admin
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ) THEN
      RAISE EXCEPTION 'Acesso negado: Apenas administradores podem alterar o nível de acesso (role).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

COMMENT ON FUNCTION public.protect_profile_role IS 'Bloqueia autoelevação de permissão na tabela profiles por usuários não-administradores';


-- ------------------------------------------------------------------------------
-- 2. CORREÇÃO DE POLÍTICAS NA TABELA SYSTEM_SETTINGS (A6)
-- ------------------------------------------------------------------------------
-- Garante que apenas administradores autenticados possam alterar configurações do sistema
DROP POLICY IF EXISTS "Escrita admin" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system_settings" ON public.system_settings;

CREATE POLICY "Admins can manage system_settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Garante que a leitura de system_settings seja mantida para o funcionamento do app
DROP POLICY IF EXISTS "Leitura pública" ON public.system_settings;
CREATE POLICY "Leitura autenticada e pública de configurações"
  ON public.system_settings
  FOR SELECT
  TO public
  USING (true);


-- ------------------------------------------------------------------------------
-- 3. RESTRIÇÃO DE DADOS DE ALUNOS (LGPD) (A4)
-- ------------------------------------------------------------------------------
-- Apenas usuários com papéis institucionais legítimos podem visualizar dados cadastrais de alunos
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.alunos;
DROP POLICY IF EXISTS "Authorized roles can view students" ON public.alunos;

CREATE POLICY "Authorized roles can view students"
  ON public.alunos
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'professor', 'manutencao')
    )
  );


-- ------------------------------------------------------------------------------
-- 4. RESTRIÇÃO DE EMPRÉSTIMOS E DEVOLUÇÕES (A4)
-- ------------------------------------------------------------------------------
-- Bloqueia contas genéricas / não-autorizadas de manipular empréstimos e devoluções

-- LOANS
DROP POLICY IF EXISTS "Authenticated users can view loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can insert loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can update loans" ON public.loans;
DROP POLICY IF EXISTS "Authorized roles can view loans" ON public.loans;
DROP POLICY IF EXISTS "Authorized roles can insert loans" ON public.loans;
DROP POLICY IF EXISTS "Authorized roles can update loans" ON public.loans;

CREATE POLICY "Authorized roles can view loans"
  ON public.loans FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'professor', 'manutencao')
    )
  );

CREATE POLICY "Authorized roles can insert loans"
  ON public.loans FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'professor', 'manutencao')
    )
  );

CREATE POLICY "Authorized roles can update loans"
  ON public.loans FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'professor', 'manutencao')
    )
  );

-- RETURNS
DROP POLICY IF EXISTS "Authenticated users can view returns" ON public.returns;
DROP POLICY IF EXISTS "Authenticated users can insert returns" ON public.returns;
DROP POLICY IF EXISTS "Authenticated users can update returns" ON public.returns;
DROP POLICY IF EXISTS "Authorized roles can view returns" ON public.returns;
DROP POLICY IF EXISTS "Authorized roles can insert returns" ON public.returns;
DROP POLICY IF EXISTS "Authorized roles can update returns" ON public.returns;

CREATE POLICY "Authorized roles can view returns"
  ON public.returns FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'professor', 'manutencao')
    )
  );

CREATE POLICY "Authorized roles can insert returns"
  ON public.returns FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'professor', 'manutencao')
    )
  );

CREATE POLICY "Authorized roles can update returns"
  ON public.returns FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'professor', 'manutencao')
    )
  );


-- ------------------------------------------------------------------------------
-- 5. FECHAMENTO DE LEITURA ANÔNIMA DE RESERVAS (A6)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "reservations_select_policy" ON public.reservations;

CREATE POLICY "reservations_select_policy"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (true);
