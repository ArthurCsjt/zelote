-- Fix Quantity Check Constraint
-- Allows quantity_requested = 0 when a space_id is set (space reservations
-- don't need Chromebooks, so 0 is a valid value).

-- Drop the old constraint that required quantity > 0 unconditionally
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_quantity_requested_check;

-- Add the new, smarter constraint:
-- - If space_id IS NULL  (Chromebook reservation): quantity must be > 0
-- - If space_id IS NOT NULL (space reservation):    quantity must be >= 0
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_quantity_requested_check
  CHECK (
    ((space_id IS NULL AND quantity_requested > 0)
     OR (space_id IS NOT NULL AND quantity_requested >= 0))
  );
