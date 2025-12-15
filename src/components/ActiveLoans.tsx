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
import { cn } from "@/lib/utils";

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

      {/* Título e Botão de Atualizar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
          <List className="h-6 w-6" />
          Empréstimos Ativos ({activeLoans.length})
        </h3>
        <div className="flex items-center gap-3">
          {/* Seletor de Visualização */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value: ViewMode) => value && setViewMode(value)}
            className="h-10 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]"
          >
            <ToggleGroupItem
              value="cards"
              aria-label="Visualização em Cards"
              className="h-9 px-3 data-[state=on]:bg-black data-[state=on]:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-none border-r border-black/10 last:border-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="table"
              aria-label="Visualização em Tabela"
              className="h-9 px-3 data-[state=on]:bg-black data-[state=on]:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-none"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            onClick={fetchActiveLoans}
            variant="outline"
            disabled={loading || dbLoading}
            className="neo-btn bg-white hover:bg-gray-50 text-black h-10 px-4 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading || dbLoading ? 'animate-spin' : ''}`} />
            ATUALIZAR
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 neo-card bg-gray-50 dark:bg-zinc-900">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground text-sm font-bold uppercase">Buscando dados...</p>
        </div>
      ) : activeLoans.length === 0 ? (
        <div className="neo-card p-12 bg-white dark:bg-zinc-900 text-center">
          <Computer className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
          <p className="text-xl font-black uppercase text-foreground mb-2">Nenhum empréstimo ativo</p>
          <p className="text-sm font-bold text-muted-foreground uppercase">Todos os equipamentos estão no inventário.</p>
        </div>
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
              <div
                key={loan.id}
                className={cn("neo-card hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#000] dark:hover:shadow-[8px_8px_0px_0px_#fff] border-l-4 transition-all duration-200",
                  overdueStatus ? 'border-l-error bg-error-bg/20' :
                    dueSoonStatus ? 'border-l-warning bg-warning-bg/20' : 'border-l-black dark:border-l-white'
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <User className="h-6 w-6 text-black dark:text-white" />
                        <div>
                          <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{loan.student_name}</h3>
                          <p className="text-sm font-mono text-muted-foreground">{loan.student_email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {loan.student_ra && (
                          <Badge variant="outline" className="rounded-none border-2 border-black dark:border-white font-bold">
                            RA: {loan.student_ra}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="rounded-none bg-blue-100 text-blue-800 border-2 border-blue-800 font-bold">
                          <Monitor className="h-3 w-3 mr-1" />
                          {loan.chromebook_id}
                        </Badge>
                        <Badge variant="outline" className="capitalize rounded-none border-dashed border-2 border-black dark:border-white font-bold">
                          {loan.user_type}
                        </Badge>
                        {loan.loan_type === 'lote' && (
                          <Badge className="rounded-none bg-yellow-300 text-black border-2 border-black font-bold">
                            Lote
                          </Badge>
                        )}
                        {/* Status de Atraso */}
                        {overdueStatus && (
                          <Badge variant="destructive" className="gap-1 rounded-none border-2 border-black font-bold">
                            <AlertTriangle className="h-3 w-3" />
                            EM ATRASO
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t-2 border-black/10 dark:border-white/10">
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
                    className="w-full mt-4 neo-btn bg-menu-amber hover:bg-menu-amber-hover border-black dark:border-white text-white"
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
    </div>
  );
}