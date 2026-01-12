import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Clock, Monitor, User, CheckCircle, AlertTriangle, Search, X, RotateCcw, CalendarX, List, LayoutGrid } from "lucide-react";
import type { LoanHistoryItem } from "@/types/database";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
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
        <div className="grid gap-4">
          {paginatedHistory.map((loan) => {
            const { className, cardClass } = getStatusBadgeProps(loan.status);
            const isReturned = loan.status === 'devolvido';
            const returnedByDifferentUser = isReturned &&
              loan.returned_by_email &&
              loan.returned_by_email !== loan.student_email;

            const isRecent = isNewLoan(loan);
            const isLateReturn = isReturned && loan.expected_return_date && new Date(loan.return_date!) > new Date(loan.expected_return_date);

            return (
              <div
                key={loan.id}
                className={cn(
                  "neo-card p-6 border-l-8 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000]",
                  cardClass
                )}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-500 dark:bg-violet-600 border-2 border-black dark:border-white">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg uppercase">{loan.student_name}</h3>
                        <p className="text-sm font-bold text-muted-foreground">{loan.student_email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={className}>
                        {loan.status.toUpperCase()}
                      </Badge>
                      {isRecent && (
                        <Badge className="bg-blue-500 dark:bg-blue-600 text-white border-2 border-blue-700 dark:border-blue-400 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-black">
                          NOVO
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Info badges */}
                  <div className="flex flex-wrap gap-2">
                    {loan.student_ra && (
                      <Badge className="bg-white dark:bg-zinc-900 text-black dark:text-white border-2 border-black dark:border-white font-bold uppercase">
                        RA: {loan.student_ra}
                      </Badge>
                    )}
                    <Badge className="bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100 border-2 border-violet-600 font-bold uppercase">
                      <Monitor className="h-3 w-3 mr-1" />
                      {loan.chromebook_id}
                    </Badge>
                    {loan.chromebook_model && (
                      <Badge className="bg-white dark:bg-zinc-900 text-black dark:text-white border-2 border-black dark:border-white font-bold uppercase">
                        {loan.chromebook_model}
                      </Badge>
                    )}
                    <Badge className="bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white border-2 border-black dark:border-white font-bold uppercase">
                      {loan.user_type}
                    </Badge>
                    {loan.loan_type === 'lote' && (
                      <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border-2 border-amber-600 font-bold uppercase">
                        LOTE
                      </Badge>
                    )}
                    {loan.reservation_id && (
                      <Badge className="bg-indigo-500 text-white border-2 border-indigo-700 font-bold uppercase">
                        <Clock className="h-3 w-3 mr-1" />
                        RESERVA
                      </Badge>
                    )}
                  </div>

                  {/* Purpose */}
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white">
                    <span className="font-black uppercase text-xs">Finalidade/Aula: </span>
                    <span className="font-bold">{loan.purpose}</span>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    {/* Empréstimo */}
                    <div className="neo-card bg-green-50 dark:bg-green-950 border-l-4 border-l-green-600 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-black uppercase text-sm">Empréstimo</span>
                        </div>
                        <span className="text-sm font-bold">
                          {format(new Date(loan.loan_date), "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      </div>

                      {/* Email de quem realizou o empréstimo */}
                      {loan.created_by_email && (
                        <div className="mt-2 pt-2 border-t-2 border-green-600/30 text-sm">
                          <span className="font-black uppercase text-xs">Registrado por: </span>
                          <span className="font-bold">{loan.created_by_email}</span>
                        </div>
                      )}

                      {loan.expected_return_date && (
                        <div className="mt-2 pt-2 border-t-2 border-green-600/30 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarX className="h-4 w-4" />
                            <span className="font-black uppercase text-xs">Prazo:</span>
                          </div>
                          <span className="font-bold">
                            {format(new Date(loan.expected_return_date), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Devolução */}
                    {isReturned && loan.return_date && (
                      <div className={cn(
                        "neo-card border-l-4 p-3",
                        isLateReturn
                          ? 'bg-red-50 dark:bg-red-950 border-l-red-600'
                          : 'bg-blue-50 dark:bg-blue-950 border-l-blue-600'
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isLateReturn ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <RotateCcw className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="font-black uppercase text-sm">
                              {isLateReturn ? 'Devolvido (Atrasado)' : 'Devolvido'}
                            </span>
                          </div>
                          <span className="text-sm font-bold">
                            {format(new Date(loan.return_date), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>

                        {(returnedByDifferentUser || loan.return_notes || loan.returned_by_email) && (
                          <div className="mt-2 pt-2 border-t-2 border-black/10 dark:border-white/10 space-y-1">
                            {returnedByDifferentUser && loan.returned_by_name && (
                              <div className="text-sm">
                                <span className="font-black uppercase text-xs">Devolvido por: </span>
                                <span className="font-bold">{loan.returned_by_name}</span>
                              </div>
                            )}
                            {loan.returned_by_email && (
                              <div className="text-sm">
                                <span className="font-black uppercase text-xs">Email: </span>
                                <span className="font-bold">{loan.returned_by_email}</span>
                              </div>
                            )}
                            {loan.return_registered_by_email && (
                              <div className="text-sm">
                                <span className="font-black uppercase text-xs">Registrado por: </span>
                                <span className="font-bold">{loan.return_registered_by_email}</span>
                              </div>
                            )}
                            {loan.return_notes && (
                              <div className="text-sm">
                                <span className="font-black uppercase text-xs">Obs: </span>
                                <span className="font-bold">{loan.return_notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="neo-card p-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={cn(
                    "neo-btn cursor-pointer font-black uppercase",
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "cursor-pointer font-black",
                      currentPage === page && "neo-btn bg-black dark:bg-white text-white dark:text-black"
                    )}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={cn(
                    "neo-btn cursor-pointer font-black uppercase",
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}