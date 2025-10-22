// ADIÇÃO: Importamos o provedor da nossa nova funcionalidade de auditoria
import { AuditProvider } from '@/providers/AuditProvider'; 

// ADIÇÃO: Importamos os hooks de autenticação que o Layout precisará
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';

import { AuditHub } from '@/components/audit/AuditHub';
import { useState } from "react";
import { RegistrationHub } from "@/components/RegistrationHub";
import Layout from "@/components/Layout";
// import { ReturnDialog } from "@/components/ReturnDialog"; // REMOVIDO
import { MainMenu } from "@/components/MainMenu";
import { InventoryHub } from "@/components/InventoryHub";
import { Dashboard } from "@/components/Dashboard";
import { QRCodeModal } from "@/components/QRCodeModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoanHub } from "@/components/LoanHub";
// import type { ReturnFormData } from "@/types/database"; // REMOVIDO
import { useDatabase } from "@/hooks/useDatabase";
import { QuickRegisterWrapper } from '@/components/QuickRegisterWrapper'; // NOVO IMPORT

const Index = () => {
  // ADIÇÃO: Chamamos os hooks de autenticação aqui, no componente "pai"
  const { user, logout } = useAuth();
  const { isAdmin, loading: roleLoading } = useProfileRole(user);
  const { loading: dbLoading } = useDatabase();

  // REMOVIDO: Estados relacionados ao ReturnDialog
  // const [openReturnDialog, setOpenReturnDialog] = useState(false);
  // const [chromebookId, setChromebookId] = useState("");
  // const [returnData, setReturnData] = useState<ReturnFormData>({ name: "", ra: "", email: "", type: 'individual', userType: 'aluno' });
  
  const [currentView, setCurrentView] = useState<'menu' | 'registration' | 'dashboard' | 'inventory' | 'loan' | 'audit' | 'quick-register'>('menu');
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);

  const handleNavigation = (route: 'registration' | 'dashboard' | 'inventory' | 'loan' | 'return' | 'audit' | 'quick-register') => {
    // Se a rota for 'return', redireciona para 'loan'
    if (route === 'return') {
      setCurrentView('loan');
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
    // Se o registro foi feito via QuickRegister, volta para o menu após o sucesso
    if (currentView === 'quick-register') {
      setCurrentView('menu');
    } else {
      setCurrentView('inventory');
    }
  };

  // REMOVIDO: Função handleReturnClick vazia
  // const handleReturnClick = () => { /* Sua lógica de devolução */ };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'registration':
        // O RegistrationHub agora gerencia a navegação interna, mas o botão 'Voltar'
        // no cabeçalho do Hub leva de volta ao menu principal.
        return <RegistrationHub onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />;
      case 'dashboard':
        return <Dashboard onBack={handleBackToMenu} />;
      case 'inventory':
        return <InventoryHub onBack={handleBackToMenu} onGenerateQrCode={handleGenerateQrCode} />;
      case 'loan':
        return <LoanHub onBack={handleBackToMenu} />;
      case 'audit':
        return <AuditHub />;
      case 'quick-register':
        return <QuickRegisterWrapper onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />;
      default:
        return <MainMenu onNavigate={handleNavigation} />;
    }
  };
  
  const getViewTitle = (): string => { /* Sua lógica de títulos */ return 'Zelote'; };
  const getViewSubtitle = (): string => { /* Sua lógica de subtítulos */ return 'Controle de Chromebooks'; };
  
  const loading = dbLoading || roleLoading;

  return (
    // ADIÇÃO: Envolvemos tudo com o AuditProvider
    <AuditProvider>
      {/* ADIÇÃO: Passamos as informações para o Layout como props */}
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
        {/* REMOVIDO: ReturnDialog */}
      </Layout>
      <QRCodeModal open={showQRCodeModal} onOpenChange={(open) => setShowQRCodeModal(open)} chromebookId={selectedChromebookId ?? undefined} />
    </AuditProvider>
  );
};

export default Index;