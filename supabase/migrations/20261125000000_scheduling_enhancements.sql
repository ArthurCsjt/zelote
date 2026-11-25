-- ==============================================================================
-- Migração: Melhorias no Módulo de Agendamento
-- Data: 2026-11-25
-- Descrição:
-- 1. Tabela blocked_dates para feriados, recessos e dias sem aula (Dica 7).
-- 2. Coluna released_at em reservations para liberar estoque em No-Show (Dica 9).
-- 3. Trigger de capacidade máxima de Chromebooks por horário no Postgres (Dica 12).
-- 4. Ajuste de política UPDATE em reservations para permitir edição pelo professor/admin (Dica 1).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA DE FERIADOS E DIAS BLOQUEADOS (Dica 7)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view blocked_dates" ON public.blocked_dates;
CREATE POLICY "Authenticated users can view blocked_dates"
  ON public.blocked_dates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage blocked_dates" ON public.blocked_dates;
CREATE POLICY "Admins can manage blocked_dates"
  ON public.blocked_dates
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


-- ------------------------------------------------------------------------------
-- 2. LIBERAÇÃO DE ESTOQUE EM NO-SHOW (Dica 9)
-- ------------------------------------------------------------------------------
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ DEFAULT NULL;

-- Atualiza a constraint de exclusão de espaço para ignorar reservas liberadas
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS no_space_overlap;

ALTER TABLE public.reservations
  ADD CONSTRAINT no_space_overlap
  EXCLUDE USING gist (
    space_id WITH =,
    public.reservation_tsrange(date, time_slot) WITH &&
  )
  WHERE (space_id IS NOT NULL AND released_at IS NULL);


-- ------------------------------------------------------------------------------
-- 3. POLÍTICA DE EDIÇÃO DE RESERVAS (Dica 1)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "reservations_update_policy" ON public.reservations;
CREATE POLICY "reservations_update_policy"
  ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR professor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR professor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );


-- ------------------------------------------------------------------------------
-- 4. TRAVA DE CAPACIDADE DE CHROMEBOOKS NO BANCO (Dica 12)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_chromebook_reservation_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  max_capacity INTEGER;
  current_booked INTEGER;
BEGIN
  -- Só valida quando há solicitação de Chromebooks e a reserva está ativa (não liberada)
  IF COALESCE(NEW.quantity_requested, 0) <= 0 OR NEW.released_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Calcula capacidade real ativa na tabela chromebooks (fallback 111 caso vazia)
  SELECT COUNT(*) INTO max_capacity
  FROM public.chromebooks
  WHERE deleted_at IS NULL
    AND COALESCE(is_deprovisioned, false) = false
    AND status NOT IN ('fora_uso', 'manutencao');

  IF COALESCE(max_capacity, 0) <= 0 THEN
    max_capacity := 111;
  END IF;

  -- Soma reservas ativas no mesmo dia e horário (excluindo a própria linha em caso de UPDATE)
  SELECT COALESCE(SUM(quantity_requested), 0) INTO current_booked
  FROM public.reservations
  WHERE date = NEW.date
    AND time_slot = NEW.time_slot
    AND released_at IS NULL
    AND id IS DISTINCT FROM NEW.id;

  IF (current_booked + NEW.quantity_requested) > max_capacity THEN
    RAISE EXCEPTION 'Capacidade máxima de Chromebooks (% disponíveis) excedida para este horário.', max_capacity;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_chromebook_capacity ON public.reservations;
CREATE TRIGGER tr_check_chromebook_capacity
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_chromebook_reservation_capacity();
