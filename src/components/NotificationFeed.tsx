import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '@/hooks/useDatabase';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  Laptop, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Loader2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    reservation_id?: string;
    prof_name?: string;
    date?: string;
    time_slot?: string;
    classroom?: string;
    quantity?: number;
  };
}

interface NotificationFeedProps {
  onClose?: () => void;
}

// Limpa mensagens legadas com segundos extras ou plural incorreto
function cleanNotificationMessage(msg: string): string {
  if (!msg) return '';
  return msg
    .replace(/(\d{2}:\d{2}):00(?=\b|\.)/g, '$1')
    .replace(/\b1 Chromebooks\b/g, '1 Chromebook');
}

export function NotificationFeed({ onClose }: NotificationFeedProps) {
  const { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useDatabase();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 60000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const displayedNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.is_read);
    }
    return notifications;
  }, [notifications, filter]);

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }

    // Se for notificação de agendamento, navega para a página de agendamento
    if (notification.type === 'reservation' || notification.type === 'reservation_bulk' || notification.metadata?.reservation_id) {
      onClose?.();
      navigate('/agendamento');
    }
  };

  const getNotificationIcon = (notification: NotificationItem) => {
    const t = (notification.type || '').toLowerCase();
    const title = (notification.title || '').toLowerCase();

    if (t.includes('reservation') || title.includes('agendamento') || title.includes('reserva')) {
      return {
        icon: Laptop,
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        label: 'Agendamento'
      };
    }
    if (t.includes('alert') || title.includes('atenção') || title.includes('expirou') || title.includes('não retirada')) {
      return {
        icon: AlertTriangle,
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        label: 'Alerta'
      };
    }
    if (t.includes('return') || title.includes('devolução') || title.includes('concluído')) {
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        label: 'Devolução'
      };
    }

    return {
      icon: Bell,
      bg: 'bg-primary/10 text-primary',
      label: 'Sistema'
    };
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-48 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <span className="text-xs font-medium">Carregando notificações...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-h-[540px] bg-card text-card-foreground select-none">
      {/* ── Header Moderno ── */}
      <div className="p-4 border-b border-border/80 bg-muted/30 sticky top-0 z-10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground tracking-tight">
                Notificações
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground leading-none">
                  {unreadCount} nova{unreadCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground font-medium rounded-lg hover:bg-muted"
              title="Marcar todas como lidas"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1 text-primary" />
              <span>Marcar todas</span>
            </Button>
          )}
        </div>

        {/* ── Filtros Rápidos (Todas / Não lidas) ── */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl text-xs font-medium w-fit">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              "px-3 py-1 rounded-lg transition-all text-xs font-medium",
              filter === 'all'
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todas ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={cn(
              "px-3 py-1 rounded-lg transition-all text-xs font-medium flex items-center gap-1.5",
              filter === 'unread'
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Não lidas</span>
            {unreadCount > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
            <span className="text-[11px] opacity-80">({unreadCount})</span>
          </button>
        </div>
      </div>

      {/* ── Lista de Notificações ── */}
      <ScrollArea className="flex-1 w-full max-h-[420px] overflow-y-auto">
        {displayedNotifications.length === 0 ? (
          <div className="py-12 px-6 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground/60">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-semibold text-sm text-foreground">
              {filter === 'unread' ? "Tudo em dia!" : "Nenhuma notificação"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              {filter === 'unread' 
                ? "Você já visualizou todas as suas notificações pendentes." 
                : "Você não possui nenhuma notificação recente."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            <AnimatePresence initial={false}>
              {displayedNotifications.map((notification) => {
                const { icon: TypeIcon, bg, label } = getNotificationIcon(notification);
                const isUnread = !notification.is_read;

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-3.5 transition-colors relative cursor-pointer group flex items-start gap-3",
                      isUnread 
                        ? "bg-primary/[0.04] hover:bg-primary/[0.08]" 
                        : "hover:bg-muted/40 opacity-80 hover:opacity-100"
                    )}
                  >
                    {/* Indicador de não lida (ponto azul) */}
                    {isUnread && (
                      <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
                    )}

                    {/* Ícone Contextual */}
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      bg
                    )}>
                      <TypeIcon className="h-4 w-4" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={cn(
                          "text-xs font-semibold truncate",
                          isUnread ? "text-foreground font-bold" : "text-foreground/80"
                        )}>
                          {notification.title}
                        </span>

                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {cleanNotificationMessage(notification.message)}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                          {label}
                        </span>

                        {isUnread && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate(notification.id);
                            }}
                            className="h-6 w-6 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground transition-colors opacity-70 group-hover:opacity-100"
                            title="Marcar como lida"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
