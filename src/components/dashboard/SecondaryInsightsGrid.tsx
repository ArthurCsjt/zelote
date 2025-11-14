import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Clock, Monitor, RefreshCw, Loader2, CalendarX, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { OverdueAlertsPanel } from '@/components/OverdueAlertsPanel';
import { useDatabase } from '@/hooks/useDatabase';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import type { Chromebook } from '@/types/database';

interface SecondaryInsightsGridProps {
  isMounted: boolean;
}

// Função para buscar Chromebooks em Manutenção
const fetchMaintenanceChromebooks = async (getChromebooksByStatus: (status: Chromebook['status']) => Promise<Chromebook[]>): Promise<Chromebook[]> => {
  return getChromebooksByStatus('manutencao');
};

export const SecondaryInsightsGrid: React.FC<SecondaryInsightsGridProps> = ({ isMounted }) => {
  const { getChromebooksByStatus } = useDatabase();
  
  // Query para buscar equipamentos em manutenção
  const { data: maintenanceChromebooks = [], isLoading: isMaintenanceLoading, refetch: refetchMaintenance } = useQuery({
    queryKey: ['maintenanceChromebooks'],
    queryFn: () => fetchMaintenanceChromebooks(getChromebooksByStatus),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const getAnimationClass = (delay: number) => 
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 relative z-10">
      
      {/* Coluna 1: Alertas de Atraso e Vencimento (OverdueAlertsPanel) */}
      <div className={cn("lg:col-span-2", getAnimationClass(600))}>
        <OverdueAlertsPanel />
      </div>

      {/* Coluna 2: Equipamentos em Manutenção */}
      <GlassCard className={cn("dashboard-card border-l-4 border-l-red-500", getAnimationClass(700))}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-error-foreground">
            <AlertTriangle className="h-5 w-5 text-error" />
            Manutenção ({maintenanceChromebooks.length})
          </CardTitle>
          <RefreshCw 
            className={cn("h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-transform", isMaintenanceLoading && 'animate-spin')} 
            onClick={() => refetchMaintenance()}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {isMaintenanceLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : maintenanceChromebooks.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {maintenanceChromebooks.slice(0, 5).map((cb) => (
                <div key={cb.id} className="flex items-center justify-between p-2 bg-error-bg/50 rounded-lg border border-error/20">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-error" />
                    <span className="font-medium text-sm text-foreground">{cb.chromebook_id}</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {cb.condition || 'Sem nota'}
                  </Badge>
                </div>
              ))}
              {maintenanceChromebooks.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  ... e mais {maintenanceChromebooks.length - 5} em manutenção.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum equipamento em manutenção.</p>
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
};