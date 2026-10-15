import React from 'react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

/**
 * Componente invisível de alto nível que mantém a escuta ativa
 * de eventos Realtime do Supabase enquanto o usuário estiver autenticado.
 */
export const RealtimeSyncHandler: React.FC = () => {
  useRealtimeSync();
  return null;
};
