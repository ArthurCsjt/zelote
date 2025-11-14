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

// Função para buscar Chromebooks em Manutenção (mantida, mas não usada no render)
const fetchMaintenanceChromebooks = async (getChromebooksByStatus: (status: Chromebook['status']) => Promise<Chromebook[]>): Promise<Chromebook[]> => {
  return getChromebooksByStatus('manutencao');
};

export const SecondaryInsightsGrid: React.FC<SecondaryInsightsGridProps> = ({ isMounted }) => {
  // Mantendo o hook de dados, mas não o renderizando
  const { getChromebooksByStatus } = useDatabase();
  
  // Query para buscar equipamentos em manutenção (mantida, mas não usada no render)
  const { data: maintenanceChromebooks = [], isLoading: isMaintenanceLoading, refetch: refetchMaintenance } = useQuery({
    queryKey: ['maintenanceChromebooks'],
    queryFn: () => fetchMaintenanceChromebooks(getChromebooksByStatus),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const getAnimationClass = (delay: number) => 
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  return (
    <div className="grid gap-4 grid-cols-1 relative z-10">
      
      {/* Coluna 1: Alertas de Atraso e Vencimento (OverdueAlertsPanel) */}
      {/* Agora ocupa a largura total (col-span-1) */}
      <div className={cn("lg:col-span-1", getAnimationClass(600))}>
        <OverdueAlertsPanel />
      </div>

      {/* O card de Manutenção foi removido daqui */}
    </div>
  );
};