import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Clock, Monitor, User, CheckCircle, AlertTriangle, Search, Filter, X, RotateCcw } from "lucide-react";
import type { LoanHistoryItem } from "@/types/database";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";

interface LoanHistoryProps {
  history: LoanHistoryItem[];
  isNewLoan: (loan: LoanHistoryItem) => boolean; // NOVO PROP
}

export function LoanHistory({ history, isNewLoan }: LoanHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
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
        return { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100", cardClass: "border-green-200/50" };
      case 'atrasado':
        return { variant: "destructive", className: "", cardClass: "border-red-300 bg-red-50/50 shadow-lg" };
      case 'ativo':
      default:
        return { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", cardClass: "border-yellow-200/50" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Histórico de Empréstimos</h2>
        <Badge variant="secondary">{filteredHistory.length} / {history.length}</Badge>
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
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>

          {/* Filtro de Status */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
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
          <Select value={userTypeFilter} onValueChange={(v) => { setUserTypeFilter(v); setCurrentPage(1); }}>
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

      {filteredHistory.length === 0 ? (
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
            const { variant, className, cardClass } = getStatusBadgeProps(loan.status);
            const isReturned = loan.status === 'devolvido';
            const returnedByDifferentUser = isReturned && 
              loan.returned_by_email && 
              loan.returned_by_email !== loan.student_email;
            
            const isRecent = isNewLoan(loan); // Usando a função passada via prop

            return (
              <GlassCard 
                key={loan.id} 
                className={`hover:shadow-md transition-shadow ${cardClass}`} // Aplicando a classe do card
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg">{loan.student_name}</h3>
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
                          <Badge className="bg-blue-500 text-white hover:bg-blue-500 text-xs">
                            NOVO
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info badges */}
                    <div className="flex flex-wrap gap-2">
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
                    <div className="text-sm">
                      <span className="font-medium">Finalidade: </span>
                      <span>{loan.purpose}</span>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                      {/* Empréstimo */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">Empréstimo realizado</span>
                          </div>
                          <span className="text-sm text-green-700">
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
                              <span className={`font-medium ${
                                returnedByDifferentUser ? 'text-orange-800' : 'text-blue-800'
                              }`}>
                                Devolução realizada
                              </span>
                            </div>
                            <span className={`text-sm ${
                              returnedByDifferentUser ? 'text-orange-700' : 'text-blue-700'
                            }`}>
                              {format(new Date(loan.return_date), "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>
                          
                          {returnedByDifferentUser && loan.returned_by_name && (
                            <div className="mt-2 pt-2 border-t border-orange-200">
                              <div className="text-sm text-orange-700">
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