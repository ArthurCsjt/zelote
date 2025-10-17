import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Clock, Monitor, User, CheckCircle, AlertTriangle, Search, Filter, X, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { LoanHistoryItem } from "@/types/database";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "./ui/pagination"; // Importando componentes de paginação

interface LoanHistoryProps {
  history: LoanHistoryItem[];
}

export function LoanHistory({ history }: LoanHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  
  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

    // Resetar página para 1 se o filtro mudar
    if (currentPage !== 1 && filtered.length > 0) {
        setCurrentPage(1);
    }

    return filtered;
  }, [history, searchTerm, statusFilter, userTypeFilter]);
  
  // Lógica de Paginação
  const totalItems = filteredHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
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
        return { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" };
      case 'atrasado':
        return { variant: "destructive", className: "" };
      case 'ativo':
      default:
        return { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" };
    }
  };
  
  // Função para renderizar os botões de página (apenas 5 visíveis)
  const renderPageButtons = () => {
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const buttons = [];
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return buttons;
  };


  return (
    <div className="space-y-6 w-full"> {/* Adicionando w-full para garantir que ocupe a largura total */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Histórico de Empréstimos</h2>
        <Badge variant="secondary">{totalItems} registros</Badge>
      </div>

      {/* Painel de Filtros */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Busca */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email, RA ou ID do Chromebook..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro de Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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

      {paginatedHistory.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum registro encontrado</p>
              <p className="text-sm">Ajuste os filtros ou a pesquisa.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedHistory.map((loan) => {
            const { variant, className } = getStatusBadgeProps(loan.status);
            const isReturned = loan.status === 'devolvido';
            const returnedByDifferentUser = isReturned && 
              loan.returned_by_email && 
              loan.returned_by_email !== loan.student_email;

            return (
              <Card 
                key={loan.id} 
                className={`hover:shadow-md transition-shadow ${loan.status === 'atrasado' ? 'border-red-400 bg-red-50/50' : ''}`}
              >
                <CardContent className="p-4 sm:p-6"> {/* Reduzindo padding */}
                  <div className="space-y-3"> {/* Reduzindo espaçamento vertical */}
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-primary" /> {/* Ícone menor */}
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg">{loan.student_name}</h3> {/* Fonte ligeiramente menor */}
                          <p className="text-xs text-muted-foreground">{loan.student_email}</p> {/* Fonte menor */}
                        </div>
                      </div>
                      <Badge 
                        variant={variant}
                        className={className}
                      >
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Info badges */}
                    <div className="flex flex-wrap gap-1.5 text-xs"> {/* Reduzindo espaçamento e fonte */}
                      {loan.student_ra && (
                        <Badge variant="outline">
                          RA: {loan.student_ra}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        <Monitor className="h-3 w-3 mr-1" />
                        {loan.chromebook_id}
                      </Badge>
                      {loan.chromebook_model && (
                        <Badge variant="outline">
                          {loan.chromebook_model}
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {loan.user_type}
                      </Badge>
                      {loan.loan_type === 'lote' && (
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                          Lote
                        </Badge>
                      )}
                    </div>

                    {/* Purpose */}
                    <div className="text-sm pt-1">
                      <span className="font-medium">Finalidade: </span>
                      <span>{loan.purpose}</span>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2 pt-2"> {/* Reduzindo espaçamento vertical */}
                      {/* Empréstimo */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm text-green-800">Empréstimo realizado</span>
                          </div>
                          <span className="text-xs text-green-700"> {/* Fonte menor */}
                            {format(new Date(loan.loan_date), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                      </div>

                      {/* Devolução */}
                      {isReturned && loan.return_date && (
                        <div className={`border rounded-lg p-3 ${
                          returnedByDifferentUser 
                            ? 'bg-orange-50 border-orange-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {returnedByDifferentUser ? (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                              ) : (
                                <RotateCcw className="h-4 w-4 text-blue-600" />
                              )}
                              <span className={`font-medium text-sm ${
                                returnedByDifferentUser ? 'text-orange-800' : 'text-blue-800'
                              }`}>
                                Devolução realizada
                              </span>
                            </div>
                            <span className={`text-xs ${
                              returnedByDifferentUser ? 'text-orange-700' : 'text-blue-700'
                            }`}>
                              {format(new Date(loan.return_date), "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>
                          
                          {returnedByDifferentUser && loan.returned_by_name && (
                            <div className="mt-2 pt-2 border-t border-orange-200">
                              <div className="text-xs text-orange-700"> {/* Fonte menor */}
                                <span className="font-medium">Devolvido por: </span>
                                <span>{loan.returned_by_name}</span>
                                {loan.returned_by_email && (
                                  <span className="text-orange-600"> ({loan.returned_by_email})</span>
                                )}
                              </div>
                            </div>
                          )}

                          {loan.return_notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs text-muted-foreground"> {/* Fonte menor */}
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
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          {/* Items Per Page Selector */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Itens por página:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pagination Controls */}
          <Pagination className="mx-0">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {/* Renderizar botões de página */}
              {renderPageButtons()}

              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          {/* Page Info */}
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}