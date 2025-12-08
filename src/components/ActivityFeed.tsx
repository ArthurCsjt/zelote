import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Clock, Monitor, User, CheckCircle, RotateCcw, Loader2, AlertTriangle, UserCheck, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from './ui/separator';
import { Button } from './ui/button'; // Importando Button
import { cn } from '@/lib/utils'; // Importando cn

interface Activity {
  activity_id: string;
  activity_type: 'Empréstimo' | 'Devolução';
  chromebook_id: string;
  user_name: string; // Solicitante (Aluno/Prof/Func)
  user_email: string; // Email do Solicitante
  activity_time: string;
  creator_name: string | null; // NOVO: Usuário logado que registrou a ação
  creator_email: string | null; // NOVO: Email do criador
}

const fetchRecentActivities = async (): Promise<Activity[]> => {
  const { data, error } = await supabase.rpc('get_recent_loan_activities');
  if (error) throw new Error(error.message);
  return data as Activity[];
};

export function ActivityFeed() {
  const { data: activities, isLoading, error, refetch } = useQuery<Activity[]>({
    queryKey: ['recentActivities'],
    queryFn: fetchRecentActivities,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-32 neo-card">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-error-foreground neo-card border-l-4 border-l-error">
        <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-error" />
        Erro ao carregar atividades: {error.message}
      </div>
    );
  }

  return (
    // Aplicando o estilo neo-brutalista ao Card principal
    <Card className={cn(
      "flex flex-col max-h-[90vh] p-0", // Removida largura fixa
      "border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]"
    )}>

      {/* Cabeçalho Fixo e Aprimorado (shrink-0 para não encolher) */}
      <CardHeader className={cn(
        "p-4 border-b-4 border-black dark:border-white sticky top-0 z-10 flex flex-row items-center justify-between gap-2 shrink-0",
        "bg-yellow-300 dark:bg-yellow-900/50"
      )}>
        <CardTitle className="text-lg flex items-center gap-2 text-black dark:text-white flex-1 min-w-0 font-black uppercase tracking-tight">
          <Clock className="h-5 w-5 text-black dark:text-white shrink-0" />
          <span className="truncate">Atividade Recente</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 text-black dark:text-white ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      {/* Área de Rolagem */}
      <ScrollArea className="w-full max-h-[calc(90vh-100px)] min-h-[200px]">
        <CardContent className="p-0">
          {activities && activities.length > 0 ? (
            <div className="divide-y-2 divide-black/10 dark:divide-white/10">
              {activities.map((activity, index) => {
                const isLoan = activity.activity_type === 'Empréstimo';
                const Icon = isLoan ? CheckCircle : RotateCcw;
                const colorClass = isLoan ? 'text-success-foreground' : 'text-info-foreground';
                const bgClass = isLoan ? 'bg-success-bg/50 dark:bg-success-bg/20' : 'bg-info-bg/50 dark:bg-info-bg/20';
                const borderColor = isLoan ? 'border-l-success' : 'border-l-info';
                const creatorName = activity.creator_name || activity.creator_email?.split('@')[0] || 'Sistema';

                return (
                  <div 
                    key={activity.activity_id} 
                    className={cn(
                      "p-4 transition-colors border-l-4",
                      "hover:bg-gray-50 dark:hover:bg-zinc-800/50",
                      borderColor,
                      bgClass
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* Número da Atividade */}
                        <div className={cn(
                          "flex items-center justify-center h-6 w-6 rounded-none text-xs font-black text-black dark:text-white shrink-0 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                          isLoan ? 'bg-green-300' : 'bg-blue-300'
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-black text-sm text-foreground flex items-center gap-2 uppercase">
                            {activity.activity_type}
                            <Icon className={cn("h-4 w-4", colorClass)} />
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                            <Monitor className="h-3 w-3" />
                            <span className="font-semibold">{activity.chromebook_id}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.activity_time), { addSuffix: true, locale: ptBR })}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {format(new Date(activity.activity_time), 'dd/MM HH:mm')}
                        </p>
                      </div>
                    </div>

                    {/* Detalhes do Solicitante e Criador */}
                    <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 space-y-1">
                      <p className="text-xs text-foreground flex items-start gap-1">
                        <User className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="font-black shrink-0 uppercase">Solicitante:</span>
                        <span className="break-words font-medium">{activity.user_name}</span>
                      </p>

                      <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
                        <UserCheck className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span className="font-black shrink-0 uppercase">Registrado por:</span>
                        <span className="break-words font-medium">{creatorName}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              Nenhuma atividade recente.
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}