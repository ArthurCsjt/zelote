import { useState, useEffect } from "react";
import { RegistrationHub } from "@/components/RegistrationHub";
import Layout from "@/components/Layout";
import { ReturnDialog } from "@/components/ReturnDialog";
import { MainMenu } from "@/components/MainMenu";
import { InventoryHub } from "@/components/InventoryHub";
import { Dashboard } from "@/components/Dashboard";
import { QRCodeModal } from "@/components/QRCodeModal";
import { LoanForm } from "@/components/LoanForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanHistory } from "@/components/LoanHistory";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReturnFormData, LoanHistoryItem, LoanFormData } from "@/types/database";
import { useDatabase } from "@/hooks/useDatabase";

const Index = () => {
  const { loading, getActiveLoans, getLoanHistory, createLoan } = useDatabase();
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnFormData>({ name: "", ra: "", email: "", type: 'individual', userType: 'aluno' });
  const [currentView, setCurrentView] = useState<'menu' | 'registration' | 'dashboard' | 'inventory'>('menu');
  
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);

  const loadData = async () => {
    const [active, history] = await Promise.all([getActiveLoans(), getLoanHistory()]);
    setActiveLoans(active);
    setLoanHistory(history);
  };

  useEffect(() => {
    if (openLoanDialog) {
      loadData();
    }
  }, [openLoanDialog]);

  const handleNavigation = (
    route: 'registration' | 'dashboard' | 'inventory' | 'loan' | 'return'
  ) => {
    if (route === 'loan') {
      setOpenLoanDialog(true);
      return;
    }
    if (route === 'return') {
      setOpenReturnDialog(true);
      return;
    }
    setCurrentView(route);
  };
  const handleBackToMenu = () => setCurrentView('menu');

  const handleGenerateQrCode = (chromebookId: string) => {
    setSelectedChromebookId(chromebookId);
    setShowQRCodeModal(true);
  };

  const handleRegistrationSuccess = (newChromebook: any) => {
    setSelectedChromebookId(newChromebook.chromebook_id);
    setShowQRCodeModal(true);
    setCurrentView('inventory');
  };

  const handleNewLoan = async (data: LoanFormData) => {
    const newLoan = await createLoan(data);
    if (newLoan) {
      setOpenLoanDialog(false);
    }
  };

  const handleReturnClick = () => { /* Sua lógica de devolução */ };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'registration':
        return <RegistrationHub onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />;
      case 'dashboard':
        return <Dashboard onBack={handleBackToMenu} />;
      case 'inventory':
        return <InventoryHub onBack={handleBackToMenu} onGenerateQrCode={handleGenerateQrCode} />;
      default:
        return <MainMenu onNavigate={handleNavigation} />;
    }
  };
  
  const getViewTitle = () => { /* Sua lógica de títulos */ };
  const getViewSubtitle = () => { /* Sua lógica de subtítulos */ };

  const LoanDialog = () => (
    <Dialog open={openLoanDialog} onOpenChange={setOpenLoanDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Empréstimo de Chromebook</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form">Novo Empréstimo</TabsTrigger>
              <TabsTrigger value="active">Empréstimos Ativos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="form">
              <div className="p-4">
                <LoanForm onSubmit={handleNewLoan} />
              </div>
            </TabsContent>
            <TabsContent value="active">
              <ActiveLoans loans={activeLoans} onReturn={loadData} />
            </TabsContent>
            <TabsContent value="history">
              <LoanHistory history={loanHistory} />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Layout 
        title={getViewTitle()} 
        subtitle={getViewSubtitle()} 
        showBackButton={currentView !== 'menu'} 
        onBack={handleBackToMenu}
      >
        {loading && currentView !== 'menu' ? <div className="flex justify-center items-center h-64"><LoadingSpinner/></div> : renderCurrentView()}
        <ReturnDialog open={openReturnDialog} onOpenChange={setOpenReturnDialog} chromebookId={chromebookId} onChromebookIdChange={setChromebookId} returnData={returnData} onReturnDataChange={setReturnData} onConfirm={handleReturnClick} />
        <LoanDialog />
      </Layout>
      <QRCodeModal isOpen={showQRCodeModal} onClose={() => setShowQRCodeModal(false)} chromebookId={selectedChromebookId} />
    </>
  );
};
export default Index;