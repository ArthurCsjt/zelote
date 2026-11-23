-- ==============================================================================
-- Migração: Correções de Prioridade 2 (Notificações Internas para Agendamentos)
-- Data: 2026-11-23
-- Descrição:
-- Permite que professores, administradores e manutenção insiram notificações
-- para os responsáveis do sistema quando realizarem reservas de equipamentos.
-- A leitura de notificações permanece estritamente restrita (cada usuário só lê as suas).
-- ==============================================================================

DROP POLICY IF EXISTS "Secure insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'professor', 'manutencao')
    )
  );

COMMENT ON POLICY "Authenticated users can insert notifications" ON public.notifications IS
'Permite que papéis autorizados insiram notificações internas para coordenadores e professores.';
