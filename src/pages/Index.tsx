import { AuditProvider } from '@/contexts/AuditContext';
import { AuditHub } from '@/components/audit/AuditHub';
import { useState } from "react";
import { RegistrationHub } from "@/components/RegistrationHub";
import Layout from "@/components/Layout";
import { ReturnDialog } from "@/components/ReturnDialog";
import { MainMenu } from "@/components/MainMenu";
import { InventoryHub } from "@/components/InventoryHub";
import { Dashboard } from "@/components/Dashboard";
import { QRCodeModal } from "@/components/QRCodeModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoanHub } from "@/components/LoanHub";
import type { ReturnFormData } from "@/types/database";
import { useDatabase } from "@/hooks/useDatabase";
import { useAuth } from '@/contexts/AuthContext'; // <-- Adicionamos os hooks aqui
import { useProfileRole } from '@/hooks/use-profile-role'; // <-- Adicionamos os hooks aqui

const Index = () => {
  const { loading: dbLoading } = useDatabase(); // Renomeado para evitar conflito
  const { user, logout } = useAuth(); // Chamamos o hook de autenticação
  const { isAdmin, loading: roleLoading } = useProfileRole(user); // Chamamos o hook de perfil, passando o user

  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnFormData>({ name: "", ra: "", email: "", type: 'individual', userType: 'aluno' });
  const [currentView, setCurrentView] = useState<'menu' | 'registration' | 'dashboard' | 'inventory' | 'loan' | 'audit'>('menu');
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);

  const handleNavigation = (route: 'registration' | 'dashboard' | 'inventory' | 'loan' | 'return' | 'audit') => {
    if (route === 'return') {
      setOpenReturnDialog(true);
      return;
    }
    setCurrentView(route);
  };

  const handleBackToMenu = () => setCurrentView('menu');

  // ... (o resto das suas funções handle... continua igual)
  const handleGenerateQrCode = (chromebookId: string) => { /* ... */ };
  const handleRegistrationSuccess = (newChromebook: any) => { /* ... */ };
  const handleReturnClick = () => { /* ... */ };

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
      case 'audit':
        return <AuditHub />;
      default:
        return <MainMenu onNavigate={handleNavigation} />;
    }
  };
  
  const getViewTitle = () => { /* ... */ };
  const getViewSubtitle = () => { /* ... */ };
  
  const loading = dbLoading || roleLoading; // Combinamos os loadings

  return (
    <AuditProvider>
      {/* Passamos as informações necessárias para o Layout como props */}
      <Layout 
        title={getViewTitle()} 
        subtitle={getViewSubtitle()} 
        showBackButton={currentView !== 'menu'} 
        onBack={handleBackToMenu}
        user={user}
        isAdmin={isAdmin}
        logout={logout}
      >
        {loading && currentView !== 'menu' ? <div className="flex justify-center items-center h-64"><LoadingSpinner/></div> : renderCurrentView()}
        <ReturnDialog open={openReturnDialog} onOpenChange={setOpenReturnDialog} chromebookId={chromebookId} onChromebookIdChange={setChromebookId} returnData={returnData} onReturnDataChange={setReturnData} onConfirm={handleReturnClick} />
      </Layout>
      <QRCodeModal open={showQRCodeModal} onOpenChange={(open) => setShowQRCodeModal(open)} chromebookId={selectedChromebookId ?? undefined} />
    </AuditProvider>
  );
};

export default Index;