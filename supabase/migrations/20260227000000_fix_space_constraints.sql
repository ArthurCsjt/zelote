-- Fix Space Constraints
-- Allows space reservations (quantity_requested = 0) to use either space_id OR a classroom string

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS check_space_or_quantity;

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_quantity_requested_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT check_space_or_quantity
  CHECK (
    (space_id IS NOT NULL)
    OR (classroom IS NOT NULL AND classroom != '')
    OR (quantity_requested IS NOT NULL AND quantity_requested > 0)
  );

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_quantity_requested_check
  CHECK (
    quantity_requested >= 0
    AND (
      quantity_requested > 0 
      OR space_id IS NOT NULL 
      OR (classroom IS NOT NULL AND classroom != '')
    )
  );
