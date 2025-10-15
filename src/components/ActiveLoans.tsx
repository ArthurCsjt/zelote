import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { format } from "date-fns";
import { CheckCircle, Clock, User, Monitor, Target, AlertTriangle, RefreshCw, Computer } from "lucide-react";
import { ReturnDialog } from "./ReturnDialog";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";
import type { LoanHistoryItem, ReturnFormData } from "@/types/database";
import { OverdueAlertsPanel } from "./OverdueAlertsPanel";

interface ActiveLoansProps {
  onBack?: () => void;
}

export function ActiveLoans({ onBack }: ActiveLoansProps) {
  const { getActiveLoans, returnChromebookById, bulkReturnChromebooks } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanHistoryItem | null>(null);
  const [returnData, setReturnData] = useState<ReturnFormData>({
    name: "",
    ra: "",
    email: "",
    type: 'individual',
    userType: 'aluno'
  });
  // Estado para armazenar IDs de lote do diálogo de devolução
  const [batchReturnIds, setBatchReturnIds] = useState<string[]>([]);

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
    setSelectedLoan(loan);
    // Preenche os dados do devolvente com os dados do emprestador como padrão
    setReturnData({
      name: loan.student_name,
      email: loan.student_email,
      ra: loan.student_ra || '',
      type: loan.loan_type,
      userType: loan.user_type,
    });
    setOpenReturnDialog(true);
  };

  const handleReturn = async (idsToReturn: string[], data: ReturnFormData) => {
    if (!selectedLoan) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      if (selectedLoan.loan_type === 'lote') {
        // Se for lote, usamos a nova função bulkReturnChromebooks
        const result = await bulkReturnChromebooks(idsToReturn, data);
        successCount = result.successCount;
        errorCount = result.errorCount;
      } else {
        // Se for individual, usamos a função existente
        const success = await returnChromebookById(idsToReturn[0], data);
        if (success) {
          successCount = 1;
        } else {
          errorCount = 1;
        }
      }
      
      if (successCount > 0) {
        setOpenReturnDialog(false);
        setSelectedLoan(null);
        setReturnData({
          name: '',
          email: '',
          ra: '',
          type: 'individual',
          userType: 'aluno'
        });
        
        // Atualiza a lista manualmente após a devolução
        fetchActiveLoans(); 

        toast({
          title: "Sucesso",
          description: `${successCount} Chromebook(s) devolvido(s) com sucesso.`,
        });
      } else if (errorCount > 0) {
        // O erro individual/lote já é toastado dentro do useDatabase
      }
    } catch (error) {
      console.error('Erro ao devolver Chromebook:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar devolução",
        variant: "destructive",
      });
    }
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
    <div className="space-y-6 glass-morphism p-6 animate-fade-in relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-card/30 via-background/20 to-card/30 rounded-3xl blur-2xl transform scale-110" />
      
      {/* Painel de Alertas de Atraso */}
      <OverdueAlertsPanel />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Empréstimos Ativos ({activeLoans.length})
        </h2>
        <Button 
          onClick={fetchActiveLoans}
          variant="outline"
          disabled={loading}
          className="bg-white hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-16 w-16 mx-auto mb-4 text-gray-300 animate-spin" />
          <p className="text-gray-500 text-lg">Carregando empréstimos...</p>
        </div>
      ) : activeLoans.length === 0 ? (
        <div className="text-center py-12">
          <Computer className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">Nenhum empréstimo ativo</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeLoans.map((loan) => {
            const overdueStatus = isOverdue(loan);
            const dueSoonStatus = isDueSoon(loan);
            
            return (
              <Card 
                key={loan.id} 
                className={`hover:shadow-md transition-shadow ${
                  overdueStatus ? 'border-red-200 bg-red-50/30' : 
                  dueSoonStatus ? 'border-amber-200 bg-amber-50/30' : ''
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
                    disabled={loading}
                    className={`w-full mt-4 ${
                      overdueStatus ? 'bg-red-600 hover:bg-red-700' : 
                      dueSoonStatus ? 'bg-amber-600 hover:bg-amber-700' : ''
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {overdueStatus ? 'Devolver (Atrasado)' : 'Devolver'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ReturnDialog
        open={openReturnDialog}
        onOpenChange={setOpenReturnDialog}
        chromebookId={selectedLoan?.chromebook_id || ""}
        onChromebookIdChange={() => {}} // Não editável neste contexto
        returnData={returnData}
        onReturnDataChange={setReturnData}
        onConfirm={handleReturn}
      />
    </div>
  );
}