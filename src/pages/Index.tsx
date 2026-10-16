// ADIÇÃO: Importamos os hooks de autenticação que o Layout precisará
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';

import { AuditHub } from '@/components/audit/AuditHub';
import { AuditProvider } from '@/providers/AuditProvider';
import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
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
import { LoanHistory } from '@/components/LoanHistory';
import { isNewLoan } from '@/utils/loanCalculations';

type AppView = 'menu' | 'registration' | 'dashboard' | 'inventory' | 'loan' | 'audit' | 'return' | 'scheduling' | 'quick-register' | 'history';

const viewRouteMap: Record<AppView, string> = {
  menu: '/',
  registration: '/cadastros',
  dashboard: '/dashboard',
  inventory: '/inventario',
  loan: '/emprestimos',
  return: '/devolucao',
  audit: '/contagem',
  history: '/historico',
  scheduling: '/agendamento',
  'quick-register': '/cadastros',
};

const getPathView = (pathname: string): AppView => {
  switch (pathname) {
    case '/cadastros': return 'registration';
    case '/dashboard': return 'dashboard';
    case '/inventario': return 'inventory';
    case '/emprestimos': return 'loan';
    case '/devolucao':
    case '/devolucoes': return 'return';
    case '/contagem':
    case '/auditoria': return 'audit';
    case '/historico': return 'history';
    default: return 'menu';
  }
};

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: roleLoading, role } = useProfileRole();
  const { loading: dbLoading, getLoanHistory } = useDatabase();

  const pathView = getPathView(location.pathname);
  const [currentView, setCurrentView] = useState<AppView>(pathView);
  const [loanTabDefault, setLoanTabDefault] = useState<'form' | 'active'>('form');
  const [pendingReturnIds, setPendingReturnIds] = useState<string[]>([]);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);
  const canSeeHistory = role === 'admin' || role === 'super_admin';

  // Sincronizar quando a URL mudar (ex: botão Voltar/Avançar do navegador ou recarregar F5)
  useEffect(() => {
    setCurrentView(pathView);
  }, [pathView]);

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['loan-history'],
    queryFn: getLoanHistory,
    enabled: currentView === 'history' && canSeeHistory
  });

  // Capturar navegação vinda do agendamento ou menu de perfil
  useEffect(() => {
    if (location.state?.fromScheduling && location.state?.reservationData) {
      if (location.pathname !== '/emprestimos') {
        navigate('/emprestimos', { state: location.state, replace: true });
      }
      setCurrentView('loan');
      setLoanTabDefault('form');
    } else if (location.state?.view) {
      const targetView = location.state.view as AppView;
      const targetRoute = viewRouteMap[targetView];
      if (targetRoute && location.pathname !== targetRoute) {
        navigate(targetRoute, { replace: true });
      }
    }
  }, [location.state, location.pathname, navigate]);

  const handleNavigation = (view: AppView, tab?: 'form' | 'active', chromebookId?: string) => {
    if (tab) setLoanTabDefault(tab);
    if (chromebookId && view === 'return') {
      setPendingReturnIds(prev => prev.includes(chromebookId) ? prev : [...prev, chromebookId]);
    }
    if (view === 'scheduling') {
      navigate('/agendamento');
      return;
    }
    const targetRoute = viewRouteMap[view] || '/';
    setCurrentView(view);
    if (location.pathname !== targetRoute) {
      navigate(targetRoute, { state: { tab, chromebookId } });
    }
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setLoanTabDefault('form');
    setPendingReturnIds([]);
    navigate('/');
  };

  const handleGenerateQrCode = (chromebookId: string) => {
    setSelectedChromebookId(chromebookId);
    setShowQRCodeModal(true);
    handleNavigation('inventory');
  };

  const handleRegistrationSuccess = (newChromebook: any) => {
    setSelectedChromebookId(newChromebook.chromebook_id);
    setShowQRCodeModal(true);
    handleNavigation('inventory');
  };

  const handleReturnSuccess = () => {
    handleBackToMenu();
  };

  const handleNavigateToReturnView = (chromebookId: string) => {
    handleNavigation('return', undefined, chromebookId);
  };

  const renderCurrentView = () => {
    if ((role === 'teacher' || role === 'professor' || role === 'manutencao') && currentView === 'menu') {
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
          initialReservationData={location.state?.reservationData}
        />;
      case 'return':
        return <ReturnWrapper
          onBack={handleBackToMenu}
          initialDeviceIds={pendingReturnIds}
          onReturnSuccess={handleReturnSuccess}
        />;
      case 'audit':
        return (
          <AuditProvider>
            <AuditHub />
          </AuditProvider>
        );
      case 'history':
        if (!canSeeHistory) return <div className="p-8 text-center font-bold text-red-500 uppercase">Acesso Negado</div>;
        return <LoanHistory
          history={history || []}
          isNewLoan={(loan) => isNewLoan(loan.loan_date)}
        />;
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
      case 'history': return 'Histórico Completo';
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
      case 'history': return 'Visualize todo o histórico de empréstimos e devoluções';
      case 'scheduling': return 'Reserve lotes de equipamentos para suas aulas';
      default: return 'Controle de Chromebooks';
    }
  };

  const loading = dbLoading || roleLoading || (currentView === 'history' && historyLoading);

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
      <QRCodeModal open={showQRCodeModal} onOpenChange={(open) => setShowQRCodeModal(open)} chromebookId={selectedChromebookId as string} />
    </>
  );
};

export default Index;