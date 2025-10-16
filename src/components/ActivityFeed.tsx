import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Clock, Monitor, User, CheckCircle, RotateCcw, Loader2, AlertTriangle, Mail } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from './ui/separator';

interface Activity {
  activity_id: string;
  activity_type: 'Empréstimo' | 'Devolução';
  chromebook_id: string;
  user_name: string;
  user_email: string;
  activity_time: string;
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
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
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
                const color = isLoan ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50';
                
                return (
                  <div key={activity.activity_id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${color}`}>
                          <Icon className={`h-4 w-4`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">
                            {activity.user_name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Monitor className="h-3 w-3" />
                            {activity.chromebook_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium whitespace-nowrap ${isLoan ? 'text-green-700' : 'text-blue-700'}`}>
                          {activity.activity_type}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {formatDistanceToNow(new Date(activity.activity_time), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {activity.user_email}
                      </p>
                      <p className="text-[10px] text-gray-400">
                          {format(new Date(activity.activity_time), 'dd/MM HH:mm')}
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