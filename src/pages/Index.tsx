// ADIÇÃO: Importamos o provedor da nossa nova funcionalidade de auditoria
import { AuditProvider } from '@/providers/AuditProvider'; 

// ADIÇÃO: Importamos os hooks de autenticação que o Layout precisará
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';

import { AuditHub } from '@/components/audit/AuditHub';
import { useState } from "react";
import { RegistrationHub } from "@/components/RegistrationHub";
import Layout from "@/components/Layout";
import { MainMenu } from "@/components/MainMenu";
import { InventoryHub } from "@/components/InventoryHub";
import { Dashboard } from "@/components/Dashboard";
import { QRCodeModal } from "@/components/QRCodeModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoanHub } from "@/components/LoanHub";
import { useDatabase } from "@/hooks/useDatabase";
import { QuickRegisterWrapper } from '@/components/QuickRegisterWrapper';
import { ReturnWrapper } from '@/components/ReturnWrapper'; // NOVO IMPORT

const Index = () => {
  // ADIÇÃO: Chamamos os hooks de autenticação aqui, no componente "pai"
  const { user, logout } = useAuth();
  const { isAdmin, loading: roleLoading } = useProfileRole();
  const { loading: dbLoading } = useDatabase();

  // ATUALIZADO: Reintroduzindo 'return' na lista de views
  const [currentView, setCurrentView] = useState<'menu' | 'registration' | 'dashboard' | 'inventory' | 'loan' | 'audit' | 'quick-register' | 'return'>('menu');
  // ATUALIZADO: O LoanHub agora aceita 'form' ou 'active'
  const [loanTabDefault, setLoanTabDefault] = useState<'form' | 'active'>('form'); 
  const [selectedChromebookIdForReturn, setSelectedChromebookIdForReturn] = useState<string | undefined>(undefined); // NOVO ESTADO para pré-seleção
  
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);

  // ATUALIZADO: Adicionando o parâmetro opcional 'tab' e 'chromebookId'
  const handleNavigation = (route: 'registration' | 'dashboard' | 'loan' | 'inventory' | 'audit' | 'quick-register' | 'return', tab?: 'form' | 'active', chromebookId?: string) => {
    
    if (route === 'loan') {
      setLoanTabDefault(tab || 'form');
    }
    
    if (route === 'return' && chromebookId) {
      setSelectedChromebookIdForReturn(chromebookId);
    } else {
      setSelectedChromebookIdForReturn(undefined);
    }
    
    setCurrentView(route);
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setLoanTabDefault('form'); // Reseta para o padrão ao voltar
    setSelectedChromebookIdForReturn(undefined);
  };

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
  
  const handleReturnSuccess = () => {
    // Após a devolução, volta para o menu principal
    handleBackToMenu();
  };
  
  // Função para ser passada para ActiveLoans via LoanHub
  const handleNavigateToReturnView = (chromebookId: string) => {
    handleNavigation('return', undefined, chromebookId);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'registration':
        return <RegistrationHub onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />;
      case 'dashboard':
        return <Dashboard onBack={handleBackToMenu} />;
      case 'inventory':
        return <InventoryHub onBack={handleBackToMenu} onGenerateQrCode={handleGenerateQrCode} />;
      case 'loan':
        // PASSANDO A FUNÇÃO DE NAVEGAÇÃO PARA DEVOLUÇÃO
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
      case 'quick-register':
        return <QuickRegisterWrapper onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />;
      default:
        return <MainMenu onNavigate={handleNavigation} />;
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
      case 'quick-register': return 'Re-Cadastro Rápido';
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
      case 'quick-register': return 'Re-cadastre um Chromebook rapidamente';
      default: return 'Controle de Chromebooks';
    }
  };
  
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