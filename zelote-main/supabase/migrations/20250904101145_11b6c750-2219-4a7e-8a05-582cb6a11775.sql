-- Add classroom column to chromebooks table
ALTER TABLE public.chromebooks ADD COLUMN IF NOT EXISTS classroom text;

-- Update the chromebook_status enum to include all valid statuses
ALTER TYPE chromebook_status ADD VALUE IF NOT EXISTS 'fixo';
ALTER TYPE chromebook_status ADD VALUE IF NOT EXISTS 'manutencao';