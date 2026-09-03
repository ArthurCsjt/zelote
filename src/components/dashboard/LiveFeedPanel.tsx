import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, ArrowDownLeft, ArrowUpRight, AlertTriangle, RefreshCw, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LoanHistoryItem } from '@/types/database';

interface LiveFeedPanelProps {
  history: LoanHistoryItem[];
}

type FeedEvent =
  | { kind: 'loan'; item: LoanHistoryItem; time: Date }
  | { kind: 'return'; item: LoanHistoryItem; time: Date }
  | { kind: 'overdue'; item: LoanHistoryItem; time: Date };

const userTypePtBR: Record<string, string> = {
  aluno: 'Aluno',
  professor: 'Professor',
  funcionario: 'Funcionário',
};

export const LiveFeedPanel: React.FC<LiveFeedPanelProps> = ({ history }) => {
  const events: FeedEvent[] = useMemo(() => {
    const now = new Date();
    const feed: FeedEvent[] = [];

    history.forEach(item => {
      // Evento de empréstimo
      const loanTime = new Date(item.loan_date);
      feed.push({ kind: 'loan', item, time: loanTime });

      // Evento de devolução
      if (item.return_date) {
        const returnTime = new Date(item.return_date);
        feed.push({ kind: 'return', item, time: returnTime });
      } else if (item.expected_return_date) {
        // Ativo e em atraso?
        const exp = new Date(item.expected_return_date);
        if (exp < now) {
          feed.push({ kind: 'overdue', item, time: exp });
        }
      }
    });

    // Mais recente primeiro, limita a 30 itens
    return feed
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 30);
  }, [history]);

  const isEmpty = events.length === 0;

  return (
    <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-5">
        <div>
          <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Feed ao Vivo
          </CardTitle>
          <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
            Últimas movimentações de saída e retorno
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500 text-white px-2 py-1 border-2 border-black dark:border-white">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-[10px] font-black uppercase">AO VIVO</span>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-zinc-700">
              <Inbox className="h-10 w-10 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="font-black uppercase text-sm text-gray-400 dark:text-zinc-500">Nenhuma movimentação</p>
            <p className="text-xs text-gray-400 dark:text-zinc-600 font-mono">no período selecionado</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black/10 dark:divide-white/10 max-h-[420px] overflow-y-auto">
            {events.map((ev, i) => {
              const isLoan = ev.kind === 'loan';
              const isReturn = ev.kind === 'return';
              const isOverdue = ev.kind === 'overdue';

              const timeAgo = formatDistanceToNow(ev.time, { addSuffix: true, locale: ptBR });

              return (
                <div
                  key={`${ev.kind}-${ev.item.id}-${i}`}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors",
                    isOverdue && "bg-red-50/70 dark:bg-red-950/20"
                  )}
                >
                  {/* Ícone de tipo de evento */}
                  <div className={cn(
                    "shrink-0 mt-0.5 p-1.5 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]",
                    isLoan && "bg-yellow-300",
                    isReturn && "bg-green-400",
                    isOverdue && "bg-red-400"
                  )}>
                    {isLoan && <ArrowUpRight className="h-3.5 w-3.5 text-black" />}
                    {isReturn && <ArrowDownLeft className="h-3.5 w-3.5 text-black" />}
                    {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-black" />}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-1.5 py-0.5 font-mono",
                        isLoan && "bg-yellow-300 text-black",
                        isReturn && "bg-green-400 text-black",
                        isOverdue && "bg-red-400 text-white"
                      )}>
                        {isLoan ? 'SAÍDA' : isReturn ? 'RETORNO' : 'ATRASO'}
                      </span>
                      <span className="font-mono text-[10px] font-bold bg-gray-900 dark:bg-white text-white dark:text-black px-2 py-0.5">
                        {ev.item.chromebook_id}
                      </span>
                    </div>

                    <p className="font-black text-sm text-black dark:text-white mt-0.5 truncate">
                      {isReturn && ev.item.returned_by_name
                        ? ev.item.returned_by_name
                        : ev.item.student_name}
                    </p>

                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                        {userTypePtBR[ev.item.user_type] || ev.item.user_type}
                      </span>
                      {ev.item.purpose && (
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate max-w-[140px]">
                          · {ev.item.purpose}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tempo relativo */}
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {timeAgo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </div>
  );
};
