import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Target, TrendingUp } from 'lucide-react';
import type { LocationStats, MethodStats, ConditionStats } from '@/types/database';
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard

interface AuditStatsProps {
  totalCounted: number;
  totalExpected: number;
  completionRate: string;
  duration: string;
  itemsPerHour: number;
  locationStats: LocationStats[];
  methodStats: MethodStats;
  conditionStats: ConditionStats[];
}

export const AuditStats: React.FC<AuditStatsProps> = ({
  totalCounted,
  totalExpected,
  completionRate,
  duration,
  itemsPerHour,
  locationStats,
  methodStats,
  conditionStats,
}) => {
  const progressValue = totalExpected > 0 ? (totalCounted / totalExpected) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <GlassCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Itens Contados</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCounted}</div>
          <p className="text-xs text-muted-foreground">
            de {totalExpected} esperados
          </p>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progresso</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}</div>
          <Progress value={progressValue} className="mt-2" />
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duração</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{duration}</div>
          <p className="text-xs text-muted-foreground">
            Tempo decorrido
          </p>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{itemsPerHour}</div>
          <p className="text-xs text-muted-foreground">
            itens/hora
          </p>
        </CardContent>
      </GlassCard>
    </div>
  );
};