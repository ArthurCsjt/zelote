import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';

export type RealtimeStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

/**
 * Hook global resiliente para sincronização em tempo real via Supabase Realtime.
 * Escuta alterações nas tabelas críticas (chromebooks, loans, returns, reservations, notifications)
 * e invalida o cache do TanStack Query com debounce para evitar tempestade de requisições.
 */
export function useRealtimeSync() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('DISCONNECTED');

  const pendingInvalidations = useRef(new Set<string>());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Invalidação em lote com debounce de 250ms
  const triggerDebouncedInvalidation = useCallback((keys: string[]) => {
    keys.forEach(k => pendingInvalidations.current.add(k));

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const keysToInvalidate = Array.from(pendingInvalidations.current);
      pendingInvalidations.current.clear();

      keysToInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });

      logger.debug('[Realtime] Cache invalidado para as chaves:', keysToInvalidate);
    }, 250);
  }, [queryClient]);

  useEffect(() => {
    // Apenas conecta se o usuário estiver autenticado
    if (!isAuthenticated || !user) {
      setStatus('DISCONNECTED');
      return;
    }

    setStatus('CONNECTING');
    logger.info('[Realtime] Iniciando conexão com o canal global do Zelote...');

    const channelName = `zelote-sync-${user.id.slice(0, 8)}`;
    const channel = supabase.channel(channelName);

    // 1. Escuta mudanças na tabela de Chromebooks
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chromebooks' },
      (payload) => {
        logger.debug('[Realtime] Evento na tabela chromebooks:', payload.eventType);
        triggerDebouncedInvalidation([
          'chromebooks',
          'chromebook-search-list',
          'totalAvailableChromebooks',
          'maintenanceChromebooks',
          'dashboard-stats',
        ]);
      }
    );

    // 2. Escuta mudanças na tabela de Empréstimos (Loans)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'loans' },
      (payload) => {
        logger.debug('[Realtime] Evento na tabela loans:', payload.eventType);
        triggerDebouncedInvalidation([
          'loans',
          'active-loans',
          'loan-history',
          'loan-history-timeline',
          'recentActivities',
          'dashboard-stats',
          'chromebooks',
          'totalAvailableChromebooks',
        ]);
      }
    );

    // 3. Escuta mudanças na tabela de Devoluções (Returns)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'returns' },
      (payload) => {
        logger.debug('[Realtime] Evento na tabela returns:', payload.eventType);
        triggerDebouncedInvalidation([
          'loans',
          'active-loans',
          'loan-history',
          'loan-history-timeline',
          'recentActivities',
          'dashboard-stats',
          'chromebooks',
          'totalAvailableChromebooks',
        ]);
      }
    );

    // 4. Escuta mudanças na tabela de Reservas (Reservations)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservations' },
      (payload) => {
        logger.debug('[Realtime] Evento na tabela reservations:', payload.eventType);
        triggerDebouncedInvalidation([
          'reservations',
          'totalAvailableChromebooks',
        ]);
      }
    );

    // 5. Escuta notificações específicas para o usuário logado
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      (payload) => {
        logger.debug('[Realtime] Nova notificação recebida:', payload.eventType);
        triggerDebouncedInvalidation(['notifications']);
      }
    );

    // 6. Inscrição do canal e monitoramento de status
    channel.subscribe((subscriptionStatus, err) => {
      if (err) {
        logger.warn('[Realtime] Erro ao subscrever canal:', err);
        setStatus('ERROR');
        return;
      }

      switch (subscriptionStatus) {
        case 'SUBSCRIBED':
          logger.info('[Realtime] Conectado e escutando mudanças em tempo real!');
          setStatus('CONNECTED');
          break;
        case 'TIMED_OUT':
          logger.warn('[Realtime] Conexão excedeu tempo limite.');
          setStatus('ERROR');
          break;
        case 'CLOSED':
          setStatus('DISCONNECTED');
          break;
        case 'CHANNEL_ERROR':
          logger.warn('[Realtime] Erro no canal de WebSockets.');
          setStatus('ERROR');
          break;
      }
    });

    // Cleanup seguro ao desmontar ou trocar de usuário
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      logger.info('[Realtime] Desconectando canal de tempo real...');
      supabase.removeChannel(channel);
      setStatus('DISCONNECTED');
    };
  }, [user, isAuthenticated, triggerDebouncedInvalidation]);

  return {
    status,
    isConnected: status === 'CONNECTED',
  };
}
