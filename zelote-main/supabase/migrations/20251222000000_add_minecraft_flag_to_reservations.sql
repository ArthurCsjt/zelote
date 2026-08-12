-- Migration to add Minecraft lesson identification to reservations
-- Date: 2025-12-22

-- 1. Add is_minecraft column
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS is_minecraft BOOLEAN DEFAULT FALSE;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.reservations.is_minecraft IS 
  'Indica se a reserva é para uma aula de Minecraft (requer preparação especial dos equipamentos)';

-- 3. Update existing Minecraft-related reservations if identifiable by justification (optional)
UPDATE public.reservations 
SET is_minecraft = TRUE 
WHERE justification ILIKE '%minecraft%';
