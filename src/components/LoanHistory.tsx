import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Clock, Monitor, User, CheckCircle, AlertTriangle, Search, X, RotateCcw, CalendarX, List, LayoutGrid, ArrowRight } from "lucide-react";
import type { LoanHistoryItem } from "@/types/database";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { LoanHistoryTable } from "./LoanHistoryTable";
import { cn } from "@/lib/utils";

interface LoanHistoryProps {
  history: LoanHistoryItem[];
  isNewLoan: (loan: LoanHistoryItem) => boolean;
}

type ViewMode = 'cards' | 'table';

export function LoanHistory({ history, isNewLoan }: LoanHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const itemsPerPage = 10;

  const filteredHistory = useMemo(() => {
    let filtered = history;
    const lowerCaseSearch = searchTerm.toLowerCase();

    if (lowerCaseSearch) {
      filtered = filtered.filter(loan =>
        loan.student_name.toLowerCase().includes(lowerCaseSearch) ||
        loan.student_email.toLowerCase().includes(lowerCaseSearch) ||
        (loan.student_ra && loan.student_ra.toLowerCase().includes(lowerCaseSearch)) ||
        (loan.chromebook_id && loan.chromebook_id.toLowerCase().includes(lowerCaseSearch)) ||
        (loan.chromebook_model && loan.chromebook_model.toLowerCase().includes(lowerCaseSearch))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    if (userTypeFilter !== "all") {
      filtered = filtered.filter(loan => loan.user_type === userTypeFilter);
    }

    // Ordenar do mais recente para o mais antigo
    return [...filtered].sort((a, b) =>
      new Date(b.loan_date).getTime() - new Date(a.loan_date).getTime()
    );
  }, [history, searchTerm, statusFilter, userTypeFilter]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setUserTypeFilter("all");
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 3; // Páginas ao redor da atual

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 3; i <= totalPages - 1; i++) pages.push(i);
      } else {
        for (let i = start; i <= end; i++) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const getStatusBadgeProps = (status: LoanHistoryItem['status']) => {
    switch (status) {
      case 'devolvido':
        return {
          className: "bg-green-500 dark:bg-green-600 text-white border-2 border-green-700 dark:border-green-400 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-black uppercase",
          cardClass: "border-l-green-600"
        };
      case 'atrasado':
        return {
          className: "bg-red-500 dark:bg-red-600 text-white border-2 border-red-700 dark:border-red-400 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-black uppercase",
          cardClass: "border-l-red-600"
        };
      case 'ativo':
      default:
        return {
          className: "bg-amber-500 dark:bg-amber-600 text-white border-2 border-amber-700 dark:border-amber-400 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-black uppercase",
          cardClass: "border-l-amber-600"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-500 dark:bg-violet-600 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Histórico Completo</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase">
                {filteredHistory.length} de {history.length} registros
              </p>
            </div>
          </div>

          {/* Seletor de Visualização Neo-Brutal */}
          <div className="neo-view-toggle">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "neo-view-toggle-btn",
                viewMode === 'table' && "neo-view-toggle-btn-active"
              )}
              aria-label="Visualização em Tabela"
            >
              <List className="h-4 w-4" />
              <span>TABELA</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "neo-view-toggle-btn",
                viewMode === 'cards' && "neo-view-toggle-btn-active"
              )}
              aria-label="Visualização em Cards"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>CARDS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="neo-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Busca */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="BUSCAR POR NOME, EMAIL, RA OU ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="neo-input pl-10"
            />
          </div>

          {/* Filtro de Status */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px] neo-input font-bold uppercase">
              <SelectValue placeholder="STATUS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TODOS</SelectItem>
              <SelectItem value="ativo">ATIVO</SelectItem>
              <SelectItem value="devolvido">DEVOLVIDO</SelectItem>
              <SelectItem value="atrasado">ATRASADO</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Tipo de Usuário */}
          <Select value={userTypeFilter} onValueChange={(v) => { setUserTypeFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px] neo-input font-bold uppercase">
              <SelectValue placeholder="TIPO" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TODOS</SelectItem>
              <SelectItem value="aluno">ALUNO</SelectItem>
              <SelectItem value="professor">PROFESSOR</SelectItem>
              <SelectItem value="funcionario">FUNCIONÁRIO</SelectItem>
            </SelectContent>
          </Select>

          {/* Botão Limpar */}
          {(searchTerm || statusFilter !== 'all' || userTypeFilter !== 'all') && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearFilters}
              title="Limpar Filtros"
              className="neo-btn bg-red-500 hover:bg-red-600 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="neo-card p-12">
          <div className="text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-black uppercase mb-2">Nenhum Registro Encontrado</p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Ajuste os filtros ou a pesquisa</p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <LoanHistoryTable history={paginatedHistory} isNewLoan={isNewLoan} />
      ) : (
        <div className="space-y-2">

          {/* ═══ COLUMN HEADERS ═══ */}
          <div className="grid grid-cols-2">
            <div className="flex items-center gap-2 px-4 py-3 bg-black dark:bg-white border-3 border-black dark:border-white border-r-0">
              <CheckCircle className="h-3.5 w-3.5 text-white dark:text-black flex-shrink-0" />
              <span className="text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em] [text-shadow:none]">Empréstimo</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-black dark:bg-white border-3 border-black dark:border-white">
              <RotateCcw className="h-3.5 w-3.5 text-white dark:text-black flex-shrink-0" />
              <span className="text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em] [text-shadow:none]">Devolução</span>
            </div>
          </div>

          {/* ═══ LOAN JOURNEY ROWS ═══ */}
          {paginatedHistory.map((loan) => {
            const { className: statusBadgeClass, cardClass } = getStatusBadgeProps(loan.status);
            const isReturned = loan.status === 'devolvido';
            const isRecent = isNewLoan(loan);
            const isLateReturn = isReturned && loan.expected_return_date && new Date(loan.return_date!) > new Date(loan.expected_return_date);

            return (
              <div
                key={loan.id}
                className="grid grid-cols-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-200 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >

                {/* ══ LEFT SIDE: LOAN ══ */}
                <div className={cn(
                  "border-3 border-black dark:border-white border-r-0 p-4 transition-all duration-300",
                  isReturned
                    ? "bg-zinc-100 dark:bg-zinc-900/60 border-l-[6px] border-l-green-500"
                    : cn("border-l-[6px]", cardClass, "bg-card")
                )}>
                  {isReturned ? (
                    // ── MINI CARD: loan journey completed ──
                    <div className="flex items-center justify-between h-full min-h-[90px] gap-2">
                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-zinc-400 dark:bg-zinc-600 shrink-0">
                            <Monitor className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-black text-sm uppercase tracking-tight">{loan.chromebook_id}</span>
                        </div>
                        <span className="text-xs font-bold uppercase truncate text-foreground/70">{loan.student_name}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {format(new Date(loan.loan_date), "dd/MM/yy HH:mm")}
                        </span>
                        {loan.created_by_email && (
                          <span className="text-[8px] font-bold uppercase text-muted-foreground opacity-60">REGISTRADO POR: {loan.created_by_email}</span>
                        )}
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          <Badge className={cn("text-[8px] rounded-full h-4 px-2 border font-black", statusBadgeClass)}>
                            {loan.status}
                          </Badge>
                          {loan.loan_type === 'lote' && (
                            <Badge className="text-[8px] rounded-full h-4 px-2 bg-amber-100 text-amber-900 border-2 border-amber-500 font-black">LOTE</Badge>
                          )}
                        </div>
                      </div>
                      {/* Arrow pointing right — journey complete */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <ArrowRight className="h-8 w-8 text-green-500 dark:text-green-400" strokeWidth={2.5} />
                      </div>
                    </div>
                  ) : (
                    // ── FULL CARD: active loan ──
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 bg-violet-500 dark:bg-violet-600 border-2 border-black dark:border-white shrink-0">
                            <User className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-sm uppercase truncate">{loan.student_name}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground truncate">{loan.student_email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className={cn("text-[8px] rounded-full border-2 font-black", statusBadgeClass)}>
                            {loan.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {loan.student_ra && (
                          <Badge className="text-[8px] rounded-full h-4 px-2 bg-white dark:bg-zinc-900 text-black dark:text-white border-2 border-black dark:border-white font-bold uppercase">
                            RA: {loan.student_ra}
                          </Badge>
                        )}
                        <Badge className="text-[8px] rounded-full h-4 px-2 bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100 border-2 border-violet-600 font-bold uppercase">
                          <Monitor className="h-2.5 w-2.5 mr-1" />{loan.chromebook_id}
                        </Badge>
                        <Badge className="text-[8px] rounded-full h-4 px-2 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white border-2 border-black dark:border-white font-bold uppercase">
                          {loan.user_type}
                        </Badge>
                        {loan.loan_type === 'lote' && (
                          <Badge className="text-[8px] rounded-full h-4 px-2 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border-2 border-amber-600 font-bold uppercase">LOTE</Badge>
                        )}
                        {loan.reservation_id && (
                          <Badge className="text-[8px] rounded-full h-4 px-2 bg-indigo-500 text-white border-2 border-indigo-700 font-bold uppercase">
                            <Clock className="h-2.5 w-2.5 mr-1" />RESERVA
                          </Badge>
                        )}
                      </div>

                      {loan.purpose && (
                        <div className="px-2 py-1.5 border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-[9px] font-black uppercase text-zinc-500 truncate">
                          {loan.purpose}
                        </div>
                      )}

                      <div className="text-[10px] font-mono">
                        <span className="font-black text-foreground">{format(new Date(loan.loan_date), "dd/MM/yyyy HH:mm")}</span>
                        {loan.created_by_email && (
                          <span className="block text-muted-foreground opacity-60 mt-0.5 font-sans font-bold uppercase text-[8px]">REGISTRADO POR: {loan.created_by_email}</span>
                        )}
                      </div>

                      {loan.expected_return_date && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase">
                          <CalendarX className="h-3 w-3" />
                          <span>Prazo: {format(new Date(loan.expected_return_date), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ══ RIGHT SIDE: RETURN ══ */}
                <div className={cn(
                  "border-3 border-black dark:border-white border-l-0 p-4 transition-all duration-300",
                  isReturned
                    ? cn(
                        "border-l-0",
                        isLateReturn
                          ? "bg-red-50 dark:bg-red-950/40 border-r-[6px] border-r-red-500"
                          : "bg-blue-50 dark:bg-blue-950/40 border-r-[6px] border-r-blue-500"
                      )
                    : "bg-background"
                )}>
                  {isReturned && loan.return_date ? (
                    // ── RETURN INFO ──
                    <div className="space-y-2.5 h-full">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isLateReturn ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
                          )}
                          <span className={cn(
                            "font-black uppercase text-sm",
                            isLateReturn ? "text-red-700 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                          )}>
                            {isLateReturn ? 'Atrasado' : 'Devolvido'}
                          </span>
                        </div>
                        {isLateReturn && (
                          <Badge className="text-[8px] rounded-full bg-red-500 text-white border-2 border-red-700 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">FORA DO PRAZO</Badge>
                        )}
                      </div>

                      <div className="text-[11px] font-mono font-black text-foreground">
                        {format(new Date(loan.return_date), "dd/MM/yyyy HH:mm")}
                      </div>

                      {loan.return_registered_by_email && (
                        <span className="text-[8px] text-muted-foreground font-bold uppercase block">
                          REGISTRADO POR: {loan.return_registered_by_email}
                        </span>
                      )}

                      {loan.returned_by_name && loan.returned_by_email !== loan.student_email && (
                        <div className="text-[9px] font-bold uppercase text-muted-foreground">
                          <span className="font-black">Devolvido por:</span> {loan.returned_by_name}
                        </div>
                      )}

                      {loan.return_notes && (
                        <div className="px-2 py-1.5 border-2 border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 text-[9px] font-bold uppercase text-zinc-500 italic mt-1">
                          "{loan.return_notes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    // ── EMPTY STATE: awaiting return ──
                    <div
                      className="h-full min-h-[90px] flex flex-col items-center justify-center gap-2"
                      style={{
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.018) 10px, rgba(0,0,0,0.018) 20px)'
                      }}
                    >
                      <Clock className="h-5 w-5 opacity-20" />
                      <span className="text-[8px] font-black uppercase tracking-[0.25em] opacity-25">Aguardando</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="neo-card p-4 flex justify-center">
          <Pagination>
            <PaginationContent className="flex-wrap justify-center">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={cn(
                    "neo-btn cursor-pointer font-black uppercase text-[10px] sm:text-xs h-8 sm:h-10 px-2 sm:px-4",
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                >
                  <span className="hidden sm:inline">ANTERIOR</span>
                </PaginationPrevious>
              </PaginationItem>

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis className="h-8 w-8 sm:h-10 sm:w-10" />
                  ) : (
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page as number)}
                      className={cn(
                        "cursor-pointer font-black text-xs sm:text-sm h-8 w-8 sm:h-10 sm:w-10 p-0 flex items-center justify-center",
                        currentPage === page ? "neo-btn bg-black dark:bg-white text-white dark:text-black hover:bg-black/90" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={cn(
                    "neo-btn cursor-pointer font-black uppercase text-[10px] sm:text-xs h-8 sm:h-10 px-2 sm:px-4",
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                >
                  <span className="hidden sm:inline">PRÓXIMO</span>
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}