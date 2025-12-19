-- Migration to update reservations table for professor self-service
-- Date: 2025-12-19
-- Changes:
-- 1. Remove 'subject' column (replaced by 'justification')
-- 2. Add 'justification' column (required text field)
-- 3. Add auxiliary equipment fields (TV, Sound, Microphone)

-- 1. Add new columns
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS justification TEXT,
ADD COLUMN IF NOT EXISTS needs_tv BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_sound BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_mic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mic_quantity INTEGER DEFAULT 0;

-- 2. Migrate existing data: copy 'subject' to 'justification' if exists
UPDATE public.reservations
SET justification = COALESCE(subject, 'Sem justificativa informada')
WHERE justification IS NULL;

-- 3. Make justification NOT NULL after migration
ALTER TABLE public.reservations
ALTER COLUMN justification SET NOT NULL;

-- 4. Drop the old 'subject' column
ALTER TABLE public.reservations
DROP COLUMN IF EXISTS subject;

-- 5. Add comments for documentation
COMMENT ON COLUMN public.reservations.justification IS 
  'Justificativa/motivo do agendamento fornecida pelo professor';

COMMENT ON COLUMN public.reservations.needs_tv IS 
  'Indica se o professor necessita de TV para a aula';

COMMENT ON COLUMN public.reservations.needs_sound IS 
  'Indica se o professor necessita de equipamento de som';

COMMENT ON COLUMN public.reservations.needs_mic IS 
  'Indica se o professor necessita de microfone(s)';

COMMENT ON COLUMN public.reservations.mic_quantity IS 
  'Quantidade de microfones solicitados (0 se não necessitar)';
