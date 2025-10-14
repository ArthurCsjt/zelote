-- Safely add new enum values for chromebook_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'chromebook_status' AND e.enumlabel = 'manutencao'
  ) THEN
    ALTER TYPE public.chromebook_status ADD VALUE 'manutencao';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'chromebook_status' AND e.enumlabel = 'fixo'
  ) THEN
    ALTER TYPE public.chromebook_status ADD VALUE 'fixo';
  END IF;
END $$;