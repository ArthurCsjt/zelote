// ADIÇÃO: Importamos os hooks de autenticação que o Layout precisará
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';

import { AuditHub } from '@/components/audit/AuditHub';
import { useState } from "react";
import { RegistrationHub } from "@/components/RegistrationHub";
import Layout from "@/components/Layout";
import { MainMenu } from "@/components/MainMenu";
import { InventoryHub } from "@/components/InventoryHub";
import { DashboardLayout } from "@/components/DashboardLayout";
import { QRCodeModal } from "@/components/QRCodeModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoanHub } from "@/components/LoanHub";
import { useDatabase } from "@/hooks/useDatabase";
import { ReturnWrapper } from '@/components/ReturnWrapper';
import { Navigate } from 'react-router-dom';

type AppView = 'menu' | 'registration' | 'dashboard' | 'inventory' | 'loan' | 'audit' | 'return' | 'scheduling';

const Index = () => {
  const { user, logout } = useAuth();
  const { isAdmin, loading: roleLoading, role } = useProfileRole();
  const { loading: dbLoading } = useDatabase();

  const [currentView, setCurrentView] = useState<AppView>('menu');
  const [loanTabDefault, setLoanTabDefault] = useState<'form' | 'active'>('form');
  const [selectedChromebookIdForReturn, setSelectedChromebookIdForReturn] = useState<string | undefined>(undefined);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);

  const handleNavigation = (view: AppView, tab?: 'form' | 'active', chromebookId?: string) => {
    setCurrentView(view);
    if (tab) setLoanTabDefault(tab);
    if (chromebookId && view === 'return') {
      setSelectedChromebookIdForReturn(chromebookId);
    }
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setLoanTabDefault('form');
    setSelectedChromebookIdForReturn(undefined);
  };

  const handleGenerateQrCode = (chromebookId: string) => {
    setSelectedChromebookId(chromebookId);
    setShowQRCodeModal(true);
    setCurrentView('inventory');
  };

  const handleRegistrationSuccess = (newChromebook: any) => {
    setSelectedChromebookId(newChromebook.chromebook_id);
    setShowQRCodeModal(true);
    setCurrentView('inventory');
  };

  const handleReturnSuccess = () => {
    handleBackToMenu();
  };

  const handleNavigateToReturnView = (chromebookId: string) => {
    handleNavigation('return', undefined, chromebookId);
  };

  const renderCurrentView = () => {
    if (role === 'teacher' && currentView === 'menu') {
      return <Navigate to="/agendamento" replace />;
    }

    switch (currentView) {
      case 'registration':
        return <RegistrationHub onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />;
      case 'dashboard':
        return <DashboardLayout onBack={handleBackToMenu} />;
      case 'inventory':
        return <InventoryHub onBack={handleBackToMenu} onGenerateQrCode={handleGenerateQrCode} />;
      case 'loan':
        return <LoanHub
          onBack={handleBackToMenu}
          defaultTab={loanTabDefault}
          onNavigateToReturnView={handleNavigateToReturnView}
        />;
      case 'return':
        return <ReturnWrapper
          onBack={handleBackToMenu}
          initialChromebookId={selectedChromebookIdForReturn}
          onReturnSuccess={handleReturnSuccess}
        />;
      case 'audit':
        return <AuditHub />;
      case 'scheduling':
        return <Navigate to="/agendamento" replace />;
      default:
        return (
          <div className="space-y-8">
            <MainMenu onNavigate={handleNavigation} />
          </div>
        );
    }
  };

  const getViewTitle = (): string => {
    switch (currentView) {
      case 'registration': return 'Hub de Cadastros';
      case 'dashboard': return 'Dashboard';
      case 'inventory': return 'Hub de Inventário';
      case 'loan': return 'Empréstimos';
      case 'return': return 'Registrar Devolução';
      case 'audit': return 'Sistema de Contagem';
      case 'scheduling': return 'Agendamento';
      default: return 'Zelote';
    }
  };

  const getViewSubtitle = (): string => {
    switch (currentView) {
      case 'registration': return 'Gerencie o cadastro de equipamentos e usuários';
      case 'dashboard': return 'Análise de uso e estatísticas';
      case 'inventory': return 'Visualize e gerencie o inventário';
      case 'loan': return 'Realize novos empréstimos e veja ativos';
      case 'return': return 'Registre a devolução de equipamentos';
      case 'audit': return 'Realize a contagem física do inventário';
      case 'scheduling': return 'Reserve lotes de equipamentos para suas aulas';
      default: return 'Controle de Chromebooks';
    }
  };

  const loading = dbLoading || roleLoading;

  const menuBackgroundClass = currentView === 'menu'
    ? 'bg-background'
    : 'bg-background';

  return (
    <>
      <Layout
        title={getViewTitle()}
        subtitle={getViewSubtitle()}
        showBackButton={currentView !== 'menu'}
        onBack={handleBackToMenu}
        backgroundClass={menuBackgroundClass}
      >
        {loading && currentView !== 'menu' ? <div className="flex justify-center items-center h-64"><LoadingSpinner /></div> : renderCurrentView()}
      </Layout>
      <QRCodeModal open={showQRCodeModal} onOpenChange={(open) => setShowQRCodeModal(open)} chromebookId={selectedChromebookId ?? undefined} />
    </>
  );
};

export default Index;