-- Migration: Adiciona coluna 'manufacturer' à tabela chromebooks
-- Data: 2025-09-29

ALTER TABLE public.chromebooks
ADD COLUMN IF NOT EXISTS manufacturer TEXT;

-- Atualiza timestamp de updated_at automaticamente (se já existir trigger, pode não ser necessário)
-- CREATE OR REPLACE FUNCTION public.update_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.chromebooks
-- FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
