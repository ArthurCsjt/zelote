import { AlertTriangle, Clock, CalendarX, User, Monitor, RefreshCw, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { useOverdueLoans } from "@/hooks/useOverdueLoans";
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard
import { useDatabase } from "@/hooks/useDatabase"; // Importando useDatabase

export function OverdueAlertsPanel() {
  const { overdueLoans, upcomingDueLoans, loading, refresh } = useOverdueLoans();
  const { syncChromebookStatus, forceReturnLoan, loading: dbLoading } = useDatabase(); // Usando forceReturnLoan

  const handleSyncStatus = async (chromebookId: string) => {
    await syncChromebookStatus(chromebookId);
    refresh(); // Atualiza a lista de empréstimos após a sincronização
  };
  
  const handleForceReturn = async (loan: any) => {
    // CRÍTICO: Mapear loan_id para id, pois forceReturnLoan espera LoanHistoryItem
    const loanToReturn = {
        ...loan,
        id: loan.loan_id, // Garante que o ID do empréstimo esteja na propriedade 'id'
    };
    
    const success = await forceReturnLoan(loanToReturn);
    if (success) {
        refresh(); // Atualiza a lista para remover o item devolvido
    }
  };

  if (loading) {
    return (
      <GlassCard>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Verificando prazos...</span>
          </div>
        </CardContent>
      </GlassCard>
    );
  }

  if (overdueLoans.length === 0 && upcomingDueLoans.length === 0) {
    return (
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Clock className="h-5 w-5" />
            Status dos Prazos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-green-600 mb-2">✅</div>
            <p className="text-sm text-muted-foreground">
              Todos os empréstimos estão dentro do prazo
            </p>
          </div>
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Alertas de Devolução
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refresh}
          disabled={loading}
          className="gap-2 bg-white hover:bg-gray-50 dark:bg-card dark:hover:bg-accent dark:text-foreground dark:border-border"
        >
          <Clock className="h-4 w-4" />
          Atualizar Prazos
        </Button>
      </div>
      
      {/* Empréstimos em Atraso */}
      {overdueLoans.length > 0 && (
        <Alert variant="destructive" className="border-red-300 bg-red-50/70 dark:bg-red-950/50 dark:border-red-900">
          <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">
            Empréstimos em Atraso ({overdueLoans.length})
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            <div className="space-y-3 mt-3">
              {overdueLoans.map((loan) => (
                <div 
                  key={loan.loan_id} 
                  className="bg-white rounded-lg p-3 border border-red-200 shadow-sm dark:bg-card dark:border-red-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="font-medium text-gray-800 dark:text-foreground">{loan.student_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="h-3 w-3" />
                        <span>{loan.chromebook_id}</span>
                      </div>
                      <div className="text-xs text-red-600 mt-1 dark:text-red-400">
                        Deveria ter sido devolvido em:{" "}
                        <span className="font-semibold">{format(new Date(loan.expected_return_date), "dd/MM/yyyy 'às' HH:mm")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="destructive" className="ml-2">
                          {loan.days_overdue} {loan.days_overdue === 1 ? 'dia' : 'dias'} atrasado
                        </Badge>
                        <div className="flex gap-1 mt-1">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleForceReturn(loan)}
                                disabled={dbLoading}
                                className="text-xs text-green-600 hover:bg-green-100 h-6 px-2 dark:hover:bg-green-950 dark:text-green-400"
                            >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Devolvido
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleSyncStatus(loan.chromebook_id)}
                                disabled={dbLoading}
                                className="text-xs text-red-500 hover:bg-red-100 h-6 px-2 dark:hover:bg-red-950 dark:text-red-400"
                            >
                                <RefreshCw className={`h-3 w-3 mr-1 ${dbLoading ? 'animate-spin' : ''}`} />
                                Sincronizar
                            </Button>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Empréstimos Próximos ao Vencimento */}
      {upcomingDueLoans.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/50 dark:border-amber-900">
          <CalendarX className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">
            Empréstimos Vencendo em Breve ({upcomingDueLoans.length})
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <div className="space-y-3 mt-3">
              {upcomingDueLoans.map((loan) => (
                <div 
                  key={loan.loan_id} 
                  className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm dark:bg-card dark:border-amber-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="font-medium text-gray-800 dark:text-foreground">{loan.student_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="h-3 w-3" />
                        <span>{loan.chromebook_id}</span>
                      </div>
                      <div className="text-xs text-amber-600 mt-1 dark:text-amber-400">
                        Prazo de devolução:{" "}
                        <span className="font-semibold">{format(new Date(loan.expected_return_date), "dd/MM/yyyy 'às' HH:mm")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="ml-2 border-amber-400 text-amber-700 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700">
                          {loan.days_until_due === 0 ? 'Hoje' : 
                           loan.days_until_due === 1 ? 'Amanhã' : 
                           `${loan.days_until_due} dias`}
                        </Badge>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSyncStatus(loan.chromebook_id)}
                            disabled={dbLoading}
                            className="text-xs text-amber-500 hover:bg-amber-100 h-6 px-2 dark:hover:bg-amber-950 dark:text-amber-400"
                        >
                            <RefreshCw className={`h-3 w-3 mr-1 ${dbLoading ? 'animate-spin' : ''}`} />
                            Sincronizar Status
                        </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </GlassCard>
  );
}