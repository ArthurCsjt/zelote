ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS block_id uuid;
CREATE INDEX IF NOT EXISTS reservations_block_id_idx ON public.reservations(block_id);