import { useState, useCallback, useEffect } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";
import { RegistrationHub } from "@/components/RegistrationHub";
import { MainMenu } from "@/components/MainMenu";
import Layout from "@/components/Layout";
import { ReturnDialog } from "@/components/ReturnDialog";
import { InventoryHub } from "@/components/InventoryHub";
import { Dashboard } from "@/components/Dashboard";
import { QRCodeModal } from "@/components/QRCodeModal"; // Importa o modal de QR Code
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans } from "@/components/ActiveLoans";
import { LoanHistory } from "@/components/LoanHistory";
import { ArrowLeft } from "lucide-react";
import type { LoanFormData, ReturnFormData, LoanHistoryItem } from "@/types/database";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  // --- SEUS ESTADOS ORIGINAIS MANTIDOS ---
  const { getActiveLoans, getLoanHistory, returnChromebookById, createLoan } = useDatabase();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnFormData>({ name: "", ra: "", email: "", type: 'individual', userType: 'aluno' });
  const [currentView, setCurrentView] = useState<'menu' | 'registration' | 'dashboard' | 'inventory'>('menu');
  
  // --- NOSSAS NOVAS ADIÇÕES PARA O QR CODE ---
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);

  const loadData = useCallback(async () => { /* Sua função original para carregar dados */ }, []);
  useEffect(() => { loadData(); }, [loadData]);

  // --- FUNÇÃO DE NAVEGAÇÃO ORIGINAL E COMPLETA ---
  const handleNavigation = useCallback((route: 'registration' | 'dashboard' | 'loan' | 'return' | 'inventory') => {
    if (route === 'return') {
      setOpenReturnDialog(true);
      return;
    }
    if (route === 'loan') {
      setOpenLoanDialog(true);
      return;
    }
    setCurrentView(route);
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentView('menu');
  }, []);

  // --- NOSSAS NOVAS FUNÇÕES PARA O FLUXO DE CADASTRO E QR CODE ---
  const handleGenerateQrCode = (chromebookId: string) => {
    setSelectedChromebookId(chromebookId);
    setShowQRCodeModal(true);
  };

  const handleRegistrationSuccess = (newChromebook: any) => {
    loadData(); // Recarrega os dados do inventário, se necessário
    setSelectedChromebookId(newChromebook.chromebook_id); // Usa o ID correto
    setShowQRCodeModal(true);
    setCurrentView('inventory'); // Navega para o inventário
  };
  
  // Suas outras funções originais (handleReturnClick, etc.)
  const handleReturnClick = () => { /* Sua lógica de devolução */ };
  const handleNewLoan = (data: LoanFormData) => { /* Sua lógica de empréstimo */ };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'registration':
        return <RegistrationHub onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />;
      case 'dashboard':
        return <Dashboard onBack={handleBackToMenu} />;
      case 'inventory':
        // Passando a nova função para o inventário
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
        <DialogHeader><DialogTitle>Empréstimo de Chromebook</DialogTitle></DialogHeader>
        <ScrollArea>
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="form">Novo Empréstimo</TabsTrigger><TabsTrigger value="active">Empréstimos Ativos</TabsTrigger><TabsTrigger value="history">Histórico</TabsTrigger></TabsList>
            <TabsContent value="form"><div className="p-4"><LoanForm onSubmit={handleNewLoan} /></div></TabsContent>
            <TabsContent value="active"><ActiveLoans loans={activeLoans} onReturn={() => loadData()} /></TabsContent>
            <TabsContent value="history"><LoanHistory history={loanHistory} /></TabsContent>
          </Tabs>
        </ScrollArea>
        <DialogFooter><Button variant="outline" onClick={() => setOpenLoanDialog(false)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <ErrorBoundary>
      <Layout 
        title={getViewTitle()} 
        subtitle={getViewSubtitle()} 
        showBackButton={currentView !== 'menu'} 
        onBack={handleBackToMenu}
      >
        {renderCurrentView()}
        <ReturnDialog open={openReturnDialog} onOpenChange={setOpenReturnDialog} chromebookId={chromebookId} onChromebookIdChange={setChromebookId} returnData={returnData} onReturnDataChange={setReturnData} onConfirm={handleReturnClick} />
        <LoanDialog />
      </Layout>
      {/* O MODAL DE QR CODE AGORA É CONTROLADO AQUI */}
      <QRCodeModal isOpen={showQRCodeModal} onClose={() => setShowQRCodeModal(false)} chromebookId={selectedChromebookId} />
    </ErrorBoundary>
  );
};

export default Index;