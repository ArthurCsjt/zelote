"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Monitor, User, Clock, CheckCircle2, AlertTriangle, RotateCcw, BookOpen, Layers, ChevronDown } from "lucide-react";
import { useScroll, useTransform, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LoanHistoryItem } from "@/types/database";

export interface ZeloteTimelineProps {
  history: LoanHistoryItem[];
  searchTerm?: string;
  statusFilter?: string;
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

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

function groupByEmailAndWindow(history: LoanHistoryItem[]): LoanGroup[] {
  const map = new Map<string, LoanGroup>();

  for (const loan of history) {
    const d = new Date(loan.loan_date);
    d.setMilliseconds(0);
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

    const priority: Record<string, number> = { atrasado: 3, ativo: 2, devolvido: 1 };
    if ((priority[loan.status] ?? 0) > (priority[group.status] ?? 0)) {
      group.status = loan.status;
    }

    if (loan.return_date && (!group.returnDate || loan.return_date > group.returnDate)) {
      group.returnDate = loan.return_date;
      group.returnedByName = loan.returned_by_name ?? undefined;
      group.returnedByEmail = loan.returned_by_email ?? undefined;
      group.returnNotes = loan.return_notes ?? undefined;
    }
  }

  return Array.from(map.values());
}

export function ZeloteTimeline({ history, searchTerm = "", statusFilter = "all", containerRef, className }: ZeloteTimelineProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [visibleLimit, setVisibleLimit] = useState(30);

  const filteredHistory = useMemo(() => {
    let result = history;
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(item =>
        item.student_email?.toLowerCase().includes(term) ||
        item.student_name?.toLowerCase().includes(term) ||
        item.chromebook_id?.toLowerCase().includes(term) ||
        item.purpose?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(item => item.status === statusFilter);
    }
    return result;
  }, [history, searchTerm, statusFilter]);

  const groups = useMemo(() => groupByEmailAndWindow(filteredHistory), [filteredHistory]);
  const visibleGroups = useMemo(() => groups.slice(0, visibleLimit), [groups, visibleLimit]);

  useEffect(() => {
    if (!contentRef.current) return;
    const updateHeight = () => {
      if (contentRef.current) {
        setHeight(contentRef.current.getBoundingClientRect().height);
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [visibleGroups]);

  // Framer motion scroll container tracking
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: contentRef,
    offset: ["start 5%", "end 85%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  const toggleExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  if (groups.length === 0) {
    return (
      <div className="p-8 text-center border-4 border-black dark:border-white bg-white/90 dark:bg-zinc-900/90 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]">
        <Clock className="h-10 w-10 mx-auto mb-3 text-black dark:text-white" />
        <p className="text-base font-black uppercase tracking-tight text-foreground">
          Nenhum registro encontrado
        </p>
      </div>
    );
  }

  return (
    <div ref={contentRef} className={cn("relative w-full max-w-full font-sans py-2 select-none overflow-hidden min-w-0", className)}>
      {/* ══ TRILHO VERTICAL FIXO 3PX ══ */}
      {/* Posição exata: Horário (68px) + Gap (8px) + Metade do Círculo (18px) = 94px */}
      <div
        style={{ height: `${Math.max(height - 30, 80)}px` }}
        className="absolute left-[93px] top-4 w-[3px] bg-black/40 dark:bg-white/40 z-0"
      >
        <motion.div
          style={{ height: heightTransform, opacity: opacityTransform }}
          className="absolute inset-x-0 top-0 w-[3px] bg-amber-400 dark:bg-yellow-400"
        />
      </div>

      <div className="space-y-5 sm:space-y-6 relative z-10 w-full max-w-full min-w-0">
        {visibleGroups.map((group) => {
          const isReturned = group.status === "devolvido";
          const isOverdue = group.status === "atrasado";
          const isBatch = group.loans.length > 1;
          const isExpanded = !!expandedGroups[group.groupKey];

          const loanDateStr = format(new Date(group.loanDate), "dd/MM/yyyy", { locale: ptBR });
          const loanTimeStr = format(new Date(group.loanDate), "HH:mm", { locale: ptBR });
          const returnDateStr = group.returnDate
            ? format(new Date(group.returnDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            : null;

          const maxVisibleChips = 6;
          const visibleChromebooks = isExpanded
            ? group.chromebooks
            : group.chromebooks.slice(0, maxVisibleChips);
          const hiddenCount = group.chromebooks.length - maxVisibleChips;

          return (
            <div
              key={group.groupKey}
              className="flex items-start gap-2 w-full max-w-full min-w-0 overflow-hidden group transition-all duration-200"
            >
              {/* 1) COLUNA DE HORA + DATA (LARGURA AMPLIA COM CONTORNO BRANCO ACENTUADO) */}
              <div className="w-[82px] shrink-0 text-right pt-1 pr-1 flex flex-col justify-center">
                <span className="text-lg sm:text-xl font-black font-mono leading-none tracking-tight text-outline-white">
                  {loanTimeStr}
                </span>
                <span className="text-xs sm:text-sm font-black font-mono leading-tight mt-1 text-outline-white">
                  {loanDateStr}
                </span>
              </div>

              {/* 2) MARCADOR CIRCULAR (36PX + SOMBRA 3PX) */}
              <div className="relative shrink-0 z-20 mt-1">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full border-[3px] border-black dark:border-white flex items-center justify-center transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]",
                    isReturned
                      ? "bg-emerald-500 text-white"
                      : isOverdue
                      ? "bg-red-500 text-white"
                      : "bg-amber-400 text-black"
                  )}
                >
                  {isReturned ? (
                    <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                  ) : isOverdue ? (
                    <AlertTriangle className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <Clock className="h-4 w-4 stroke-[3]" />
                  )}
                </div>

                {isBatch && (
                  <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[9px] font-black border border-black px-1 rounded-none shadow-[1px_1px_0px_0px_#000]">
                    x{group.loans.length}
                  </span>
                )}
              </div>

              {/* 3) HASTE HORIZONTAL (2PX PRETO, 14PX) */}
              <div className="w-3.5 h-[2px] bg-black dark:bg-white shrink-0 mt-5" />

              {/* 4) CARD NEO-BRUTALISTA EXPANDIDO */}
              <article
                className={cn(
                  "flex-1 min-w-0 w-full max-w-full overflow-hidden border-[3px] border-black dark:border-white p-3.5 sm:p-4 rounded-none transition-all duration-200 space-y-2.5 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]",
                  isReturned
                    ? "bg-[#F0FDF4] dark:bg-emerald-950/80"
                    : isOverdue
                    ? "bg-[#FEF2F2] dark:bg-red-950/80"
                    : "bg-[#FFFBEA] dark:bg-yellow-950/80"
                )}
              >
                {/* LINHA SUPERIOR: E-MAIL E BADGES */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b-2 border-black/10 dark:border-white/10 pb-2.5 min-w-0 w-full">
                  <div className="min-w-0 space-y-0.5 flex-1 pr-1">
                    <div className="flex items-center gap-1.5 min-w-0 w-full">
                      <User className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
                      <h3 className="text-xs sm:text-sm font-black font-mono uppercase text-foreground tracking-tight break-all min-w-0 leading-snug">
                        {group.email}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pl-5">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground break-words min-w-0">
                        {group.name}{group.ra ? ` • RA: ${group.ra}` : ""}
                      </span>
                      <span className="text-[9px] font-black uppercase bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 border border-black">
                        {group.userType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-start sm:justify-end">
                    {isBatch && (
                      <Badge className="font-black uppercase text-[9px] border-2 border-black bg-violet-600 text-white rounded-none shadow-[2px_2px_0px_0px_#000] px-1.5 py-0.5">
                        <Layers className="h-3 w-3 mr-1" /> LOTE × {group.loans.length}
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "font-black uppercase text-[10px] border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] px-2 py-0.5",
                        isReturned
                          ? "bg-emerald-500 text-white"
                          : isOverdue
                          ? "bg-red-500 text-white"
                          : "bg-amber-400 text-black"
                      )}
                    >
                      {group.status}
                    </Badge>
                  </div>
                </div>

                {/* EQUIPAMENTOS CHIPS (APENAS ID, SEM MODELO, FUNDO CLARO E LIMPO) */}
                <div className="space-y-1.5 pt-0.5 min-w-0 w-full overflow-hidden">
                  <div className="flex items-center gap-1 text-[11px] font-black uppercase text-foreground">
                    <Monitor className="h-3.5 w-3.5 shrink-0" />
                    <span>Equipamentos ({group.chromebooks.length}):</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-w-0 w-full">
                    {visibleChromebooks.map((cb, ci) => (
                      <Badge
                        key={`${cb.id}-${ci}`}
                        variant="outline"
                        className="bg-yellow-200 text-black dark:bg-yellow-400 dark:text-black border-2 border-black font-mono font-black text-xs px-2 py-0.5 rounded-none shadow-[2px_2px_0px_0px_#000]"
                      >
                        {cb.id}
                      </Badge>
                    ))}

                    {hiddenCount > 0 && !isExpanded && (
                      <button
                        onClick={() => toggleExpand(group.groupKey)}
                        className="bg-white hover:bg-yellow-100 text-black border-2 border-black font-black text-xs px-2 py-0.5 rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      >
                        +{hiddenCount} outros
                      </button>
                    )}
                  </div>

                  {group.purpose && (
                    <div className="flex items-start gap-1.5 text-[11px] font-mono text-foreground/90 bg-white/90 dark:bg-black/80 p-2 border-2 border-black/20 dark:border-white/20 mt-1 min-w-0">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="font-bold uppercase break-words min-w-0 overflow-hidden">{group.purpose}</span>
                    </div>
                  )}

                  {/* DATAS E REGISTRO */}
                  <div className="grid grid-cols-1 gap-1 pt-1.5 text-[10px] font-mono border-t border-dashed border-black/20 dark:border-white/20">
                    <div className="flex items-center gap-1.5 text-black dark:text-white font-bold bg-black/5 dark:bg-white/10 p-1.5 border border-black/20">
                      <Clock className="h-3 w-3 text-blue-600 shrink-0" />
                      <span className="break-all min-w-0">RETIRADA: {format(new Date(group.loanDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    {returnDateStr && (
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-500/20 p-1.5 border border-emerald-500/40">
                        <RotateCcw className="h-3 w-3 shrink-0" />
                        <span className="break-all min-w-0">DEVOLVIDO: {returnDateStr}</span>
                      </div>
                    )}
                  </div>

                  {group.createdByEmail && (
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider pt-0.5">
                      • Registrado por: <span className="text-foreground font-black break-all">{group.createdByEmail}</span>
                    </p>
                  )}
                </div>
              </article>
            </div>
          );
        })}

        {/* CARREGAR MAIS REGISTROS */}
        {groups.length > visibleLimit && (
          <div className="text-center pt-3 pl-[80px]">
            <Button
              onClick={() => setVisibleLimit(prev => prev + 30)}
              variant="outline"
              className="font-black uppercase text-xs border-2 border-black dark:border-white bg-yellow-300 text-black hover:bg-yellow-400 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] px-5 py-1.5 rounded-none gap-1.5"
            >
              <ChevronDown className="h-4 w-4 stroke-[3]" />
              Carregar Mais ({groups.length - visibleLimit} restantes)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ZeloteTimeline;
