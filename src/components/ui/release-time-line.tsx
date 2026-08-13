"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Monitor, User, Clock, CheckCircle, AlertTriangle, RotateCcw, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LoanHistoryItem } from "@/types/database";

// ── Tipos de agrupamento ──────────────────────────────────────────────────────
interface LoanGroup {
  groupKey: string;
  email: string;
  name: string;
  ra?: string;
  userType: string;
  loanDate: string;
  status: string;
  chromebooks: { id: string; model?: string }[];
  purpose?: string;
  createdByEmail?: string;
  returnDate?: string;
  returnedByName?: string;
  returnedByEmail?: string;
  returnNotes?: string;
  loans: LoanHistoryItem[];
}

// Agrupa empréstimos pelo mesmo email dentro de janela de 5 minutos (lotes)
function groupByEmailAndWindow(history: LoanHistoryItem[]): LoanGroup[] {
  const map = new Map<string, LoanGroup>();

  for (const loan of history) {
    const d = new Date(loan.loan_date);
    d.setSeconds(0, 0);
    d.setMinutes(Math.floor(d.getMinutes() / 5) * 5);
    const key = `${loan.student_email}__${d.toISOString()}`;

    if (!map.has(key)) {
      map.set(key, {
        groupKey: key,
        email: loan.student_email,
        name: loan.student_name,
        ra: loan.student_ra ?? undefined,
        userType: loan.user_type,
        loanDate: loan.loan_date,
        status: loan.status,
        chromebooks: [],
        purpose: loan.purpose ?? undefined,
        createdByEmail: loan.created_by_email ?? undefined,
        returnDate: loan.return_date ?? undefined,
        returnedByName: loan.returned_by_name ?? undefined,
        returnedByEmail: loan.returned_by_email ?? undefined,
        returnNotes: loan.return_notes ?? undefined,
        loans: [],
      });
    }

    const group = map.get(key)!;
    group.loans.push(loan);

    if (loan.chromebook_id) {
      group.chromebooks.push({ id: loan.chromebook_id, model: loan.chromebook_model ?? undefined });
    }

    // "Pior" status vence: atrasado > ativo > devolvido
    const priority: Record<string, number> = { atrasado: 3, ativo: 2, devolvido: 1 };
    if ((priority[loan.status] ?? 0) > (priority[group.status] ?? 0)) {
      group.status = loan.status;
    }

    // Devolução mais recente
    if (loan.return_date && (!group.returnDate || loan.return_date > group.returnDate)) {
      group.returnDate = loan.return_date;
      group.returnedByName = loan.returned_by_name ?? undefined;
      group.returnedByEmail = loan.returned_by_email ?? undefined;
      group.returnNotes = loan.return_notes ?? undefined;
    }
  }

  return Array.from(map.values());
}

export function ZeloteTimeline({ history, className }: ZeloteTimelineProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = useMemo(() => groupByEmailAndWindow(history), [history]);

  const setCardRef = (el: HTMLDivElement | null, i: number) => {
    cardRefs.current[i] = el;
  };

  // Scroll listener com throttle de 100ms (muito mais leve que rAF contínuo)
  useEffect(() => {
    const onScroll = () => {
      if (throttleRef.current) return;
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
        const centerY = window.innerHeight / 3;
        let bestIndex = 0;
        let bestDist = Infinity;
        cardRefs.current.forEach((node, i) => {
          if (!node) return;
          const rect = node.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          const dist = Math.abs(mid - centerY);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
          }
        });
        setActiveIndex(bestIndex);
      }, 100);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [groups]);

  if (groups.length === 0) {
    return (
      <div className="neo-card p-12 text-center">
        <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-lg font-black uppercase">Nenhum registro para exibir na Linha do Tempo</p>
      </div>
    );
  }

  return (
    <section className={cn("py-6 relative", className)}>
      <div className="mx-auto max-w-4xl space-y-6 relative">
        {/* Linha Vertical no lado esquerdo */}
        <div className="absolute left-[20px] md:left-[28px] top-2 bottom-2 w-[3px] bg-black/15 dark:bg-white/15 border-r border-dashed border-black/30 dark:border-white/30 z-0" />

        {groups.map((group, index) => {
          const isActive = index === activeIndex;
          const isReturned = group.status === 'devolvido';
          const isOverdue = group.status === 'atrasado';

          const loanDateStr = format(new Date(group.loanDate), "dd/MM/yyyy", { locale: ptBR });
          const loanTimeStr = format(new Date(group.loanDate), "HH:mm", { locale: ptBR });
          const returnDateStr = group.returnDate
            ? format(new Date(group.returnDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            : null;

          const isBatch = group.loans.length > 1;

          return (
            <div
              key={group.groupKey}
              ref={(el) => setCardRef(el, index)}
              className="relative flex flex-col md:flex-row gap-4 pl-14 md:pl-20 group transition-all duration-300"
            >
              {/* ══ HORA + NÓ + DATA na linha temporal ══ */}
              <div className="absolute left-0 top-0 flex flex-col items-center z-20 w-14 md:w-[52px]">
                <span className="text-[10px] font-black font-mono text-muted-foreground leading-none mb-1 text-center">
                  {loanTimeStr}
                </span>
                <div className={cn(
                  "w-6 h-6 rounded-full border-[3px] border-black dark:border-white flex items-center justify-center transition-all duration-300 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]",
                  isActive
                    ? "scale-125 bg-amber-400 ring-4 ring-amber-400/30"
                    : isReturned ? "bg-emerald-500"
                    : isOverdue ? "bg-red-500"
                    : "bg-blue-500"
                )}>
                  {isReturned ? <CheckCircle className="h-3 w-3 text-white stroke-[3]" />
                    : isOverdue ? <AlertTriangle className="h-3 w-3 text-white stroke-[3]" />
                    : <Clock className="h-3 w-3 text-white stroke-[3]" />}
                </div>
                <span className="text-[9px] font-bold font-mono text-muted-foreground/60 leading-none mt-1 text-center">
                  {loanDateStr}
                </span>
              </div>

              {/* ══ CARD DO GRUPO ══ */}
              <article className={cn(
                "flex-1 border-[3px] border-black dark:border-white transition-all duration-300 p-4",
                isActive
                  ? "bg-amber-50/90 dark:bg-zinc-900 border-l-[8px] border-l-amber-500 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  : isReturned
                    ? "bg-emerald-50/30 dark:bg-zinc-900/50 border-l-[6px] border-l-emerald-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]"
                    : isOverdue
                      ? "bg-red-50/30 dark:bg-zinc-900/50 border-l-[6px] border-l-red-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]"
                      : "bg-blue-50/30 dark:bg-zinc-900/50 border-l-[6px] border-l-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]"
              )}>
                {/* E-MAIL EM DESTAQUE PRINCIPAL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-[2px] border-black/10 dark:border-white/10 pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-black dark:text-white shrink-0" />
                      <h2 className="text-base sm:text-lg font-black uppercase text-black dark:text-white tracking-tight break-all">
                        {group.email}
                      </h2>
                    </div>
                    <p className="text-xs font-bold uppercase text-muted-foreground ml-6 mt-0.5">
                      {group.name}{group.ra ? ` • RA: ${group.ra}` : ''}{' '}
                      <span className="text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 font-black">
                        {group.userType}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {isBatch && (
                      <Badge className="font-black uppercase text-[10px] border-2 border-black px-2 py-0.5 bg-violet-600 text-white shadow-[2px_2px_0_0_#000]">
                        LOTE × {group.loans.length}
                      </Badge>
                    )}
                    <Badge className={cn(
                      "font-black uppercase text-xs border-2 border-black px-2.5 py-0.5 shadow-[2px_2px_0_0_#000]",
                      isReturned ? "bg-emerald-500 text-white"
                        : isOverdue ? "bg-red-500 text-white"
                        : "bg-amber-400 text-black"
                    )}>
                      {group.status}
                    </Badge>
                  </div>
                </div>

                {/* IDs DOS CHROMEBOOKS — ABAIXO DO E-MAIL */}
                <div className="mt-3 space-y-3">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1 mt-0.5 shrink-0">
                      <Monitor className="h-3.5 w-3.5" />
                      {group.chromebooks.length > 1 ? `${group.chromebooks.length} equipamentos:` : 'Equipamento:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.chromebooks.map((cb, ci) => (
                        <div key={`${cb.id}-${ci}`} className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white font-mono font-black text-sm px-2.5 py-0.5 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                          >
                            {cb.id}
                          </Badge>
                          {cb.model && (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase hidden sm:inline">
                              {cb.model}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Finalidade */}
                  {group.purpose && (
                    <div className="flex items-start gap-1.5 text-xs font-mono text-foreground/80 bg-white/60 dark:bg-black/40 p-2 border border-black/10 dark:border-white/10">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span className="font-bold uppercase break-words">{group.purpose}</span>
                    </div>
                  )}

                  {/* Datas de Retirada e Devolução */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] font-mono border-t border-dashed border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                      <Clock className="h-3 w-3 text-blue-600 shrink-0" />
                      <span>RETIRADA: {format(new Date(group.loanDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    {returnDateStr && (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <RotateCcw className="h-3 w-3 shrink-0" />
                        <span>DEVOLVIDO: {returnDateStr}</span>
                      </div>
                    )}
                  </div>

                  {/* Detalhes extras — visíveis apenas no item ativo */}
                  <div className={cn(
                    "grid transition-all duration-300 ease-out overflow-hidden",
                    isActive ? "grid-rows-[1fr] opacity-100 pt-2" : "grid-rows-[0fr] opacity-0"
                  )}>
                    <div className="overflow-hidden space-y-1 text-[10px] font-bold uppercase text-muted-foreground bg-white/80 dark:bg-black/60 p-2.5 border-2 border-black/20 dark:border-white/20">
                      {group.createdByEmail && (
                        <p>• Registrado por: <span className="text-foreground font-black">{group.createdByEmail}</span></p>
                      )}
                      {group.returnedByName && (
                        <p>• Recebido pelo operador: <span className="text-foreground font-black">{group.returnedByName} ({group.returnedByEmail})</span></p>
                      )}
                      {group.returnNotes && (
                        <p className="text-red-600 dark:text-red-400 font-black">• Nota: "{group.returnNotes}"</p>
                      )}
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

