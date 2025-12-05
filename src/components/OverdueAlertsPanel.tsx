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
      <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <CardContent className="p-0">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-4 border-black border-t-transparent dark:border-white dark:border-t-transparent rounded-full"></div>
            <span className="ml-2 font-mono font-bold uppercase text-sm">Verificando prazos...</span>
          </div>
        </CardContent>
      </div>
    );
  }

  if (overdueLoans.length === 0 && upcomingDueLoans.length === 0) {
    return (
      <div className="border-4 border-black dark:border-white bg-green-100 dark:bg-green-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
        <CardHeader className="border-b-4 border-black dark:border-white p-4">
          <CardTitle className="flex items-center gap-2 font-black uppercase text-green-800 dark:text-green-100">
            <CheckCircle className="h-6 w-6 text-black dark:text-white" />
            Status dos Prazos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="font-mono font-bold text-black dark:text-white uppercase">
              Todos os empréstimos estão em dia!
            </p>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-6 space-y-6">
      <div className="flex justify-between items-center border-b-4 border-black dark:border-white pb-4">
        <h3 className="text-xl font-black text-black dark:text-white flex items-center gap-2 uppercase">
          <AlertTriangle className="h-6 w-6 text-black dark:text-white fill-yellow-400" />
          Alertas de Devolução
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="gap-2 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800 uppercase font-bold text-xs"
        >
          <Clock className="h-4 w-4" />
          Atualizar Prazos
        </Button>
      </div>

      {/* Empréstimos em Atraso */}
      {overdueLoans.length > 0 && (
        <Alert className="border-4 border-black bg-red-100 dark:bg-red-900/50 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <AlertTriangle className="h-5 w-5 text-black" />
          <AlertTitle className="text-black dark:text-white font-black uppercase ml-2">
            Empréstimos em Atraso ({overdueLoans.length})
          </AlertTitle>
          <AlertDescription className="text-black ml-2">
            <div className="space-y-3 mt-3">
              {overdueLoans.map((loan) => (
                <div
                  key={loan.loan_id}
                  className="bg-white dark:bg-zinc-950 p-4 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-black dark:text-white" />
                        <span className="font-bold text-black dark:text-white uppercase">{loan.student_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        <Monitor className="h-3 w-3" />
                        <span>{loan.chromebook_id}</span>
                      </div>
                      <div className="text-xs bg-red-200 dark:bg-red-900 text-black dark:text-white border border-black px-2 py-1 font-bold inline-block mt-1">
                        Devolução esperada: {format(new Date(loan.expected_return_date), "dd/MM HH:mm")}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      <Badge variant="destructive" className="ml-2 rounded-none border-2 border-black bg-red-500 hover:bg-red-600 text-white font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {loan.days_overdue} {loan.days_overdue === 1 ? 'dia' : 'dias'} atrasado
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSyncStatus(loan.chromebook_id)}
                        disabled={dbLoading}
                        className="text-xs border-2 border-black bg-white hover:bg-gray-100 rounded-none h-8 px-3 font-bold uppercase w-full sm:w-auto"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${dbLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
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
        <Alert className="border-4 border-black bg-yellow-100 dark:bg-yellow-900/50 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CalendarX className="h-5 w-5 text-black" />
          <AlertTitle className="text-black dark:text-white font-black uppercase ml-2">
            Vencendo em Breve ({upcomingDueLoans.length})
          </AlertTitle>
          <AlertDescription className="text-black ml-2">
            <div className="space-y-3 mt-3">
              {upcomingDueLoans.map((loan) => (
                <div
                  key={loan.loan_id}
                  className="bg-white dark:bg-zinc-950 p-4 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-black dark:text-white" />
                        <span className="font-bold text-black dark:text-white uppercase">{loan.student_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        <Monitor className="h-3 w-3" />
                        <span>{loan.chromebook_id}</span>
                      </div>
                      <div className="text-xs bg-yellow-200 dark:bg-yellow-900 text-black dark:text-white border border-black px-2 py-1 font-bold inline-block mt-1">
                        Prazo: {format(new Date(loan.expected_return_date), "dd/MM HH:mm")}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      <Badge variant="outline" className="ml-2 rounded-none border-2 border-black bg-yellow-400 text-black font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {loan.days_until_due === 0 ? 'HOJE' :
                          loan.days_until_due === 1 ? 'AMANHÃ' :
                            `${loan.days_until_due} DIAS`}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSyncStatus(loan.chromebook_id)}
                        disabled={dbLoading}
                        className="text-xs border-2 border-black bg-white hover:bg-gray-100 rounded-none h-8 px-3 font-bold uppercase w-full sm:w-auto"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${dbLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}