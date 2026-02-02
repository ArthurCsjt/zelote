import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { format } from "date-fns";
import { CheckCircle, Clock, User, Monitor, Target, AlertTriangle, RefreshCw, Computer, List, LayoutGrid, Search, Filter } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";
import type { LoanHistoryItem, ReturnFormData } from "@/types/database";
import { OverdueAlertsPanel } from "./OverdueAlertsPanel";
import { GlassCard } from "./ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { ActiveLoansTable } from "./ActiveLoansTable";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";

interface ActiveLoansProps {
  onNavigateToReturn: (chromebookId: string) => void;
}

type ViewMode = 'cards' | 'table';

export function ActiveLoans({ onNavigateToReturn }: ActiveLoansProps) {
  const { getActiveLoans, loading: dbLoading } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Novos estados para busca e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Buscar dados iniciais e sob demanda
  const fetchActiveLoans = useCallback(async () => {
    setLoading(true);
    try {
      const loans = await getActiveLoans();
      setActiveLoans(loans);
    } catch (error) {
      console.error('Erro ao buscar empréstimos ativos:', error);
    } finally {
      setLoading(false);
    }
  }, [getActiveLoans]);

  useEffect(() => {
    fetchActiveLoans();
  }, [fetchActiveLoans]);

  const handleReturnClick = (loan: LoanHistoryItem) => {
    onNavigateToReturn(loan.chromebook_id);
  };

  // Função para determinar se o empréstimo está em atraso
  const isOverdue = (loan: LoanHistoryItem) => {
    return loan.expected_return_date && new Date(loan.expected_return_date) < new Date();
  };

  // Função para determinar se o empréstimo está próximo do vencimento (próximas 24 horas)
  const isDueSoon = (loan: LoanHistoryItem) => {
    if (!loan.expected_return_date) return false;
    const dueDate = new Date(loan.expected_return_date);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff > 0 && hoursDiff <= 24;
  };

  // Filtragem inteligente
  const filteredLoans = useMemo(() => {
    if (!searchTerm.trim()) return activeLoans;

    const lowerSearch = searchTerm.toLowerCase();
    return activeLoans.filter(loan => {
      const searchable = `
        ${loan.chromebook_id}
        ${loan.student_name}
        ${loan.student_email}
        ${loan.student_ra || ''}
        ${loan.purpose}
      `.toLowerCase();

      return searchable.includes(lowerSearch);
    });
  }, [activeLoans, searchTerm]);

  // Cálculo de paginação
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage);

  // Reset página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return (
    <div className="space-y-3 relative">

      {/* Painel de Alertas de Atraso */}
      <OverdueAlertsPanel />

      {/* Painel de Busca e Filtros - ESTILO NEO-BRUTALISM APRIMORADO */}
      <div className="mb-6 p-6 border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] relative z-10">
        {/* Título do Painel */}
        <div className="flex items-center gap-2 mb-6 pb-3 border-b-2 border-black/10 dark:border-white/10">
          <div className="p-1.5 bg-black dark:bg-white">
            <Filter className="h-4 w-4 text-white dark:text-black" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider">Filtros e Ações</h3>
        </div>

        {/* Linha 1: Campo de Busca */}
        <div className="mb-6">
          <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
            Buscar Empréstimo
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black dark:text-white pointer-events-none z-10" />
            <Input
              placeholder="ID, NOME, EMAIL, RA, FINALIDADE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 uppercase font-mono text-sm border-3 border-black dark:border-white rounded-none h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] bg-white dark:bg-zinc-950 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            />
          </div>
        </div>

        {/* Linha 2: Controles e Ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Esquerda: Resultados e Exibir */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-gray-600 dark:text-gray-400">
                Resultados:
              </span>
              <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-sm font-black text-blue-900 dark:text-blue-100">
                  {filteredLoans.length}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-gray-600 dark:text-gray-400">
                Exibir:
              </span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[80px] h-9 text-xs font-black border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:ring-offset-0 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectItem value="10" className="font-bold">10</SelectItem>
                  <SelectItem value="25" className="font-bold">25</SelectItem>
                  <SelectItem value="50" className="font-bold">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Direita: Botões de Ação */}
          <div className="flex items-center gap-3">
            {/* Seletor de Visualização - REFINADO */}
            <div className="flex items-center border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] h-11">
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  "h-full px-4 flex items-center justify-center transition-all border-r-2 border-black/10 dark:border-white/10",
                  viewMode === 'cards'
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 text-black dark:text-white"
                )}
                aria-label="Visualização em Cards"
                title="Visualização em Cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "h-full px-4 flex items-center justify-center transition-all",
                  viewMode === 'table'
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 text-black dark:text-white"
                )}
                aria-label="Visualização em Tabela"
                title="Visualização em Tabela"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Botão de Atualizar */}
            <Button
              onClick={fetchActiveLoans}
              variant="outline"
              disabled={loading || dbLoading}
              title="Atualizar dados"
              className="h-11 w-11 p-0 border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none bg-yellow-300 hover:bg-yellow-400 dark:bg-yellow-600 dark:hover:bg-yellow-500 transition-all"
            >
              <RefreshCw className={`h-5 w-5 text-black dark:text-white ${loading || dbLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 neo-card bg-gray-50 dark:bg-zinc-900">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground text-sm font-bold uppercase">Buscando dados...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="neo-card p-12 bg-white dark:bg-zinc-900 text-center">
          <Computer className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
          <p className="text-xl font-black uppercase text-foreground mb-2">
            {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum empréstimo ativo'}
          </p>
          <p className="text-sm font-bold text-muted-foreground uppercase">
            {searchTerm ? 'Tente ajustar os termos de busca.' : 'Todos os equipamentos estão no inventário.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Visualização em Tabela */
        <ActiveLoansTable loans={paginatedLoans} onNavigateToReturn={onNavigateToReturn} />
      ) : (
        /* Visualização em Cards (Padrão) */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedLoans.map((loan) => {
            const overdueStatus = isOverdue(loan);
            const dueSoonStatus = isDueSoon(loan);

            return (
              <div
                key={loan.id}
                className={cn("border-4 bg-white dark:bg-zinc-900 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 border-l-[12px]",
                  overdueStatus ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-[6px_6px_0px_0px_rgba(239,68,68,0.3)]' :
                    dueSoonStatus ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-[6px_6px_0px_0px_rgba(245,158,11,0.3)]' :
                      'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)]'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <User className="h-6 w-6 text-black dark:text-white" />
                        <div>
                          <h3 className="font-black text-base text-foreground uppercase tracking-tight">{loan.student_name}</h3>
                          <p className="text-xs font-mono text-muted-foreground">{loan.student_email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {loan.student_ra && (
                          <Badge variant="outline" className="rounded-none border-3 border-black dark:border-white font-bold text-xs">
                            RA: {loan.student_ra}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="rounded-none bg-blue-500 text-white border-3 border-blue-700 font-bold text-xs">
                          <Monitor className="h-3 w-3 mr-1" />
                          {loan.chromebook_id}
                        </Badge>
                        <Badge variant="outline" className="capitalize rounded-none border-dashed border-3 border-black dark:border-white font-bold text-xs">
                          {loan.user_type}
                        </Badge>
                        {loan.loan_type === 'lote' && (
                          <Badge className="rounded-none bg-yellow-400 text-black border-3 border-black font-bold text-xs">
                            Lote
                          </Badge>
                        )}
                        {Boolean(loan.reservation_id) && (
                          <Badge variant="outline" className="rounded-none bg-indigo-600 text-white border-3 border-indigo-900 font-black text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            RESERVA
                          </Badge>
                        )}
                        {/* Status de Atraso */}
                        {overdueStatus && (
                          <Badge variant="destructive" className="gap-1 rounded-none border-3 border-black font-bold text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            EM ATRASO
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-2 border-t-2 border-black/10 dark:border-white/10">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Target className="h-4 w-4" />
                          <span className="font-black uppercase">Finalidade:</span>
                          <span className="font-mono">{loan.purpose}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="font-black uppercase">Emprestado:</span>
                          <span className="font-mono">{format(new Date(loan.loan_date), "dd/MM/yyyy HH:mm")}</span>
                        </div>

                        {/* Mostrar data de devolução esperada se existir */}
                        {loan.expected_return_date && (
                          <div className={`flex items-center gap-2 text-sm font-bold ${overdueStatus ? 'text-red-600 dark:text-red-400' : dueSoonStatus ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                            }`}>
                            <AlertTriangle className={`h-4 w-4`} />
                            <span className="uppercase">
                              {overdueStatus ? 'Limite:' : 'Prazo:'}
                            </span>
                            <span className="font-mono">
                              {format(new Date(loan.expected_return_date), "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleReturnClick(loan)}
                    disabled={loading || dbLoading}
                    className="w-full mt-3 h-12 text-base font-black uppercase bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-4 border-black dark:border-white text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {overdueStatus ? 'REGISTRAR DEVOLUÇÃO (ATRASO)' : 'REGISTRAR DEVOLUÇÃO'}
                  </Button>
                </CardContent>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação - ESTILO NEO-BRUTALISM */}
      {totalPages > 1 && (
        <Pagination className="mt-8 justify-center">
          <PaginationContent className="gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={cn(
                  "border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-900 font-bold uppercase text-xs h-10 px-4",
                  currentPage === 1 ? "pointer-events-none opacity-50 shadow-none" : "cursor-pointer"
                )}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "cursor-pointer border-2 border-black dark:border-white rounded-none h-10 w-10 font-bold",
                    currentPage === page
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
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
                  "border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-900 font-bold uppercase text-xs h-10 px-4",
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50 shadow-none"
                    : "cursor-pointer"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
