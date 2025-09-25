// src/pages/Index.tsx - VERSÃO FINAL CORRIGIDA

import { useState, useCallback, useEffect } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";
import { RegistrationHub } from "@/components/RegistrationHub";
import Layout from "@/components/Layout";
import { ReturnDialog } from "@/components/ReturnDialog";
import { MainMenu } from "@/components/MainMenu";
import { InventoryHub } from "@/components/InventoryHub";
import { Dashboard } from "@/components/Dashboard";
import { QRCodeModal } from "@/components/QRCodeModal"; // Importe o QRCodeModal aqui
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { LoanFormData, ReturnFormData, LoanHistoryItem } from "@/types/database";

const Index = () => {
  const { 
    createLoan, 
    getActiveLoans, 
    getLoanHistory, 
    returnChromebookById,
    loading 
  } = useDatabase();

  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [chromebookId, setChromebookId] = useState("");
  const [returnData, setReturnData] = useState<ReturnFormData>({
    name: "", ra: "", email: "", type: 'individual', userType: 'aluno'
  });
  const [currentView, setCurrentView] = useState<'menu' | 'registration' | 'dashboard' | 'inventory'>('menu');
  
  // --- ESTADO CENTRALIZADO PARA O QR CODE ---
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);

  const handleNavigation = (route: 'registration' | 'dashboard' | 'inventory') => {
    setCurrentView(route);
  };
  
  const handleBackToMenu = useCallback(() => {
    setCurrentView('menu');
  }, []);

  // --- FUNÇÕES PARA CONTROLAR O QR CODE ---
  // Chamada pelo InventoryHub para abrir o modal com o ID de um item existente
  const handleGenerateQrCodeFromInventory = (chromebookId: string) => {
    setSelectedChromebookId(chromebookId);
    setShowQRCodeModal(true);
  };

  // Chamada pelo RegistrationHub após um novo cadastro ter sucesso
  const handleRegistrationSuccess = (newChromebook: any) => {
    setSelectedChromebookId(newChromebook.chromebookId); // Pega o ID correto
    setShowQRCodeModal(true); // Mostra o modal
    // O ideal é que o InventoryHub recarregue seus dados, o que ele já deve fazer ao ser montado.
    setCurrentView('inventory'); // Navega para o inventário para ver o novo item na lista
  };

  // Funções de devolução (mantidas como estavam)
  const handleReturnClick = useCallback(async () => {
    // seu código de devolução continua o mesmo...
    try {
       if (!returnData.name || !returnData.email) {
         toast({ title: "Erro", description: "Por favor, preencha os campos obrigatórios", variant: "destructive" });
         return;
       }
       if (returnData.type === 'individual') {
         if (!chromebookId.trim()) {
           toast({ title: "Erro", description: "ID do Chromebook não informado", variant: "destructive" });
           return;
         }
         const success = await returnChromebookById(chromebookId.trim(), returnData);
         if (success) {
           setOpenReturnDialog(false);
          // Idealmente, o loadData do inventário deveria ser chamado aqui se ele estiver visível
         }
       } else {
        // Lógica de devolução em lote...
      }
    } catch (error) {
      console.error("Erro ao processar devolução:", error);
      toast({ title: "Erro", description: "Ocorreu um erro ao processar a devolução", variant: "destructive" });
    }
  }, [returnData, chromebookId, returnChromebookById]);

  const renderCurrentView = () => {
    if (loading && currentView !== 'menu') {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    switch (currentView) {
      case 'registration':
        return (
          <div className="animate-in fade-in duration-300">
            {/* Passamos a função de sucesso para o RegistrationHub */}
            <RegistrationHub onBack={handleBackToMenu} onRegistrationSuccess={handleRegistrationSuccess} />
          </div>
        );
      case 'dashboard':
        return (
          <div className="animate-in fade-in duration-300">
            <Dashboard onBack={handleBackToMenu} />
          </div>
        );
      case 'inventory':
        return (
          <div className="animate-in fade-in duration-300">
            {/* Passamos a função para gerar QR Code para o InventoryHub */}
            <InventoryHub onBack={handleBackToMenu} onGenerateQrCode={handleGenerateQrCodeFromInventory} />
          </div>
        );
      default:
        return <MainMenu onNavigate={handleNavigation} />;
    }
  };

  const getViewTitle = () => { /* seu código de título continua o mesmo... */ 
    switch(currentView) {
        case 'registration': return "Hub de Cadastros";
        case 'inventory': return "Hub de Inventário";
        case 'dashboard': return "Dashboard";
        default: return "Sistema de Gerenciamento de Chromebooks";
    }
  };
  const getViewSubtitle = () => { /* seu código de subtítulo continua o mesmo... */ 
    switch(currentView) {
        case 'registration': return "Cadastre novos dispositivos, alunos e mais";
        case 'inventory': return "Gerencie e edite os equipamentos cadastrados";
        case 'dashboard': return "Visualize estatísticas e relatórios";
        default: return "Gerencie o cadastro, empréstimo e devolução de Chromebooks";
    }
  };

  return (
    <>
      <Layout 
        title={getViewTitle()} 
        subtitle={getViewSubtitle()} 
        showBackButton={currentView !== 'menu'} 
        onBack={handleBackToMenu}
      >
        {renderCurrentView()}
        
        <ReturnDialog 
          open={openReturnDialog} 
          onOpenChange={setOpenReturnDialog} 
          chromebookId={chromebookId} 
          onChromebookIdChange={setChromebookId} 
          returnData={returnData} 
          onReturnDataChange={setReturnData} 
          onConfirm={handleReturnClick} 
        />
      </Layout>

      {/* O MODAL DE QR CODE AGORA FICA AQUI, NA PÁGINA PRINCIPAL */}
      <QRCodeModal
        isOpen={showQRCodeModal}
        onClose={() => setShowQRCodeModal(false)}
        chromebookId={selectedChromebookId}
      />
    </>
  );
};

export default Index;