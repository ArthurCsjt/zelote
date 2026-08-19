"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Monitor, User, UserCheck, Clock, CheckCircle2, AlertTriangle, RotateCcw, BookOpen, Layers, ChevronDown } from "lucide-react";
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
  onSelectEmail?: (email: string) => void;
}

interface LoanGroup {
  groupKey: string;
  email: string;
  name: string;
  ra?: string;
  userType: string;
  loanDate: string;
  status: string;
  chromebooks: { id: string; model?: string; returned?: boolean }[];
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
      group.chromebooks.push({
        id: loan.chromebook_id,
        model: loan.chromebook_model ?? undefined,
        returned: Boolean(loan.return_date) || loan.status === 'devolvido',
      });
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

export function ZeloteTimeline({ history, searchTerm = "", statusFilter = "all", containerRef, className, onSelectEmail }: ZeloteTimelineProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [visibleLimit, setVisibleLimit] = useState(30);
  const [dateFilter, setDateFilter] = useState<string>("all"); // "all" | "today" | "yesterday" | "this_week"

  // Usuários com empréstimo ativo no momento, ordenados por empréstimo mais antigo
  const activeUsers = useMemo(() => {
    const activeMap = new Map<string, string>(); // email -> oldest loan_date
    for (const item of history) {
      if (item.status === 'ativo' || item.status === 'atrasado') {
        const email = item.student_email;
        if (!email) continue;
        const existing = activeMap.get(email);
        if (!existing || item.loan_date < existing) {
          activeMap.set(email, item.loan_date);
        }
      }
    }
    // Ordenar pelo empréstimo mais antigo primeiro
    return Array.from(activeMap.entries())
      .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime())
      .map(([email]) => email);
  }, [history]);

  const filteredHistory = useMemo(() => {
    let result = history;

    // Filtro por texto de busca
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(item =>
        item.student_email?.toLowerCase().includes(term) ||
        item.student_name?.toLowerCase().includes(term) ||
        item.chromebook_id?.toLowerCase().includes(term) ||
        item.purpose?.toLowerCase().includes(term)
      );
    }

    // Filtro por status
    if (statusFilter !== "all") {
      result = result.filter(item => item.status === statusFilter);
    }

    // Filtro rápido de Data (Hoje / Ontem / Esta Semana)
    if (dateFilter !== "all") {
      result = result.filter(item => {
        const itemDate = new Date(item.loan_date);
        const returnDate = item.return_date ? new Date(item.return_date) : null;

        if (dateFilter === "today") {
          return isToday(itemDate) || (returnDate && isToday(returnDate));
        }
        if (dateFilter === "yesterday") {
          return isYesterday(itemDate) || (returnDate && isYesterday(returnDate));
        }
        if (dateFilter === "this_week") {
          return isThisWeek(itemDate, { locale: ptBR }) || (returnDate && isThisWeek(returnDate, { locale: ptBR }));
        }
        return true;
      });
    }

    return result;
  }, [history, searchTerm, statusFilter, dateFilter]);

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

  // Framer motion scroll container tracking com animação suave (linear)
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: contentRef,
    offset: ["start 10%", "end 90%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  const toggleExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Quebra inteligente de e-mail (insere quebra preferencial antes do @)
  const formatEmailWithSoftBreak = (email: string) => {
    if (!email) return "";
    return email.replace("@", "\u200B@");
  };

  const handlePillClick = (email: string) => {
    if (!onSelectEmail) return;
    const currentTerm = searchTerm.trim().toLowerCase();
    if (currentTerm === email.toLowerCase()) {
      onSelectEmail("");
    } else {
      onSelectEmail(email);
    }
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div ref={contentRef} className={cn("relative w-full max-w-full font-sans pt-0 pb-1 select-none overflow-hidden min-w-0", className)}>
      {/* ══ ATALHO DISCRETO DE USUÁRIOS COM EMPRÉSTIMOS ATIVOS ══ */}
      {activeUsers.length > 0 && (
        <div className="flex items-center gap-2 px-1 mt-0 mb-3 z-30 relative min-w-0">
          <span className="text-[10px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase shrink-0 tracking-wider">
            ATIVOS AGORA:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1 scroll-smooth">
            {activeUsers.map((email) => {
              const isSelected = searchTerm.trim().toLowerCase() === email.toLowerCase();
              return (
                <button
                  key={email}
                  onClick={() => handlePillClick(email)}
                  aria-pressed={isSelected}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10.5px] font-normal transition-all duration-150 shrink-0 border cursor-pointer select-none",
                    isSelected
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-semibold"
                      : "bg-[#F3F4F6] dark:bg-zinc-800/80 text-[#374151] dark:text-zinc-300 border-[#E5E7EB] dark:border-zinc-700 hover:bg-[#E5E7EB] dark:hover:bg-zinc-700"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    isSelected ? "bg-amber-400 dark:bg-amber-500" : "bg-[#FFC700]"
                  )} />
                  <span className="truncate max-w-[130px] sm:max-w-[160px]">
                    {email.split("@")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ BARRA DE FILTROS RÁPIDOS DE DATA (PILLS LEVES) + CONTADOR ══ */}
      <div className="flex items-center justify-between gap-1.5 px-1 mb-4 flex-wrap z-30 relative">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "all", label: "TODOS" },
            { id: "today", label: "HOJE" },
            { id: "yesterday", label: "ONTEM" },
            { id: "this_week", label: "ESTA SEMANA" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setDateFilter(btn.id)}
              className={cn(
                "h-7 px-3 text-[10px] font-bold uppercase rounded-full transition-all duration-150 border",
                dateFilter === btn.id
                  ? "bg-amber-400 text-black border-black font-black shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded-sm">
          {filteredHistory.length} {filteredHistory.length === 1 ? 'registro' : 'registros'}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="p-8 text-center border-4 border-black dark:border-white bg-white/90 dark:bg-zinc-900/90 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] my-4">
          <Clock className="h-10 w-10 mx-auto mb-3 text-black dark:text-white" />
          <p className="text-base font-black uppercase tracking-tight text-foreground">
            Nenhum registro encontrado
          </p>
        </div>
      ) : (
        <>
          {/* ══ TRILHO VERTICAL FIXO + PROGRESSO DE SCROLL COM FADE NAS EXTREMIDADES ══ */}
          {/* Posição exata: Alinhado ao centro do stem conector (left-[107px]) */}
          <div
            style={{ height: `${Math.max(height - 32, 80)}px` }}
            className="absolute left-[107px] top-10 w-[3px] bg-zinc-300 dark:bg-zinc-700 z-0 [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]"
          >
            <motion.div
              style={{ height: heightTransform, opacity: opacityTransform }}
              transition={{ ease: "linear" }}
              className="absolute inset-x-0 top-0 w-[3px] bg-amber-500 dark:bg-yellow-400"
            />
          </div>

          <div className="space-y-6 relative z-10 w-full max-w-full min-w-0">
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
                  {/* ══ HORA E DATA: BADGE NEO-BRUTALISTA REFINADO ══ */}
                  <div className="w-[98px] shrink-0 text-right pr-1 pt-0.5 flex flex-col items-end justify-center select-none">
                    <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-1.5 shadow-[2.5px_2.5px_0px_0px_#000] dark:shadow-[2.5px_2.5px_0px_0px_#fff] text-center w-full transition-transform group-hover:scale-[1.02]">
                      <div className="text-base sm:text-lg font-black font-mono tabular-nums leading-none tracking-tight text-black dark:text-white">
                        {loanTimeStr}
                      </div>
                      <div className="text-[10px] font-extrabold font-mono text-zinc-600 dark:text-zinc-400 mt-1 uppercase tracking-wider border-t border-zinc-200 dark:border-zinc-800 pt-0.5">
                        {loanDateStr}
                      </div>
                    </div>
                  </div>

                  {/* NÓ DISCRETO DE CONEXÃO NO TRILHO */}
                  <div className="relative shrink-0 z-20 mt-3.5 -ml-1">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-black dark:border-white bg-amber-400 dark:bg-amber-500 shadow-[1px_1px_0px_0px_#000]" />
                  </div>

                  {/* HASTE HORIZONTAL */}
                  <div className="w-3 h-[2px] bg-black dark:bg-white shrink-0 mt-5" />

                  {/* CARD NEO-BRUTALISTA REORGANIZADO EM 3 ZONAS */}
                  <article
                    className={cn(
                      "flex-1 min-w-0 w-full max-w-full overflow-hidden border-[3px] border-black dark:border-white p-3.5 sm:p-4 rounded-none transition-all duration-200 space-y-3 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#fff] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]",
                      isReturned
                        ? "bg-[#F0FDF4] dark:bg-emerald-950"
                        : isOverdue
                        ? "bg-[#FEF2F2] dark:bg-red-950"
                        : "bg-[#FFFBEA] dark:bg-yellow-950"
                    )}
                  >
                    {/* ══ ZONA 1: IDENTIFICAÇÃO (QUEM) ══ */}
                    <div className="space-y-1.5 min-w-0 w-full">
                      {/* LINHA 1: E-MAIL E BADGES DE STATUS */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 min-w-0 w-full">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                          <User className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
                          <h3 className="text-[13px] font-black font-mono uppercase text-foreground tracking-tight break-words min-w-0 leading-snug">
                            {formatEmailWithSoftBreak(group.email)}
                          </h3>
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

                      {/* LINHA 2: NOME COMPLETO + CARGO NA MESMA LINHA */}
                      <div className="flex items-center gap-2 flex-wrap pl-5">
                        <span className="text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 break-words min-w-0">
                          {group.name}{group.ra ? ` • RA: ${group.ra}` : ""}
                        </span>
                        <span className="text-[9px] font-black uppercase bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 border border-black">
                          {group.userType}
                        </span>
                      </div>
                    </div>

                    {/* DIVISOR FINO ZONA 1 -> ZONA 2 */}
                    <div className="border-t border-zinc-200 dark:border-zinc-800/80 my-2" />

                    {/* ══ ZONA 2: EQUIPAMENTOS (O QUÊ) - CHIPS EM OUTLINE ══ */}
                    <div className="space-y-2 min-w-0 w-full overflow-hidden">
                      <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        <Monitor className="h-3 w-3 shrink-0 text-zinc-600 dark:text-zinc-400" />
                        <span>EQUIPAMENTOS ({group.chromebooks.length}):</span>
                      </div>

                      {/* CHIPS DE EQUIPAMENTO EM OUTLINE (PREENCHIMENTO BRANCO / BORDA PRETA) */}
                      <div className="flex flex-wrap gap-1.5 min-w-0 w-full">
                        {visibleChromebooks.map((cb, ci) => (
                          <Badge
                            key={`${cb.id}-${ci}`}
                            variant="outline"
                            className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white text-black dark:text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-sm shadow-none"
                          >
                            {cb.id}
                          </Badge>
                        ))}

                        {hiddenCount > 0 && !isExpanded && (
                          <button
                            onClick={() => toggleExpand(group.groupKey)}
                            className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-bold text-xs px-2.5 py-0.5 rounded-sm border border-black dark:border-zinc-400 transition-all"
                          >
                            +{hiddenCount} outros
                          </button>
                        )}
                      </div>

                      {group.purpose && (
                        <div className="flex items-start gap-1.5 text-[11px] font-mono text-foreground/90 bg-zinc-50 dark:bg-zinc-900/90 p-2 border border-zinc-200 dark:border-zinc-800 mt-2 min-w-0 rounded-sm">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="font-bold uppercase break-words min-w-0 overflow-hidden">{group.purpose}</span>
                        </div>
                      )}
                    </div>

                    {/* DIVISOR FINO ZONA 2 -> ZONA 3 */}
                    <div className="border-t border-zinc-200 dark:border-zinc-800/80 my-2" />

                    {/* ══ ZONA 3: METADADOS DE AUDITORIA (RÓTULOS COM ALTO CONTRASTE GRAY-700) ══ */}
                    <div className="bg-zinc-100/90 dark:bg-zinc-900/90 p-2.5 rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center gap-2 text-black dark:text-white font-bold">
                        <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase">RETIRADA:</span>
                        <span>{format(new Date(group.loanDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>

                      {returnDateStr && (
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">DEVOLVIDO:</span>
                          <span>{returnDateStr}</span>
                        </div>
                      )}

                      {group.createdByEmail && (
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                          <UserCheck className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" />
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase">REGISTRADO POR:</span>
                          <span className="font-bold text-foreground break-all">{group.createdByEmail}</span>
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              );
            })}

            {/* CARREGAR MAIS REGISTROS */}
            {groups.length > visibleLimit && (
              <div className="text-center pt-3 pl-[90px]">
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
        </>
      )}
    </div>
  );
}

export default ZeloteTimeline;
