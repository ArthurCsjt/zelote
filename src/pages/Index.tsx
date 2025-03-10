import { useState } from "react";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans, Loan, ReturnDataType } from "@/components/ActiveLoans";
import { toast } from "@/components/ui/use-toast";
import { ChromebookRegistration } from "@/components/ChromebookRegistration";
import { MainMenu } from "@/components/MainMenu";
import { Header } from "@/components/Header";
import { ReturnDialog } from "@/components/ReturnDialog";
import { Button } from "@/components/ui/button";
import { LoanHistory } from "@/components/LoanHistory";
import { Dashboard } from "@/components/Dashboard";
import { ArrowLeft } from "@heroicons/react/24/outline";

const Index = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [history, setHistory] = useState<Loan[]>([]);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnDataType>({
    name: "",
    ra: "",
    email: "",
    type: 'individual',
    userType: 'aluno'
  });
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleNavigation = (route: 'registration' | 'dashboard' | 'loan' | 'return') => {
    switch (route) {
      case 'registration':
        setShowRegistrationForm(true);
        setShowLoanForm(false);
        setShowDashboard(false);
        break;
      case 'dashboard':
        setShowDashboard(true);
        setShowLoanForm(false);
        setShowRegistrationForm(false);
        break;
      case 'loan':
        setShowLoanForm(true);
        setShowRegistrationForm(false);
        setShowDashboard(false);
        break;
      case 'return':
        setOpenReturnDialog(true);
        break;
    }
  };

  const handleNewLoan = (formData: {
    studentName: string;
    ra?: string;
    email: string;
    chromebookId: string;
    purpose: string;
    userType: 'aluno' | 'professor' | 'funcionario';
    loanType: 'individual' | 'lote';
  }) => {
    const newLoan: Loan = {
      id: Math.random().toString(36).substring(7),
      ...formData,
      timestamp: new Date()
    };
    setLoans([...loans, newLoan]);
  };

  const handleReturnClick = () => {
    if (returnData.type === 'individual') {
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
    } else {
      if (!returnData.name || !returnData.email) {
        toast({
          title: "Erro",
          description: "Por favor, preencha os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
      const chromebookIds = chromebookId.split(',');
      let returnedCount = 0;
      chromebookIds.forEach(id => {
        const loanToReturn = loans.find(loan => loan.chromebookId === id.trim());
        if (loanToReturn) {
          handleReturn(loanToReturn.id, returnData);
          returnedCount++;
        }
      });
      if (returnedCount === 0) {
        toast({
          title: "Atenção",
          description: "Nenhum dispositivo encontrado para devolução",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: `${returnedCount} dispositivos devolvidos com sucesso`,
        });
      }
    }
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

  const handleReturn = (loanId: string, returnData: ReturnDataType) => {
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
      }
    };

    setHistory([returnedLoan, ...history]);
    setLoans(loans.filter((loan) => loan.id !== loanId));

    const returnedByDifferentPerson = returnData.email !== loanToReturn.email;
    if (returnData.type === 'individual') {
      toast({
        title: "Chromebook Devolvido",
        description: returnedByDifferentPerson
          ? `Devolvido por ${returnData.name} (${returnData.email})`
          : "Devolvido pelo próprio solicitante",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <Header />
        {!showLoanForm && !showRegistrationForm && !showDashboard && (
          <MainMenu onNavigate={handleNavigation} />
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
        {showDashboard && (
          <Dashboard 
            activeLoans={loans}
            history={history}
            onBack={() => {
              setShowDashboard(false);
            }}
          />
        )}
        {showLoanForm && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <LoanForm onSubmit={handleNewLoan} />
                <Button 
                  variant="outline" 
                  className="mt-4 w-full hidden sm:block"
                  onClick={() => setShowLoanForm(false)}
                >
                  Voltar ao Menu
                </Button>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <ActiveLoans loans={loans} onReturn={handleReturn} />
              </div>
            </div>
            <LoanHistory history={history} />
            <div className="fixed bottom-4 right-4 sm:hidden">
              <Button
                onClick={() => setShowLoanForm(false)}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-full h-12 w-12 flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
        <ReturnDialog
          open={openReturnDialog}
          onOpenChange={setOpenReturnDialog}
          chromebookId={chromebookId}
          onChromebookIdChange={setChromebookId}
          returnData={returnData}
          onReturnDataChange={setReturnData}
          onConfirm={handleReturnClick}
        />
      </div>
    </div>
  );
};

export default Index;
