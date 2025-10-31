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

export const TopLoanContextsPanel: React.FC<TopLoanContextsPanelProps> = ({ topLoanContexts }) => {
  return (
    <GlassCard className="dashboard-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Top 5 Contextos de Empréstimo
        </CardTitle>
        <CardDescription>
          As combinações mais frequentes de Solicitante e Finalidade no período.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topLoanContexts.length > 0 ? (
          <div className="space-y-3">
            {topLoanContexts.map((item, index) => (
              <div 
                key={index} 
                className="flex flex-col p-3 border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground">{index + 1}.</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold truncate max-w-[200px]">{item.name}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{item.purpose}</span>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 shrink-0">
                        {item.count} empréstimo{item.count > 1 ? 's' : ''}
                    </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Badge variant="outline" className="capitalize flex items-center gap-1">
                        {getUserTypeIcon(item.userType)}
                        {item.userType}
                    </Badge>
                </div>
              </div>
            ))}
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