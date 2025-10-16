import { AuditProvider } from '@/providers/AuditProvider'; 
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';

import { useState } from "react";
import { QRCodeModal } from "@/components/QRCodeModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dashboard } from "@/components/Dashboard"; // Importando Dashboard
import type { Chromebook } from "@/types/database"; 
import { useDatabase } from "@/hooks/useDatabase";

const Index = () => {
  const { user } = useAuth();
  const { loading: roleLoading } = useProfileRole();
  const { loading: dbLoading } = useDatabase();

  // Estados relacionados ao modal de QR Code (mantidos para uso no InventoryHub)
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedChromebookId, setSelectedChromebookId] = useState<string | null>(null);
  const [newChromebookData, setNewChromebookData] = useState<Chromebook | undefined>(undefined);

  // Mantemos esta função para que o InventoryHub possa chamá-la
  const handleGenerateQrCode = (chromebookId: string) => {
    setSelectedChromebookId(chromebookId);
    setNewChromebookData(undefined);
    setShowQRCodeModal(true);
  };

  // SIMPLIFICADO: Apenas navega para o inventário
  const handleRegistrationSuccess = (newChromebook: Chromebook) => {
    setSelectedChromebookId(newChromebook.chromebook_id);
    setNewChromebookData(newChromebook);
    setShowQRCodeModal(true);
  };
  
  const loading = dbLoading || roleLoading;

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner/></div>;
  }

  // O Index agora renderiza o Dashboard por padrão, pois a navegação é feita pelo App.tsx
  return (
    <AuditProvider>
      <Dashboard />
      
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