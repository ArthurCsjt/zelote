-- Enable Space Scheduling v3 (Fixed)
-- Creates the spaces table and adds space_id FK to reservations,
-- along with a no-overlap EXCLUDE constraint to prevent double-booking.

-- 1. Create the spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  capacity integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enable RLS on spaces
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- 3. RLS: All authenticated users can view spaces
CREATE POLICY "Spaces are viewable by everyone"
  ON public.spaces FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- 4. RLS: Only super_admin can manage spaces
CREATE POLICY "Spaces are manageable by admins only"
  ON public.spaces FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'::user_role
    )
  );

-- 5. Add space_id column to reservations (if not exists)
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id);

-- 6. Create the helper function for time-range based exclusion
CREATE OR REPLACE FUNCTION public.reservation_tsrange(r_date date, r_time text)
RETURNS tsrange
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN tsrange(
    (r_date + r_time::time)::timestamp,
    (r_date + r_time::time + '50 minutes'::interval)::timestamp,
    '[]'
  );
END;
$$;

-- 7. Enable btree_gist extension (required for EXCLUDE constraint)
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;

-- 8. Add overlap exclusion constraint (prevents double-booking a space)
ALTER TABLE public.reservations
  ADD CONSTRAINT no_space_overlap
  EXCLUDE USING gist (
    space_id WITH =,
    reservation_tsrange(date, time_slot) WITH &&
  )
  WHERE (space_id IS NOT NULL);

-- 9. Add compound check: either space_id OR quantity is required
ALTER TABLE public.reservations
  ADD CONSTRAINT check_space_or_quantity
  CHECK (
    (space_id IS NOT NULL)
    OR (quantity_requested IS NOT NULL AND quantity_requested > 0)
  );
