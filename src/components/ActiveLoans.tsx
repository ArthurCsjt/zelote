
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { toast } from "./ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export type ReturnDataType = {
  name: string;
  ra?: string;
  email: string;
  type: 'individual' | 'lote';
  userType: 'aluno' | 'professor' | 'funcionario';
};

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
  loanType?: 'individual' | 'lote';
  returnRecord?: ReturnRecord;
}

interface ActiveLoansProps {
  loans: Loan[];
  onReturn: (loanId: string, returnData: ReturnDataType) => void;
}

export function ActiveLoans({ loans, onReturn }: ActiveLoansProps) {
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [returnData, setReturnData] = useState<ReturnDataType>({ 
    name: "", 
    ra: "", 
    email: "",
    type: 'individual',
    userType: 'aluno'
  });

  const handleReturnClick = (loanId: string) => {
    setSelectedLoanId(loanId);
    setOpenReturnDialog(true);
  };

  const handleReturn = () => {
    if (!returnData.name || !returnData.email) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (selectedLoanId) {
      onReturn(selectedLoanId, returnData);
      setOpenReturnDialog(false);
      setReturnData({ 
        name: "", 
        ra: "", 
        email: "",
        type: 'individual',
        userType: 'aluno'
      });
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
                    {loan.ra && (
                      <Badge variant="outline" className="bg-white">
                        RA: {loan.ra}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                      Chromebook: {loan.chromebookId}
                    </Badge>
                    {loan.loanType === 'lote' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                        Lote
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2 text-sm">
                    <span>Finalidade: {loan.purpose}</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
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
              <Label htmlFor="returnType">Tipo de Devolução</Label>
              <Select
                value={returnData.type}
                onValueChange={(value: 'individual' | 'lote') =>
                  setReturnData({ ...returnData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de devolução" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="lote">Em Lote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">Tipo de Solicitante</Label>
              <Select
                value={returnData.userType}
                onValueChange={(value: 'aluno' | 'professor' | 'funcionario') =>
                  setReturnData({ ...returnData, userType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de solicitante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnerName">Nome do Solicitante</Label>
              <Input
                id="returnerName"
                value={returnData.name}
                onChange={(e) => setReturnData({ ...returnData, name: e.target.value })}
                placeholder="Digite o nome do solicitante"
              />
            </div>

            {returnData.userType === 'aluno' && (
              <div className="space-y-2">
                <Label htmlFor="returnerRA">RA do Aluno (opcional)</Label>
                <Input
                  id="returnerRA"
                  value={returnData.ra}
                  onChange={(e) => setReturnData({ ...returnData, ra: e.target.value })}
                  placeholder="Digite o RA"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="returnerEmail">Email</Label>
              <Input
                id="returnerEmail"
                type="email"
                value={returnData.email}
                onChange={(e) => setReturnData({ ...returnData, email: e.target.value })}
                placeholder="Digite o email"
                required
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
