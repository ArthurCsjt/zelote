import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Bell, Check, CheckAll, Clock, Info, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export function NotificationFeed() {
    const { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useDatabase();
    const queryClient = useQueryClient();

    const { data: notifications, isLoading, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        refetchInterval: 30000,
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

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    return (
        <Card className={cn(
            "flex flex-col w-full h-[600px] max-h-[85vh] p-0 overflow-hidden",
            "border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none"
        )}>
            <CardHeader className={cn(
                "p-4 border-b-4 border-black dark:border-white sticky top-0 z-20 flex flex-row items-center justify-between gap-2 shrink-0",
                "bg-blue-300 dark:bg-blue-900/50"
            )}>
                <CardTitle className="text-lg flex items-center gap-2 text-black dark:text-white flex-1 min-w-0 font-black uppercase tracking-tight">
                    <Bell className="h-5 w-5 text-black dark:text-white shrink-0" />
                    <span className="truncate">Notificações</span>
                    {unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-none border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                            {unreadCount}
                        </span>
                    )}
                </CardTitle>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAllReadMutation.mutate()}
                        className="h-8 px-2 text-[10px] font-black uppercase border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800"
                    >
                        Lidas
                    </Button>
                )}
            </CardHeader>

            <ScrollArea className="flex-1 w-full bg-white dark:bg-zinc-900">
                <CardContent className="p-0">
                    {notifications && notifications.length > 0 ? (
                        <div className="divide-y-2 divide-black/10 dark:divide-white/10">
                            {notifications.map((notification: any) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 transition-colors relative group",
                                        !notification.is_read ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500" : "opacity-70"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <p className={cn(
                                                "font-black text-sm uppercase tracking-tight mb-1",
                                                !notification.is_read ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground"
                                            )}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-foreground mb-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    {notification.type === 'reservation' ? 'Agendamento' : 'Sistema'}
                                                </span>
                                            </div>
                                        </div>

                                        {!notification.is_read && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-300 dark:hover:bg-green-900"
                                                onClick={() => markReadMutation.mutate(notification.id)}
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="font-black uppercase tracking-tighter">Nenhuma notificação.</p>
                        </div>
                    )}
                </CardContent>
            </ScrollArea>
        </Card>
    );
}
