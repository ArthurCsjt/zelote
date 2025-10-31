import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Clock, Monitor, User, CheckCircle, RotateCcw, Loader2, AlertTriangle, UserCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from './ui/separator';

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
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ['recentActivities'],
    queryFn: fetchRecentActivities,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-destructive">
        <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
        Erro ao carregar atividades: {error.message}
      </div>
    );
  }

  return (
    <Card className="w-[350px] md:w-[400px] shadow-2xl border-none">
      <CardHeader className="p-4 border-b bg-gray-50/50 backdrop-blur-sm">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
          <Clock className="h-5 w-5 text-primary" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <ScrollArea className="h-[300px]">
        <CardContent className="p-0">
          {activities && activities.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {activities.map((activity, index) => {
                const isLoan = activity.activity_type === 'Empréstimo';
                const Icon = isLoan ? CheckCircle : RotateCcw;
                const color = isLoan ? 'text-green-600' : 'text-blue-600';
                const creatorName = activity.creator_name || activity.creator_email?.split('@')[0] || 'Sistema';
                
                return (
                  <div key={activity.activity_id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* NOVO: Número da Atividade */}
                        <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold text-white ${isLoan ? 'bg-green-500' : 'bg-blue-500'}`}>
                            {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800 flex items-center gap-2">
                            {activity.activity_type}
                            <Icon className={`h-4 w-4 ${color}`} />
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Monitor className="h-3 w-3" />
                            {activity.chromebook_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.activity_time), { addSuffix: true, locale: ptBR })}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {format(new Date(activity.activity_time), 'dd/MM HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Detalhes do Solicitante */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">Solicitante:</span>
                        {activity.user_name} ({activity.user_email})
                      </p>
                      
                      {/* Detalhes do Criador (Admin/Funcionário) */}
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <UserCheck className="h-3 w-3 text-primary" />
                        <span className="font-medium">Registrado por:</span>
                        {creatorName}
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