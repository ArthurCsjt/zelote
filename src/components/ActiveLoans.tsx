import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { format } from "date-fns";
import { CheckCircle, Clock, User, Monitor, Target, MessageSquare, RefreshCw } from "lucide-react";
import { Separator } from "./ui/separator";
import { ReturnDialog } from "./ReturnDialog";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";
import type { LoanHistoryItem, ReturnFormData } from "@/types/database";

interface ActiveLoansProps {
  loans: LoanHistoryItem[];
  onRefresh: () => void;
}

export function ActiveLoans({ loans, onRefresh }: ActiveLoansProps) {
  const { returnChromebookById, loading } = useDatabase();
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanHistoryItem | null>(null);
  const [returnData, setReturnData] = useState<ReturnFormData>({
    name: "",
    ra: "",
    email: "",
    type: 'individual',
    userType: 'aluno'
  });

  const handleReturnClick = (loan: LoanHistoryItem) => {
    setSelectedLoan(loan);
    setOpenReturnDialog(true);
  };

  const handleReturn = async () => {
    if (!selectedLoan) return;

    if (!returnData.name || !returnData.email) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const success = await returnChromebookById(selectedLoan.chromebook_id, returnData);
    
    if (success) {
      setOpenReturnDialog(false);
      setReturnData({
        name: "",
        ra: "",
        email: "",
        type: 'individual',
        userType: 'aluno'
      });
      setSelectedLoan(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Empréstimos Ativos</h2>
          <Badge variant="secondary">{loans.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loans.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum empréstimo ativo</p>
              <p className="text-sm">Todos os Chromebooks foram devolvidos</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {loans.map((loan) => (
            <Card key={loan.id} className="hover:shadow-md transition-shadow">
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

                      {loan.chromebook_model && (
                        <div className="flex items-center gap-2 text-sm">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Modelo:</span>
                          <span>{loan.chromebook_model}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleReturnClick(loan)}
                    disabled={loading}
                    className="ml-4"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Devolver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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