import { useState, useCallback, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans, Loan, ReturnDataType } from "@/components/ActiveLoans";
import { toast } from "@/components/ui/use-toast";
import { ChromebookRegistration } from "@/components/ChromebookRegistration";
import { MainMenu } from "@/components/MainMenu";
import { Header } from "@/components/Header";
import { ReturnDialog } from "@/components/ReturnDialog";
import { Button } from "@/components/ui/button";
import { LoanHistory } from "@/components/LoanHistory";
import { MobileFriendlyDashboard } from "@/components/MobileFriendlyDashboard";
import { ChromebookInventory } from "@/components/ChromebookInventory";
import { ArrowLeft } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const { isMobile, isReady } = useMobile();
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
  const [currentView, setCurrentView] = useState<'menu' | 'loan' | 'registration' | 'dashboard' | 'inventory'>('menu');

  // Ensure smooth scrolling to top when changing views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('View changed to:', currentView, 'isMobile:', isMobile);
  }, [currentView, isMobile]);

  const handleNavigation = useCallback((route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory') => {
    try {
      if (route === 'return') {
        setOpenReturnDialog(true);
        return;
      }
      
      console.log('Navigating to:', route);
      setCurrentView(route);
      
    } catch (error) {
      console.error("Erro ao navegar:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao navegar entre as telas",
        variant: "destructive",
      });
    }
  }, []);

  const handleBackToMenu = useCallback(() => {
    console.log('Returning to menu from:', currentView);
    setCurrentView('menu');
  }, [currentView]);

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

  const renderCurrentView = () => {
    console.log('Rendering view:', currentView, 'isMobile:', isMobile, 'isReady:', isReady);
    
    // Wait for mobile detection to be ready
    if (!isReady) {
      return <div className="flex items-center justify-center min-h-[50vh]">Carregando...</div>;
    }
    
    switch (currentView) {
      case 'registration':
        return (
          <div className="animate-in fade-in duration-300">
            <ChromebookRegistration />
            <Button 
              variant="outline" 
              className="mt-4 w-full max-w-2xl mx-auto block"
              onClick={handleBackToMenu}
            >
              Voltar ao Menu
            </Button>
          </div>
        );
      case 'dashboard':
        if (isMobile) {
          return (
            <div className="animate-in fade-in duration-300">
              <MobileFriendlyDashboard 
                activeLoans={loans}
                history={history}
                onBack={handleBackToMenu}
              />
            </div>
          );
        } else {
          return (
            <div className="animate-in fade-in duration-300">
              <Dashboard 
                activeLoans={loans}
                history={history}
                onBack={handleBackToMenu}
              />
            </div>
          );
        }
      case 'inventory':
        return (
          <div className="animate-in fade-in duration-300">
            <ChromebookInventory />
            <Button 
              variant="outline" 
              className="mt-4 w-full max-w-2xl mx-auto block"
              onClick={handleBackToMenu}
            >
              Voltar ao Menu
            </Button>
          </div>
        );
      case 'loan':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <LoanForm onSubmit={handleNewLoan} />
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={handleBackToMenu}
                >
                  Voltar ao Menu
                </Button>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <ActiveLoans loans={loans} onReturn={handleReturn} />
              </div>
            </div>
            <LoanHistory history={history} />
          </div>
        );
      default:
        return <MainMenu onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <Header />
        {renderCurrentView()}
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
