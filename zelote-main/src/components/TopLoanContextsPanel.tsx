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
    <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
      <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
        <div>
          <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
            Top 10 Padrões de Uso
          </CardTitle>
          <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
            Combinações mais frequentes de Solicitante e Finalidade.
          </CardDescription>
        </div>
        <div className="p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <BookOpen className="h-5 w-5 text-black dark:text-white" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {topLoanContexts.length > 0 ? (
          <div className="space-y-4">
            {topLoanContexts.map((item, index) => {
              const rankColor = RANK_COLORS[index] || 'bg-gray-100 dark:bg-zinc-800';
              const Icon = getUserTypeIcon(item.userType);

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center p-3 border-2 border-black dark:border-white transition-all relative overflow-hidden",
                    "bg-white dark:bg-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                    "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  )}
                >
                  {/* Indicador de Ranking (Fita Lateral) - Agora como um bloco sólido */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-3 border-r-2 border-black",
                    rankColor
                  )} />

                  <div className="flex items-center flex-1 ml-4">
                    {/* Ícone do Tipo de Usuário - Com borda */}
                    <div className="mr-3 shrink-0 p-1.5 border-2 border-black bg-gray-50 dark:bg-zinc-900">
                      {Icon}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      {/* Nome e Finalidade */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black uppercase text-black dark:text-white truncate">{item.name}</span>
                        <span className="text-xs font-mono font-bold text-gray-500 truncate">- {item.purpose}</span>
                      </div>

                      {/* Tipo de Usuário (Badge) */}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="rounded-none border-black text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-900 text-black dark:text-gray-300 font-bold uppercase tracking-wider">
                          {item.userType}
                        </Badge>
                        {index < 3 && (
                          <span className="text-[10px] font-black uppercase bg-black text-white px-1">
                            TOP {index + 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contagem de Empréstimos */}
                  <div className="flex flex-col items-end shrink-0 ml-4 border-l-2 border-black pl-3">
                    <span className="text-2xl font-black text-black dark:text-white">{item.count}</span>
                    <span className="text-[10px] font-bold uppercase text-gray-600 dark:text-gray-400">empréstimos</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-zinc-700">
            <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-mono text-gray-500 uppercase">Nenhum contexto registrado.</p>
          </div>
        )}
      </CardContent>
    </div>
  );
};