import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Clock, Monitor, User, CheckCircle, AlertTriangle, Search, Filter, X, RotateCcw, CalendarX, List, LayoutGrid } from "lucide-react";
import type { LoanHistoryItem } from "@/types/database";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { GlassCard } from "./ui/GlassCard";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"; // Importando ToggleGroup
import { LoanHistoryTable } from "./LoanHistoryTable"; // Importando o novo componente de Tabela

interface LoanHistoryProps {
  history: LoanHistoryItem[];
  isNewLoan: (loan: LoanHistoryItem) => boolean; // NOVO PROP
}

type ViewMode = 'cards' | 'table';

export function LoanHistory({ history, isNewLoan }: LoanHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('cards'); // NOVO ESTADO
  const itemsPerPage = 10; // 10 itens por página

  const filteredHistory = useMemo(() => {
    let filtered = history;
    const lowerCaseSearch = searchTerm.toLowerCase();

    // 1. Filtrar por termo de pesquisa
    if (lowerCaseSearch) {
      filtered = filtered.filter(loan => 
        loan.student_name.toLowerCase().includes(lowerCaseSearch) ||
        loan.student_email.toLowerCase().includes(lowerCaseSearch) ||
        (loan.student_ra && loan.student_ra.toLowerCase().includes(lowerCaseSearch)) ||
        (loan.chromebook_id && loan.chromebook_id.toLowerCase().includes(lowerCaseSearch)) ||
        (loan.chromebook_model && loan.chromebook_model.toLowerCase().includes(lowerCaseSearch))
      );
    }

    // 2. Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    // 3. Filtrar por tipo de usuário
    if (userTypeFilter !== "all") {
      filtered = filtered.filter(loan => loan.user_type === userTypeFilter);
    }

    return filtered;
  }, [history, searchTerm, statusFilter, userTypeFilter]);

  // Lógica de Paginação
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
        return { variant: "success", className: "bg-success-bg text-success-foreground hover:bg-success-bg", cardClass: "border-success-bg" };
      case 'atrasado':
        return { variant: "destructive", className: "bg-error-bg text-error-foreground hover:bg-error-bg", cardClass: "border-error-bg bg-error-bg/50 shadow-lg" };
      case 'ativo':
      default:
        return { variant: "warning", className: "bg-warning-bg text-warning-foreground hover:bg-warning-bg", cardClass: "border-warning-bg" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Histórico de Empréstimos</h2>
          <Badge variant="secondary">{filteredHistory.length} / {history.length}</Badge>
        </div>
        
        {/* Seletor de Visualização */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value: ViewMode) => value && setViewMode(value)}
          className="h-9 bg-card border border-border"
        >
          <ToggleGroupItem value="cards" aria-label="Visualização em Cards" className="h-9 px-3">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Visualização em Tabela" className="h-9 px-3">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Painel de Filtros */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Busca */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, RA ou ID do Chromebook..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 bg-input-bg border-input"
            />
          </div>

          {/* Filtro de Status */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="devolvido">Devolvido</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Tipo de Usuário */}
          <Select value={userTypeFilter} onValueChange={(v) => { setUserTypeFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
              <SelectValue placeholder="Tipo de Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Usuários</SelectItem>
              <SelectItem value="aluno">Aluno</SelectItem>
              <SelectItem value="professor">Professor</SelectItem>
              <SelectItem value="funcionario">Funcionário</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Botão Limpar */}
          {(searchTerm || statusFilter !== 'all' || userTypeFilter !== 'all') && (
            <Button variant="outline" size="icon" onClick={clearFilters} title="Limpar Filtros">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </GlassCard>

      {filteredHistory.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum registro encontrado</p>
              <p className="text-sm">Ajuste os filtros ou a pesquisa.</p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Visualização em Tabela */
        <LoanHistoryTable history={paginatedHistory} isNewLoan={isNewLoan} />
      ) : (
        /* Visualização em Cards */
        <div className="grid gap-4">
          {paginatedHistory.map((loan) => {
            const { variant, className, cardClass } = getStatusBadgeProps(loan.status);
            const isReturned = loan.status === 'devolvido';
            const returnedByDifferentUser = isReturned && 
              loan.returned_by_email && 
              loan.returned_by_email !== loan.student_email;
            
            const isRecent = isNewLoan(loan); // Usando a função passada via prop

            // Lógica para verificar se a devolução foi feita após o prazo esperado
            const isLateReturn = isReturned && loan.expected_return_date && new Date(loan.return_date!) > new Date(loan.expected_return_date);

            return (
              <GlassCard 
                key={loan.id} 
                className={`hover:shadow-md transition-shadow border-l-4 border-l-border-strong ${cardClass}`} // Aplicando a classe do card
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{loan.student_name}</h3>
                          <p className="text-sm text-muted-foreground">{loan.student_email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={variant}
                          className={className}
                        >
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </Badge>
                        {isRecent && (
                          <Badge className="bg-info text-info-foreground hover:bg-info text-xs">
                            NOVO
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info badges */}
                    <div className="flex flex-wrap gap-2">
                      {loan.student_ra && (
                        <Badge variant="outline" className="bg-card text-foreground border-border">
                          RA: {loan.student_ra}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-info-bg text-info-foreground hover:bg-info-bg">
                        <Monitor className="h-3 w-3 mr-1" />
                        {loan.chromebook_id}
                      </Badge>
                      {loan.chromebook_model && (
                        <Badge variant="outline" className="bg-card text-foreground border-border">
                          {loan.chromebook_model}
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize bg-card text-foreground border-border">
                        {loan.user_type}
                      </Badge>
                      {loan.loan_type === 'lote' && (
                        <Badge className="bg-warning-bg text-warning-foreground hover:bg-warning-bg">
                          Lote
                        </Badge>
                      )}
                    </div>

                    {/* Purpose */}
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Finalidade: </span>
                      <span>{loan.purpose}</span>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                      {/* Empréstimo */}
                      <div className="bg-success-bg border border-success/50 rounded-lg p-3 dark:bg-success-bg/50 dark:border-success/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span className="font-medium text-success-foreground">Empréstimo realizado</span>
                          </div>
                          <span className="text-sm text-success-foreground">
                            {format(new Date(loan.loan_date), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                        
                        {/* Prazo Esperado */}
                        {loan.expected_return_date && (
                          <div className="mt-2 pt-2 border-t border-success/30 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarX className="h-4 w-4" />
                              <span className="font-medium">Prazo Esperado:</span>
                            </div>
                            <span className="font-medium text-muted-foreground">
                              {format(new Date(loan.expected_return_date), "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Devolução */}
                      {isReturned && loan.return_date && (
                        <div className={`border rounded-lg p-3 ${
                          isLateReturn 
                            ? 'bg-error-bg border-error/50 dark:bg-error-bg/50 dark:border-error/30' 
                            : 'bg-info-bg border-info/50 dark:bg-info-bg/50 dark:border-info/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isLateReturn ? (
                                <AlertTriangle className="h-4 w-4 text-error" />
                              ) : (
                                <RotateCcw className="h-4 w-4 text-info" />
                              )}
                              <span className={`font-medium ${
                                isLateReturn ? 'text-error-foreground' : 'text-info-foreground'
                              }`}>
                                Devolução realizada
                              </span>
                            </div>
                            <span className={`text-sm ${
                              isLateReturn ? 'text-error-foreground' : 'text-info-foreground'
                            }`}>
                              {format(new Date(loan.return_date), "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>
                          
                          {/* Detalhes da Devolução */}
                          {(returnedByDifferentUser || isLateReturn) && (
                            <div className="mt-2 pt-2 border-t border-border space-y-1">
                              {returnedByDifferentUser && loan.returned_by_name && (
                                <div className="text-sm text-warning-foreground">
                                  <span className="font-medium">Devolvido por: </span>
                                  <span>{loan.returned_by_name}</span>
                                  {loan.returned_by_email && (
                                    <span className="text-warning"> ({loan.returned_by_email})</span>
                                  )}
                                </div>
                              )}
                              {isLateReturn && (
                                <div className="text-sm text-error-foreground font-semibold">
                                  ATRASO: Devolvido após o prazo esperado.
                                </div>
                              )}
                            </div>
                          )}

                          {loan.return_notes && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Observações: </span>
                                <span>{loan.return_notes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </GlassCard>
            );
          })}
        </div>
      )}
      
      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                  className="cursor-pointer"
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
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}