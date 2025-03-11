
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
import { ArrowLeft } from "lucide-react";

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
    try {
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
        default:
          console.warn(`Rota não reconhecida: ${route}`);
      }
    } catch (error) {
      console.error("Erro ao navegar:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao navegar entre as telas",
        variant: "destructive",
      });
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
    try {
      if (!formData.studentName || !formData.email || !formData.chromebookId) {
        toast({
          title: "Dados incompletos",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Verificar se o Chromebook já está emprestado
      if (loans.some(loan => loan.chromebookId === formData.chromebookId)) {
        toast({
          title: "Chromebook já emprestado",
          description: `O Chromebook ID ${formData.chromebookId} já está em uso`,
          variant: "destructive",
        });
        return;
      }

      const newLoan: Loan = {
        id: Math.random().toString(36).substring(7),
        ...formData,
        timestamp: new Date()
      };

      setLoans(prevLoans => [...prevLoans, newLoan]);
      toast({
        title: "Empréstimo registrado",
        description: `Chromebook ID ${formData.chromebookId} emprestado para ${formData.studentName}`,
      });
    } catch (error) {
      console.error("Erro ao criar novo empréstimo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o empréstimo",
        variant: "destructive",
      });
    }
  };

  const handleReturnClick = () => {
    try {
      if (!returnData.name || !returnData.email) {
        toast({
          title: "Erro",
          description: "Por favor, preencha os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      if (returnData.type === 'individual') {
        if (!chromebookId.trim()) {
          toast({
            title: "Erro",
            description: "ID do Chromebook não informado",
            variant: "destructive",
          });
          return;
        }

        const loanToReturn = loans.find((loan) => loan.chromebookId === chromebookId.trim());
        if (!loanToReturn) {
          toast({
            title: "Erro",
            description: "Chromebook não encontrado ou não está emprestado",
            variant: "destructive",
          });
          return;
        }
        
        handleReturn(loanToReturn.id, returnData);
      } else {
        // Lote
        if (!chromebookId.trim()) {
          toast({
            title: "Erro",
            description: "IDs dos Chromebooks não informados",
            variant: "destructive",
          });
          return;
        }

        const chromebookIds = chromebookId.split(',').map(id => id.trim()).filter(id => id);
        
        if (chromebookIds.length === 0) {
          toast({
            title: "Erro",
            description: "Nenhum ID válido informado",
            variant: "destructive",
          });
          return;
        }

        let returnedCount = 0;
        let notFoundCount = 0;
        
        chromebookIds.forEach(id => {
          const loanToReturn = loans.find(loan => loan.chromebookId === id);
          if (loanToReturn) {
            handleReturn(loanToReturn.id, returnData);
            returnedCount++;
          } else {
            notFoundCount++;
          }
        });

        if (returnedCount === 0) {
          toast({
            title: "Atenção",
            description: `Nenhum dos ${chromebookIds.length} dispositivos foi encontrado para devolução`,
            variant: "destructive",
          });
        } else {
          const notFoundMessage = notFoundCount > 0 
            ? ` (${notFoundCount} não encontrados)`
            : '';
            
          toast({
            title: "Sucesso",
            description: `${returnedCount} dispositivos devolvidos com sucesso${notFoundMessage}`,
          });
        }
      }

      // Limpar campos após a devolução
      setOpenReturnDialog(false);
      setChromebookId("");
      setReturnData({
        name: "",
        ra: "",
        email: "",
        type: 'individual',
        userType: 'aluno'
      });
    } catch (error) {
      console.error("Erro ao processar devolução:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a devolução",
        variant: "destructive",
      });
    }
  };

  const handleReturn = (loanId: string, returnData: ReturnDataType) => {
    try {
      const loanToReturn = loans.find((loan) => loan.id === loanId);
      if (!loanToReturn) {
        console.warn(`Empréstimo com ID ${loanId} não encontrado`);
        return;
      }

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

      setHistory(prevHistory => [returnedLoan, ...prevHistory]);
      setLoans(prevLoans => prevLoans.filter((loan) => loan.id !== loanId));

      const returnedByDifferentPerson = returnData.email !== loanToReturn.email;
      if (returnData.type === 'individual') {
        toast({
          title: "Chromebook Devolvido",
          description: returnedByDifferentPerson
            ? `Devolvido por ${returnData.name} (${returnData.email})`
            : "Devolvido pelo próprio solicitante",
        });
      }
    } catch (error) {
      console.error("Erro ao processar devolução específica:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar esta devolução",
        variant: "destructive",
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
