
import { useState, useCallback, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans, Loan, ReturnDataType } from "@/components/ActiveLoans";
import { toast } from "@/hooks/use-toast";
import { ChromebookRegistration } from "@/components/ChromebookRegistration";
import { MainMenu } from "@/components/MainMenu";
import { Header } from "@/components/Header";
import { ReturnDialog } from "@/components/ReturnDialog";
import { Button } from "@/components/ui/button";
import { LoanHistory } from "@/components/LoanHistory";
import { MobileFriendlyDashboard } from "@/components/MobileFriendlyDashboard";
import { ChromebookInventory } from "@/components/ChromebookInventory";
import { ArrowLeft, X } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Index = () => {
  const { isMobile, isReady } = useMobile();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [history, setHistory] = useState<Loan[]>([]);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnDataType>({
    name: "",
    ra: "",
    email: "",
    type: 'individual',
    userType: 'aluno'
  });
  const [currentView, setCurrentView] = useState<'menu' | 'loan' | 'registration' | 'dashboard' | 'inventory'>('menu');
  const [openNavSheet, setOpenNavSheet] = useState(false);

  // Ensure smooth scrolling to top when changing views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('View changed to:', currentView, 'isMobile:', isMobile);
  }, [currentView, isMobile]);

  // Método de navegação simplificado
  const handleNavigation = useCallback((route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory') => {
    try {
      if (route === 'return') {
        setOpenReturnDialog(true);
        return;
      }
      
      if (route === 'loan') {
        setOpenLoanDialog(true);
        return;
      }
      
      console.log('Navegando para:', route);
      setCurrentView(route);
      setOpenNavSheet(false);
      
    } catch (error) {
      console.error("Erro ao navegar:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao navegar entre as telas",
        variant: "destructive",
      });
    }
  }, []);

  // Função simplificada para voltar ao menu
  const handleBackToMenu = useCallback(() => {
    console.log('Voltando ao menu via função handleBackToMenu');
    setCurrentView('menu');
    setOpenNavSheet(false);
    setOpenLoanDialog(false);
  }, []);

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

  // Componente de navegação suspenso
  const NavigationSheet = () => (
    <Sheet open={openNavSheet} onOpenChange={setOpenNavSheet}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="fixed top-4 right-4 z-40 p-2 h-10 w-10" 
          size="icon"
        >
          <X className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Menu de Navegação</SheetTitle>
          <SheetDescription>
            Escolha para onde deseja navegar
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 grid gap-4">
          <Button onClick={() => handleBackToMenu()} className="w-full">
            Menu Principal
          </Button>
          <Button onClick={() => handleNavigation('loan')} className="w-full">
            Empréstimos
          </Button>
          <Button onClick={() => handleNavigation('dashboard')} className="w-full">
            Dashboard
          </Button>
          <Button onClick={() => handleNavigation('registration')} className="w-full">
            Cadastro de Chromebooks
          </Button>
          <Button onClick={() => handleNavigation('inventory')} className="w-full">
            Inventário
          </Button>
          <Button onClick={() => handleNavigation('return')} className="w-full">
            Devolver Chromebook
          </Button>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" onClick={() => setOpenNavSheet(false)}>Fechar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  // Diálogo de Empréstimo com ScrollArea para permitir rolagem
  const LoanDialog = () => (
    <Dialog open={openLoanDialog} onOpenChange={setOpenLoanDialog}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Empréstimo de Chromebook
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-auto pr-4" style={{ maxHeight: "calc(90vh - 160px)" }}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <LoanForm onSubmit={handleNewLoan} />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <ActiveLoans loans={loans} onReturn={handleReturn} />
            </div>
          </div>
          
          <div className="mt-6">
            <LoanHistory history={history} />
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button variant="back" onClick={() => setOpenLoanDialog(false)}>
            <ArrowLeft className="mr-1" />
            Voltar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderCurrentView = () => {
    console.log('Renderizando view:', currentView, 'isMobile:', isMobile, 'isReady:', isReady);
    
    // Wait for mobile detection to be ready
    if (!isReady) {
      return <div className="flex items-center justify-center min-h-[50vh]">Carregando...</div>;
    }
    
    switch (currentView) {
      case 'registration':
        return (
          <div className="animate-in fade-in duration-300">
            <ChromebookRegistration onBack={handleBackToMenu} />
          </div>
        );
      case 'dashboard':
        if (isMobile) {
          console.log('Renderizando dashboard mobile');
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
            <ChromebookInventory onBack={handleBackToMenu} />
          </div>
        );
      case 'loan':
        // Não renderizamos mais o conteúdo aqui, pois agora está no diálogo
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MainMenu onNavigate={handleNavigation} />
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
        {/* Sempre renderize o Sheet de navegação, mas só aparece quando aberto */}
        <NavigationSheet />
        <ReturnDialog
          open={openReturnDialog}
          onOpenChange={setOpenReturnDialog}
          chromebookId={chromebookId}
          onChromebookIdChange={setChromebookId}
          returnData={returnData}
          onReturnDataChange={setReturnData}
          onConfirm={handleReturnClick}
        />
        {/* Adicione o diálogo de empréstimo */}
        <LoanDialog />
      </div>
    </div>
  );
};

export default Index;
