import React, { useState, useCallback } from 'react';
import { ReturnDialog } from './ReturnDialog';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import type { ReturnFormData } from '@/types/database';

interface ReturnWrapperProps {
  onBack: () => void;
}

export const ReturnWrapper: React.FC<ReturnWrapperProps> = ({ onBack }) => {
  const { bulkReturnChromebooks, loading: dbLoading } = useDatabase();
  const [open, setOpen] = useState(true); // Mantém o diálogo aberto por padrão ao navegar para esta view
  const [returnData, setReturnData] = useState<ReturnFormData & { notes?: string }>({
    name: "",
    ra: "",
    email: "",
    type: 'lote',
    userType: 'aluno',
    notes: ''
  });

  const handleConfirmReturn = useCallback(async (idsToReturn: string[], data: ReturnFormData & { notes?: string }) => {
    if (idsToReturn.length === 0) return;

    try {
      const result = await bulkReturnChromebooks(idsToReturn, data);
      const { successCount, errorCount } = result;
      
      if (successCount > 0) {
        toast({
          title: "Sucesso",
          description: `${successCount} Chromebook(s) devolvido(s) com sucesso.`,
        });
        
        // Limpa o estado e volta para o menu principal
        setReturnData({ name: "", ra: "", email: "", type: 'lote', userType: 'aluno', notes: '' });
        onBack();
      } else if (errorCount > 0) {
        // O erro individual/lote já é toastado dentro do useDatabase
      }
    } catch (error) {
      console.error('Erro ao processar devolução:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar devolução",
        variant: "destructive",
      });
    }
  }, [bulkReturnChromebooks, onBack]);

  // Se o usuário fechar o diálogo, voltamos para o menu
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onBack();
    }
    setOpen(newOpen);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <RotateCcw className="h-6 w-6 text-menu-amber" />
          Registro de Devolução
        </h1>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Menu
        </Button>
      </div>
      
      <ReturnDialog
        open={open}
        onOpenChange={handleOpenChange}
        chromebookId={""} // Não usado no fluxo de lote
        onChromebookIdChange={() => {}}
        returnData={returnData}
        onReturnDataChange={setReturnData}
        onConfirm={handleConfirmReturn}
        isProcessing={dbLoading}
      />
    </div>
  );
};