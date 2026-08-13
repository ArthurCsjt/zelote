import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Monitor, User, Clock, CheckCircle, AlertTriangle, RotateCcw, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LoanHistoryItem } from "@/types/database";

export interface ZeloteTimelineProps {
  history: LoanHistoryItem[];
  className?: string;
}

export function ZeloteTimeline({ history, className }: ZeloteTimelineProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setSentinelRef = (el: HTMLDivElement | null, i: number) => {
    sentinelRefs.current[i] = el;
  };

  useEffect(() => {
    if (!sentinelRefs.current.length) return;

    let frame = 0;
    const updateActiveByProximity = () => {
      frame = requestAnimationFrame(updateActiveByProximity);
      const centerY = window.innerHeight / 3;
      let bestIndex = 0;
      let bestDist = Infinity;
      sentinelRefs.current.forEach((node, i) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - centerY);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      });
      if (bestIndex !== activeIndex) setActiveIndex(bestIndex);
    };

    frame = requestAnimationFrame(updateActiveByProximity);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="neo-card p-12 text-center">
        <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-lg font-black uppercase">Nenhum registro para exibir na Linha do Tempo</p>
      </div>
    );
  }

  return (
    <section className={cn("py-6 relative", className)}>
      <div className="mx-auto max-w-4xl space-y-8 md:space-y-12 relative">
        {/* Linha Vertical no lado esquerdo */}
        <div className="absolute left-[20px] md:left-[28px] top-6 bottom-6 w-1 bg-black/20 dark:bg-white/20 border-r border-dashed border-black dark:border-white z-0" />

        {history.map((loan, index) => {
          const isActive = index === activeIndex;
          const isReturned = loan.status === 'devolvido';
          const isOverdue = loan.status === 'atrasado';

          const loanDateFormatted = format(new Date(loan.loan_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
          const returnDateFormatted = loan.return_date 
            ? format(new Date(loan.return_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            : null;

          return (
            <div
              key={loan.id}
              className="relative flex flex-col md:flex-row gap-4 pl-12 md:pl-16 group transition-all duration-300"
              aria-current={isActive ? "true" : "false"}
            >
              {/* Sentinela para medir aproximação ao centro da tela */}
              <div
                ref={(el) => setSentinelRef(el, index)}
                aria-hidden
                className="absolute -top-24 left-0 h-12 w-12 opacity-0 pointer-events-none"
              />

              {/* Nó Indicador na Linha de Tempo */}
              <div className={cn(
                "absolute left-2.5 md:left-[18px] top-3.5 w-6 h-6 rounded-full border-3 border-black dark:border-white z-10 flex items-center justify-center transition-all duration-300 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]",
                isActive 
                  ? "scale-125 bg-amber-400 dark:bg-amber-500 ring-4 ring-amber-400/30" 
                  : isReturned 
                    ? "bg-emerald-500" 
                    : isOverdue 
                      ? "bg-red-500" 
                      : "bg-blue-500"
              )}>
                {isReturned ? (
                  <CheckCircle className="h-3 w-3 text-white stroke-[3]" />
                ) : isOverdue ? (
                  <AlertTriangle className="h-3 w-3 text-white stroke-[3]" />
                ) : (
                  <Clock className="h-3 w-3 text-white stroke-[3]" />
                )}
              </div>

              {/* Card da Linha do Tempo */}
              <article
                className={cn(
                  "flex-1 border-3 border-black dark:border-white transition-all duration-300 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]",
                  isActive
                    ? "bg-amber-50/90 dark:bg-zinc-900 border-l-[10px] border-l-amber-500 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-x-1"
                    : isReturned
                      ? "bg-emerald-50/40 dark:bg-zinc-900/50 border-l-[8px] border-l-emerald-500"
                      : isOverdue
                        ? "bg-red-50/40 dark:bg-zinc-900/50 border-l-[8px] border-l-red-500"
                        : "bg-blue-50/40 dark:bg-zinc-900/50 border-l-[8px] border-l-blue-500"
                )}
              >
                {/* ══ DADOS PRINCIPAIS DO SOLICITANTE ══ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-3">
                  <div className="min-w-0">
                    {/* E-MAIL EM DESTAQUE PRINCIPAL */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-black dark:text-white shrink-0" />
                      <h2 className="text-base sm:text-lg font-black uppercase text-black dark:text-white tracking-tight break-all">
                        {loan.student_email}
                      </h2>
                    </div>
                    {/* Nome em baixo em tom secundário */}
                    <p className="text-xs font-bold uppercase text-muted-foreground ml-6">
                      {loan.student_name} {loan.student_ra ? `• RA: ${loan.student_ra}` : ''}
                    </p>
                  </div>

                  {/* Badges de Status e Data */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn(
                      "font-black uppercase text-xs border-2 border-black px-2.5 py-0.5 shadow-[2px_2px_0_0_#000]",
                      isReturned
                        ? "bg-emerald-500 text-white"
                        : isOverdue
                          ? "bg-red-500 text-white"
                          : "bg-amber-500 text-white"
                    )}>
                      {loan.status}
                    </Badge>
                  </div>
                </div>

                {/* ══ DETALHES DE EQUIPAMENTOS EMBAIXO DO E-MAIL ══ */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1">
                      <Monitor className="h-3.5 w-3.5" /> Equipamento(s):
                    </span>
                    {/* Badge com ID do Chromebook */}
                    <Badge variant="outline" className="bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white font-mono font-black text-sm px-2.5 py-0.5 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                      {loan.chromebook_id}
                    </Badge>
                    {loan.chromebook_model && (
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        ({loan.chromebook_model})
                      </span>
                    )}
                  </div>

                  {/* Finalidade se houver */}
                  {loan.purpose && (
                    <div className="flex items-start gap-1.5 text-xs font-mono text-foreground/80 bg-white/60 dark:bg-black/40 p-2 border border-black/10 dark:border-white/10">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span className="font-bold uppercase break-words">{loan.purpose}</span>
                    </div>
                  )}

                  {/* Datas de Empréstimo e Devolução em grade */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] font-mono border-t border-dashed border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span>RETIRADA: {loanDateFormatted}</span>
                    </div>
                    {isReturned && returnDateFormatted && (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <RotateCcw className="h-3 w-3" />
                        <span>DEVOLVIDO: {returnDateFormatted}</span>
                      </div>
                    )}
                  </div>

                  {/* Detalhes expandidos se ativo na rolagem */}
                  <div className={cn(
                    "grid transition-all duration-300 ease-out overflow-hidden",
                    isActive ? "grid-rows-[1fr] opacity-100 pt-2" : "grid-rows-[0fr] opacity-0"
                  )}>
                    <div className="overflow-hidden space-y-1.5 text-[10px] font-bold uppercase text-muted-foreground bg-white/80 dark:bg-black/60 p-2.5 border-2 border-black/20 dark:border-white/20">
                      {loan.created_by_email && <p>• Registrado no sistema por: <span className="text-foreground font-black">{loan.created_by_email}</span></p>}
                      {loan.returned_by_name && <p>• Entregue ao operador: <span className="text-foreground font-black">{loan.returned_by_name} ({loan.returned_by_email})</span></p>}
                      {loan.return_notes && <p className="text-red-600 dark:text-red-400 font-black">• Nota de devolução: "{loan.return_notes}"</p>}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
export default ZeloteTimeline;
