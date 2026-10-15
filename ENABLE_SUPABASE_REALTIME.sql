-- ==============================================================================
-- Script de Ativação do Supabase Realtime para o Zelote
-- Execute este script no "SQL Editor" do seu painel do Supabase
-- ==============================================================================

DO $$
BEGIN
  -- 1. Habilitar replicação em tempo real para chromebooks
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chromebooks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chromebooks;
  END IF;

  -- 2. Habilitar replicação em tempo real para loans (empréstimos)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'loans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE loans;
  END IF;

  -- 3. Habilitar replicação em tempo real para returns (devoluções)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'returns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE returns;
  END IF;

  -- 4. Habilitar replicação em tempo real para reservations (agendamentos)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
  END IF;

  -- 5. Habilitar replicação em tempo real para notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Configurar REPLICA IDENTITY FULL para garantir dados completos nos eventos de UPDATE/DELETE
ALTER TABLE chromebooks REPLICA IDENTITY FULL;
ALTER TABLE loans REPLICA IDENTITY FULL;
ALTER TABLE returns REPLICA IDENTITY FULL;
ALTER TABLE reservations REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
