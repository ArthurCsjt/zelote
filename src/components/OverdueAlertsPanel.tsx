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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Verificando prazos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (overdueLoans.length === 0 && upcomingDueLoans.length === 0) {
    return (
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
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
    <div className="space-y-4">
      {/* Empréstimos em Atraso */}
      {overdueLoans.length > 0 && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-red-800">
            Empréstimos em Atraso ({overdueLoans.length})
          </AlertTitle>
          <AlertDescription className="text-red-700">
            <div className="space-y-3 mt-3">
              {overdueLoans.map((loan) => (
                <div 
                  key={loan.loan_id} 
                  className="bg-white/50 rounded-lg p-3 border border-red-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{loan.student_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Monitor className="h-3 w-3" />
                        <span>{loan.chromebook_id}</span>
                      </div>
                      <div className="text-xs text-red-600">
                        Deveria ter sido devolvido em:{" "}
                        {format(new Date(loan.expected_return_date), "dd/MM/yyyy 'às' HH:mm")}
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
                                className="text-xs text-green-600 hover:bg-green-100 h-6 px-2"
                            >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Devolvido
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleSyncStatus(loan.chromebook_id)}
                                disabled={dbLoading}
                                className="text-xs text-red-500 hover:bg-red-100 h-6 px-2"
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
        <Alert className="border-amber-200 bg-amber-50">
          <CalendarX className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">
            Empréstimos Vencendo em Breve ({upcomingDueLoans.length})
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="space-y-3 mt-3">
              {upcomingDueLoans.map((loan) => (
                <div 
                  key={loan.loan_id} 
                  className="bg-white/50 rounded-lg p-3 border border-amber-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{loan.student_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Monitor className="h-3 w-3" />
                        <span>{loan.chromebook_id}</span>
                      </div>
                      <div className="text-xs text-amber-600">
                        Prazo de devolução:{" "}
                        {format(new Date(loan.expected_return_date), "dd/MM/yyyy 'às' HH:mm")}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="ml-2 border-amber-400 text-amber-700">
                          {loan.days_until_due === 0 ? 'Hoje' : 
                           loan.days_until_due === 1 ? 'Amanhã' : 
                           `${loan.days_until_due} dias`}
                        </Badge>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSyncStatus(loan.chromebook_id)}
                            disabled={dbLoading}
                            className="text-xs text-amber-500 hover:bg-amber-100 h-6 px-2"
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

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refresh}
          disabled={loading}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Atualizar Prazos
        </Button>
      </div>
    </div>