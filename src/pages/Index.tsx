import { useState, useCallback, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans } from "@/components/ActiveLoans";
import { ChromebookRegistration } from "@/components/ChromebookRegistration";
import { MainMenu } from "@/components/MainMenu";
import Layout from "@/components/Layout";
import { ReturnDialog } from "@/components/ReturnDialog";
import { Button } from "@/components/ui/button";
import { LoanHistory } from "@/components/LoanHistory";
import { MobileFriendlyDashboard } from "@/components/MobileFriendlyDashboard";
import { ChromebookInventory } from "@/components/ChromebookInventory";
import IntelligentReports from "@/components/IntelligentReports";
import { ArrowLeft } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetFooter } from "@/components/ui/sheet";
import type { LoanFormData, ReturnFormData, LoanHistoryItem } from "@/types/database";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Index = () => {
  const { isMobile, isReady } = useMobile();
  const { 
    createLoan, 
    getActiveLoans, 
    getLoanHistory, 
    returnChromebookById,
    loading 
  } = useDatabase();

  // Estado local
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnFormData>({
    name: "",
    ra: "",
    email: "",
    type: 'individual',
    userType: 'aluno'
  });
  const [currentView, setCurrentView] = useState<'menu' | 'loan' | 'registration' | 'dashboard' | 'inventory'>('menu');
  const [openNavSheet, setOpenNavSheet] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [loans, history] = await Promise.all([
        getActiveLoans(),
        getLoanHistory()
      ]);
      setActiveLoans(loans);
      setLoanHistory(history);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, [getActiveLoans, getLoanHistory]);

  // Navegação
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

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
      setCurrentView(route);
      setOpenNavSheet(false);
    } catch (error) {
      console.error("Erro ao navegar:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao navegar entre as telas",
        variant: "destructive"
      });
    }
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentView('menu');
    setOpenNavSheet(false);
    setOpenLoanDialog(false);
  }, []);

  // Operações de empréstimo
  const handleNewLoan = useCallback(async (formData: LoanFormData) => {
    const result = await createLoan(formData);
    if (result) {
      await loadData(); // Recarregar dados
      setOpenLoanDialog(false);
    }
  }, [createLoan, loadData]);

  // Operações de devolução
  const handleReturnClick = useCallback(async () => {
    try {
      if (!returnData.name || !returnData.email) {
        toast({
          title: "Erro",
          description: "Por favor, preencha os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      if (returnData.type === 'individual') {
        if (!chromebookId.trim()) {
          toast({
            title: "Erro",
            description: "ID do Chromebook não informado",
            variant: "destructive"
          });
          return;
        }

        const success = await returnChromebookById(chromebookId.trim(), returnData);
        if (success) {
          await loadData();
          setOpenReturnDialog(false);
          setChromebookId("");
          setReturnData({
            name: "",
            ra: "",
            email: "",
            type: 'individual',
            userType: 'aluno'
          });
        }
      } else {
        // Devolução em lote
        const chromebookIds = chromebookId.split(',').map(id => id.trim()).filter(id => id);
        
        if (chromebookIds.length === 0) {
          toast({
            title: "Erro",
            description: "Nenhum ID válido informado",
            variant: "destructive"
          });
          return;
        }

        let returnedCount = 0;
        let notFoundCount = 0;

        for (const id of chromebookIds) {
          const success = await returnChromebookById(id, returnData);
          if (success) {
            returnedCount++;
          } else {
            notFoundCount++;
          }
        }

        if (returnedCount === 0) {
          toast({
            title: "Atenção",
            description: `Nenhum dos ${chromebookIds.length} dispositivos foi encontrado para devolução`,
            variant: "destructive"
          });
        } else {
          const notFoundMessage = notFoundCount > 0 ? ` (${notFoundCount} não encontrados)` : '';
          toast({
            title: "Sucesso",
            description: `${returnedCount} dispositivos devolvidos com sucesso${notFoundMessage}`
          });
        }

        await loadData();
        setOpenReturnDialog(false);
        setChromebookId("");
        setReturnData({
          name: "",
          ra: "",
          email: "",
          type: 'individual',
          userType: 'aluno'
        });
      }
    } catch (error) {
      console.error("Erro ao processar devolução:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a devolução",
        variant: "destructive"
      });
    }
  }, [returnData, chromebookId, returnChromebookById, loadData]);

  // Componentes de navegação
  const NavigationSheet = () => (
    <Sheet open={openNavSheet} onOpenChange={setOpenNavSheet}>
      <SheetContent className="sm:max-w-md">
        <div className="py-6 grid gap-4">
          <Button onClick={handleBackToMenu} className="w-full">
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
            <Button variant="outline" onClick={() => setOpenNavSheet(false)}>
              Fechar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  const LoanDialog = () => (
    <Dialog open={openLoanDialog} onOpenChange={setOpenLoanDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Empréstimo de Chromebook
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-auto pr-4" style={{ maxHeight: "calc(90vh - 160px)" }}>
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 h-auto p-1">
              <TabsTrigger value="form" className="text-xs sm:text-sm px-2 py-2">
                Novo Empréstimo
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs sm:text-sm px-2 py-2">
                Empréstimos Ativos
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm px-2 py-2">
                Histórico
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="mt-0">
              <div className="bg-background rounded-lg border p-4">
                <LoanForm />
              </div>
            </TabsContent>
            
            <TabsContent value="active" className="mt-0">
              <div className="bg-background rounded-lg border p-4">
                <ActiveLoans />
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <LoanHistory history={loanHistory} />
            </TabsContent>
          </Tabs>
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpenLoanDialog(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Renderização das views
  const renderCurrentView = () => {
    if (!isReady) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] space-x-2">
          <LoadingSpinner />
          <span className="text-muted-foreground">Carregando dados...</span>
        </div>
      );
    }

    switch (currentView) {
      case 'registration':
        return (
          <div className="animate-in fade-in duration-300">
            <ChromebookRegistration onBack={handleBackToMenu} />
          </div>
        );
      case 'dashboard':
        return (
          <div className="animate-in fade-in duration-300">
            <Dashboard 
              onBack={handleBackToMenu} 
            />
          </div>
        );
      case 'inventory':
        return (
          <div className="animate-in fade-in duration-300">
            <ChromebookInventory onBack={handleBackToMenu} />
          </div>
        );
      default:
        return <MainMenu onNavigate={handleNavigation} />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'registration':
        return "Cadastro de Chromebook";
      case 'dashboard':
        return "Dashboard";
      case 'inventory':
        return "Inventário de Chromebooks";
      default:
        return "Sistema de Gerenciamento de Chromebooks";
    }
  };

  const getViewSubtitle = () => {
    switch (currentView) {
      case 'registration':
        return "Cadastre novos dispositivos e gere QR Codes";
      case 'dashboard':
        return "Visualize estatísticas e relatórios";
      case 'inventory':
        return "Gerencie dispositivos cadastrados";
      default:
        return "Gerencie o cadastro, empréstimo e devolução de Chromebooks de forma simples e eficiente";
    }
  };

  return (
    <ErrorBoundary>
      <Layout 
        title={getViewTitle()} 
        subtitle={getViewSubtitle()} 
        showBackButton={currentView !== 'menu'} 
        onBack={handleBackToMenu}
      >
        {renderCurrentView()}
        
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
        
        <LoanDialog />
      </Layout>
    </ErrorBoundary>
  );
};

export default Index;