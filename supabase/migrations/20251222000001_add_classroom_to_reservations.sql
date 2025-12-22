-- Migration to add classroom/room field to reservations
-- Date: 2025-12-22

-- 1. Add classroom column
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS classroom TEXT;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.reservations.classroom IS 
  'Nome da sala ou turma onde os equipamentos serão utilizados';

-- 3. Update existing reservations with a placeholder if needed
UPDATE public.reservations 
SET classroom = 'Não informada' 
WHERE classroom IS NULL;
