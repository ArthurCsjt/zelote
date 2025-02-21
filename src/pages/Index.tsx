import { useState } from "react";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans, Loan } from "@/components/ActiveLoans";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChromebookRegistration } from "@/components/ChromebookRegistration";

const Index = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [history, setHistory] = useState<Loan[]>([]);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState({ 
    name: "", 
    ra: "", 
    email: "",
    type: 'individual' as 'individual' | 'lote',
    userType: 'aluno' as 'aluno' | 'professor' | 'funcionario'
  });
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const handleNewLoan = (formData: {
    studentName: string;
    ra?: string;
    email: string;
    chromebookId: string;
    purpose: string;
    userType: 'aluno' | 'professor' | 'funcionario';
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

    if (!returnData.name || !returnData.email) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    handleReturn(loanToReturn.id, returnData);
    setOpenReturnDialog(false);
    setChromebookId("");
    setReturnData({ 
      name: "", 
      ra: "", 
      email: "",
      type: 'individual',
      userType: 'aluno'
    });
  };

  const handleReturn = (loanId: string, returnData: { 
    name: string; 
    ra?: string; 
    email: string;
    type: 'individual' | 'lote';
    userType: 'aluno' | 'professor' | 'funcionario';
  }) => {
    const loanToReturn = loans.find((loan) => loan.id === loanId);
    if (!loanToReturn) return;

    const returnedLoan: Loan = {
      ...loanToReturn,
      returnRecord: {
        returnedBy: {
          name: returnData.name,
          ra: returnData.ra,
          email: returnData.email,
          type: returnData.userType
        },
        returnTime: new Date(),
        returnType: returnData.type
      },
    };

    setHistory([returnedLoan, ...history]);
    setLoans(loans.filter((loan) => loan.id !== loanId));

    const returnedByDifferentPerson = 
      returnData.email !== loanToReturn.email;

    toast({
      title: "Chromebook Devolvido",
      description: returnedByDifferentPerson
        ? `Devolvido por ${returnData.name} (${returnData.email})`
        : "Devolvido pelo próprio solicitante",
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
        </header>

        {!showLoanForm && !showRegistrationForm && (
          <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
            <Button
              variant="outline"
              className="h-32 text-lg font-medium bg-white hover:bg-blue-50 border-2 border-blue-200"
              onClick={() => setShowRegistrationForm(true)}
            >
              Cadastro
            </Button>
            <Button
              variant="outline"
              className="h-32 text-lg font-medium bg-white hover:bg-blue-50 border-2 border-blue-200"
              onClick={() => toast({ title: "Dashboard", description: "Funcionalidade em desenvolvimento" })}
            >
              Dashboard
            </Button>
            <Button
              variant="outline"
              className="h-32 text-lg font-medium bg-white hover:bg-blue-50 border-2 border-blue-200"
              onClick={() => setShowLoanForm(true)}
            >
              Retirada
            </Button>
            <Button
              variant="outline"
              className="h-32 text-lg font-medium bg-white hover:bg-blue-50 border-2 border-blue-200"
              onClick={() => setOpenReturnDialog(true)}
            >
              Devolução
            </Button>
          </div>
        )}

        {showRegistrationForm && (
          <div>
            <ChromebookRegistration />
            <Button 
              variant="outline" 
              className="mt-4 w-full max-w-2xl mx-auto block"
              onClick={() => setShowRegistrationForm(false)}
            >
              Voltar ao Menu
            </Button>
          </div>
        )}

        {showLoanForm && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <LoanForm onSubmit={handleNewLoan} />
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => setShowLoanForm(false)}
              >
                Voltar ao Menu
              </Button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <ActiveLoans loans={loans} onReturn={handleReturn} />
            </div>
          </div>
        )}

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
                <Label htmlFor="chromebookId">ID do Chromebook</Label>
                <Input
                  id="chromebookId"
                  value={chromebookId}
                  onChange={(e) => setChromebookId(e.target.value)}
                  placeholder="Digite o ID do Chromebook"
                />
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
