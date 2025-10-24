import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { format } from "date-fns";
import { CheckCircle, Clock, User, Monitor, Target, AlertTriangle, RefreshCw, Computer, List, LayoutGrid } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";
import type { LoanHistoryItem, ReturnFormData } from "@/types/database";
import { OverdueAlertsPanel } from "./OverdueAlertsPanel";
import { GlassCard } from "./ui/GlassCard";
import { useNavigate } from "react-router-dom"; // Importando useNavigate
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"; // Importando ToggleGroup
import { ActiveLoansTable } from "./ActiveLoansTable"; // Importando a nova tabela

interface ActiveLoansProps {
  onNavigateToReturn: (chromebookId: string) => void;
}

type ViewMode = 'cards' | 'table';

export function ActiveLoans({ onNavigateToReturn }: ActiveLoansProps) {
  const { getActiveLoans, loading: dbLoading } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards'); // Novo estado para visualização

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

  return (
    <div className="space-y-6 relative">
      
      {/* Painel de Alertas de Atraso */}
      <OverdueAlertsPanel />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Empréstimos Ativos ({activeLoans.length})
        </h2>
        <div className="flex items-center gap-3">
          {/* Seletor de Visualização */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value: ViewMode) => value && setViewMode(value)}
            className="h-9"
          >
            <ToggleGroupItem value="cards" aria-label="Visualização em Cards" className="h-9 px-3">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Visualização em Tabela" className="h-9 px-3">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Button 
            onClick={fetchActiveLoans}
            variant="outline"
            disabled={loading || dbLoading}
            className="bg-white hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading || dbLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-16 w-16 mx-auto mb-4 text-gray-300 animate-spin" />
          <p className="text-gray-500 text-lg">Carregando empréstimos...</p>
        </div>
      ) : activeLoans.length === 0 ? (
        <GlassCard>
          <CardContent className="py-12">
            <div className="text-center">
              <Computer className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Nenhum empréstimo ativo</p>
            </div>
          </CardContent>
        </GlassCard>
      ) : viewMode === 'table' ? (
        /* Visualização em Tabela */
        <ActiveLoansTable loans={activeLoans} onNavigateToReturn={onNavigateToReturn} />
      ) : (
        /* Visualização em Cards (Padrão) */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeLoans.map((loan) => {
            const overdueStatus = isOverdue(loan);
            const dueSoonStatus = isDueSoon(loan);
            
            return (
              <GlassCard 
                key={loan.id} 
                className={`hover:shadow-lg transition-shadow ${
                  overdueStatus ? 'border-red-400 bg-red-50/50' : 
                  dueSoonStatus ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200/50'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg">{loan.student_name}</h3>
                          <p className="text-sm text-muted-foreground">{loan.student_email}</p>
                        </div>
                      </div>

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
                        <Badge variant="outline" className="capitalize">
                          {loan.user_type}
                        </Badge>
                        {loan.loan_type === 'lote' && (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                            Lote
                          </Badge>
                        )}
                        {/* Status de Atraso */}
                        {overdueStatus && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Em Atraso
                          </Badge>
                        )}
                        {dueSoonStatus && !overdueStatus && (
                          <Badge variant="outline" className="border-amber-400 text-amber-700 gap-1">
                            <Clock className="h-3 w-3" />
                            Vence em Breve
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Finalidade:</span>
                          <span>{loan.purpose}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Emprestado em:</span>
                          <span>{format(new Date(loan.loan_date), "dd/MM/yyyy 'às' HH:mm")}</span>
                        </div>

                        {/* Mostrar data de devolução esperada se existir */}
                        {loan.expected_return_date && (
                          <div className={`flex items-center gap-2 text-sm ${
                            overdueStatus ? 'text-red-600' : dueSoonStatus ? 'text-amber-600' : ''
                          }`}>
                            <AlertTriangle className={`h-4 w-4 ${
                              overdueStatus ? 'text-red-500' : dueSoonStatus ? 'text-amber-500' : 'text-muted-foreground'
                            }`} />
                            <span className="font-medium">
                              {overdueStatus ? 'Deveria ter sido devolvido em:' : 'Prazo de devolução:'}
                            </span>
                            <span className="font-medium">
                              {format(new Date(loan.expected_return_date), "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>
                        )}

                        {loan.chromebook_model && (
                          <div className="flex items-center gap-2 text-sm">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Modelo:</span>
                            <span>{loan.chromebook_model}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleReturnClick(loan)}
                    disabled={loading || dbLoading}
                    className={`w-full mt-4 ${
                      overdueStatus ? 'bg-red-600 hover:bg-red-700' : 
                      dueSoonStatus ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {overdueStatus ? 'Devolver (Atrasado)' : 'Devolver'}
                  </Button>
                </CardContent>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}