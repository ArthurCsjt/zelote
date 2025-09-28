import { useState } from "react";
import { RegistrationHub } from "@/components/RegistrationHub";
import Layout from "@/components/Layout";
import { ReturnDialog } from "@/components/ReturnDialog";
import { MainMenu } from "@/components/MainMenu";
import { InventoryHub } from "@/components/InventoryHub";
import { Dashboard } from "@/components/Dashboard";
import { QRCodeModal } from "@/components/QRCodeModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoanHub } from "@/components/LoanHub"; // Importar o novo componente
import type { ReturnFormData } from "@/types/database";
import { useDatabase } from "@/hooks/useDatabase";

const Index = () => {
  const { loading } = useDatabase();
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnFormData>({ name: "", ra: "", email: "", type: 'individual', userType: 'aluno' });
  const [currentView, setCurrentView] = useState<'menu' | 'registration' | 'dashboard' | 'inventory' | 'loan'>('menu');
  
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);

  const handleNavigation = (
    route: 'registration' | 'dashboard' | 'inventory' | 'loan' | 'return'
  ) => {
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

  const handleReturnClick = () => { /* Sua lógica de devolução */ };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'registration':
        return <RegistrationHub onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />;
      case 'dashboard':
        return <Dashboard onBack={handleBackToMenu} />;
      case 'inventory':
        return <InventoryHub onBack={handleBackToMenu} onGenerateQrCode={handleGenerateQrCode} />;
      case 'loan':
        return <LoanHub onBack={handleBackToMenu} />;
      default:
        return <MainMenu onNavigate={handleNavigation} />;
    }
  };
  
  const getViewTitle = () => { /* Sua lógica de títulos */ };
  const getViewSubtitle = () => { /* Sua lógica de subtítulos */ };

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
      </Layout>
      <QRCodeModal isOpen={showQRCodeModal} onClose={() => setShowQRCodeModal(false)} chromebookId={selectedChromebookId} />
    </>
  );
};
export default Index;