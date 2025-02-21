
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { toast } from "./ui/use-toast";

export interface ReturnRecord {
  returnedBy: {
    name: string;
    ra?: string;
    email: string;
    type: 'aluno' | 'professor' | 'funcionario';
  };
  returnTime: Date;
  returnType: 'individual' | 'lote';
}

export interface Loan {
  id: string;
  studentName: string;
  ra?: string;
  email: string;
  chromebookId: string;
  purpose: string;
  timestamp: Date;
  userType: 'aluno' | 'professor' | 'funcionario';
  returnRecord?: ReturnRecord;
}

interface ActiveLoansProps {
  loans: Loan[];
  onReturn: (loanId: string, returnData: { name: string; ra: string }) => void;
}

export function ActiveLoans({ loans, onReturn }: ActiveLoansProps) {
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [returnData, setReturnData] = useState({ name: "", ra: "" });

  const handleReturnClick = (loanId: string) => {
    setSelectedLoanId(loanId);
    setOpenReturnDialog(true);
  };

  const handleReturn = () => {
    if (!returnData.name || !returnData.ra) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (selectedLoanId) {
      onReturn(selectedLoanId, returnData);
      setOpenReturnDialog(false);
      setReturnData({ name: "", ra: "" });
      setSelectedLoanId(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Empréstimos Ativos
      </h2>
      <div className="space-y-3">
        {loans.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Nenhum empréstimo ativo
          </p>
        ) : (
          loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-gray-50 border border-gray-100 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-800">
                    {loan.studentName}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-white">
                      RA: {loan.ra}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                      Chromebook: {loan.chromebookId}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2 text-sm text-gray-600">
                    <span>Finalidade: {loan.purpose}</span>
                    <span>•</span>
                    <span>
                      Retirada: {format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleReturnClick(loan.id)}
                  className="ml-4 border-gray-200 hover:bg-gray-100"
                >
                  Devolver
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={openReturnDialog} onOpenChange={setOpenReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolução de Chromebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="returnerName">Nome do Aluno que está devolvendo</Label>
              <Input
                id="returnerName"
                value={returnData.name}
                onChange={(e) => setReturnData({ ...returnData, name: e.target.value })}
                placeholder="Digite o nome do aluno"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="returnerRA">RA do Aluno que está devolvendo</Label>
              <Input
                id="returnerRA"
                value={returnData.ra}
                onChange={(e) => setReturnData({ ...returnData, ra: e.target.value })}
                placeholder="Digite o RA"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReturnDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReturn}>
              Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
