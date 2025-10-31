import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen, TrendingUp, GraduationCap, Briefcase, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from './ui/GlassCard';
import { cn } from '@/lib/utils';
import type { TopLoanContext } from '@/hooks/useDashboardData';

interface TopLoanContextsPanelProps {
  topLoanContexts: TopLoanContext[];
}

const getUserTypeIcon = (type: string) => {
    switch (type) {
        case 'aluno':
            return <GraduationCap className="h-4 w-4 text-blue-600" />;
        case 'professor':
            return <User className="h-4 w-4 text-green-600" />;
        case 'funcionario':
            return <Briefcase className="h-4 w-4 text-orange-600" />;
        default:
            return <User className="h-4 w-4 text-gray-600" />;
    }
};

// Cores para o ranking (1º, 2º, 3º)
const RANK_COLORS = ['bg-yellow-400', 'bg-gray-300', 'bg-amber-600'];

export const TopLoanContextsPanel: React.FC<TopLoanContextsPanelProps> = ({ topLoanContexts }) => {
  return (
    <GlassCard className="dashboard-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Top 10 Padrões de Uso Mais Comuns
        </CardTitle>
        <CardDescription>
          As 10 combinações mais frequentes de Solicitante e Finalidade no período.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topLoanContexts.length > 0 ? (
          <div className="space-y-3">
            {topLoanContexts.map((item, index) => {
              const rankColor = RANK_COLORS[index] || 'bg-gray-100';
              const Icon = getUserTypeIcon(item.userType);
              
              return (
                <div 
                  key={index} 
                  className="flex items-center p-3 border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors relative overflow-hidden"
                >
                  {/* Indicador de Ranking (Fita Lateral) */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg",
                    rankColor
                  )} />
                  
                  <div className="flex items-center flex-1 ml-2">
                    {/* Ícone do Tipo de Usuário */}
                    <div className="mr-3 shrink-0">
                        {Icon}
                    </div>
                    
                    <div className="flex flex-col min-w-0 flex-1">
                        {/* Nome e Finalidade */}
                        <span className="text-sm font-semibold truncate text-gray-800">{item.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{item.purpose}</span>
                        
                        {/* Tipo de Usuário (Badge) */}
                        <Badge variant="outline" className="capitalize w-fit mt-1 text-[10px] px-1.5 py-0.5">
                            {item.userType}
                        </Badge>
                    </div>
                  </div>
                  
                  {/* Contagem de Empréstimos */}
                  <div className="flex flex-col items-end shrink-0 ml-4">
                    <span className="text-xl font-bold text-primary">{item.count}</span>
                    <span className="text-xs text-muted-foreground">empréstimos</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum contexto de empréstimo registrado no período.</p>
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
};