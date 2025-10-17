// ADIÇÃO: Importamos o provedor da nossa nova funcionalidade de auditoria
import { AuditProvider } from '@/providers/AuditProvider'; 

// ADIÇÃO: Importamos os hooks de autenticação que o Layout precisará
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';

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
import { SmartRegistration } from './SmartRegistration'; // Importando a nova página
import type { ReturnFormData, Chromebook } from "@/types/database"; // Importando Chromebook
import { useDatabase } from "@/hooks/useDatabase";

const Index = () => {
  // ADIÇÃO: Chamamos os hooks de autenticação aqui, no componente "pai"
  const { user, logout } = useAuth();
  const { isAdmin, loading: roleLoading } = useProfileRole(user);
  const { loading: dbLoading } = useDatabase();

  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnFormData>({ name: "", ra: "", email: "", type: 'individual', userType: 'aluno' });
  const [currentView, setCurrentView] = useState<'menu' | 'registration' | 'dashboard' | 'inventory' | 'loan' | 'audit' | 'smart-reg'>('menu'); // Adicionado 'smart-reg'
  // Removendo estados relacionados ao modal de QR Code após cadastro
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);
  const [newChromebookData, setNewChromebookData] = useState<Chromebook | undefined>(undefined);

  const handleNavigation = (route: 'registration' | 'dashboard' | 'inventory' | 'loan' | 'return' | 'audit' | 'smart-reg') => {
    if (route === 'return') {
      setOpenReturnDialog(true);
      return;
    }
    setCurrentView(route);
  };

  const handleBackToMenu = () => setCurrentView('menu');

  // Mantemos esta função para que o InventoryHub possa chamá-la
  const handleGenerateQrCode = (chromebookId: string) => {
    setSelectedChromebookId(chromebookId);
    setNewChromebookData(undefined);
    setShowQRCodeModal(true);
  };

  // SIMPLIFICADO: Apenas navega para o inventário
  const handleRegistrationSuccess = (newChromebook: Chromebook) => {
    // O toast de sucesso já foi exibido no ChromebookRegistration
    setCurrentView('inventory');
  };

  const handleReturnClick = () => { /* Sua lógica de devolução */ };

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
      case 'smart-reg': // NOVO: Rota para Cadastro Inteligente
        return <SmartRegistration onBack={handleBackToMenu} />;
      default:
        return (
          <div className="space-y-8">
            <MainMenu onNavigate={handleNavigation} />
            {/* Painéis de Debug removidos */}
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
      case 'audit': return 'Sistema de Contagem';
      case 'smart-reg': return 'Cadastro Inteligente';
      default: return 'Zelote';
    }
  };
  
  const getViewSubtitle = (): string => { 
    switch (currentView) {
      case 'registration': return 'Gerencie todos os cadastros do sistema';
      case 'dashboard': return 'Visão geral e relatórios de uso';
      case 'inventory': return 'Gerencie equipamentos e usuários';
      case 'loan': return 'Registre novos empréstimos e devoluções';
      case 'audit': return 'Realize auditorias de inventário';
      case 'smart-reg': return 'Reconstrução de inventário via QR Code';
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
        <ReturnDialog open={openReturnDialog} onOpenChange={setOpenReturnDialog} chromebookId={chromebookId} onChromebookIdChange={setChromebookId} returnData={returnData} onReturnDataChange={setReturnData} onConfirm={handleReturnClick} />
      </Layout>
      {/* Mantemos o QRCodeModal, mas ele só será aberto manualmente pelo InventoryHub */}
      <QRCodeModal 
        open={showQRCodeModal} 
        onOpenChange={(open) => setShowQRCodeModal(open)} 
        chromebookId={selectedChromebookId ?? undefined} 
        chromebookData={newChromebookData}
      />
    </AuditProvider>
  );
};

export default Index;