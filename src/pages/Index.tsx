
import { useState } from "react";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans, Loan } from "@/components/ActiveLoans";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Index = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [history, setHistory] = useState<Loan[]>([]);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState({ name: "", ra: "" });

  const handleNewLoan = (formData: {
    studentName: string;
    ra: string;
    chromebookId: string;
    purpose: string;
  }) => {
    const newLoan: Loan = {
      id: Math.random().toString(36).substring(7),
      ...formData,
      timestamp: new Date(),
    };
    setLoans([...loans, newLoan]);
  };

  const handleReturnClick = () => {
    const loanToReturn = loans.find((loan) => loan.chromebookId === chromebookId);
    if (!loanToReturn) {
      toast({
        title: "Erro",
        description: "Chromebook não encontrado ou não está emprestado",
        variant: "destructive",
      });
      return;
    }

    if (!returnData.name || !returnData.ra) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    handleReturn(loanToReturn.id, returnData);
    setOpenReturnDialog(false);
    setChromebookId("");
    setReturnData({ name: "", ra: "" });
  };

  const handleReturn = (loanId: string, returnData: { name: string; ra: string }) => {
    const loanToReturn = loans.find((loan) => loan.id === loanId);
    if (!loanToReturn) return;

    // Create return record
    const returnedLoan: Loan = {
      ...loanToReturn,
      returnRecord: {
        returnedBy: {
          name: returnData.name,
          ra: returnData.ra,
        },
        returnTime: new Date(),
      },
    };

    // Add to history
    setHistory([returnedLoan, ...history]);

    // Remove from active loans
    setLoans(loans.filter((loan) => loan.id !== loanId));

    // Show success message with details
    const returnedByDifferentStudent = 
      returnData.ra !== loanToReturn.ra || 
      returnData.name !== loanToReturn.studentName;

    toast({
      title: "Chromebook Devolvido",
      description: returnedByDifferentStudent
        ? `Devolvido por ${returnData.name} (RA: ${returnData.ra})`
        : "Devolvido pelo próprio aluno",
    });
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-blue-50 rounded-lg p-6 mb-8 text-center border border-blue-100">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Controle de Chromebooks
          </h1>
          <p className="text-blue-600">
            Escola - Sistema de Empréstimo
          </p>
          <Button 
            onClick={() => setOpenReturnDialog(true)}
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            Devolver Chromebook
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <LoanForm onSubmit={handleNewLoan} />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <ActiveLoans loans={loans} onReturn={handleReturn} />
          </div>
        </div>

        <Dialog open={openReturnDialog} onOpenChange={setOpenReturnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Devolução de Chromebook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chromebookId">ID do Chromebook</Label>
                <Input
                  id="chromebookId"
                  value={chromebookId}
                  onChange={(e) => setChromebookId(e.target.value)}
                  placeholder="Digite o ID do Chromebook"
                />
              </div>
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
              <Button onClick={handleReturnClick}>
                Confirmar Devolução
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
