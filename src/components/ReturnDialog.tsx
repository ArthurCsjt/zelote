import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { QRCodeReader } from "./QRCodeReader";
import { toast } from "./ui/use-toast";
import { Textarea } from "./ui/textarea";
import { Computer, Plus, QrCode, User, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { sanitizeQRCodeData, normalizeChromebookId } from "@/utils/security";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import UserAutocomplete from "./UserAutocomplete";
import type { UserSearchResult } from '@/hooks/useUserSearch';
import { BatchDeviceInput } from "./BatchDeviceInput";
import ChromebookSearchInput from "./ChromebookSearchInput"; // NOVO IMPORT
import type { ChromebookSearchResult } from '@/hooks/useChromebookSearch'; // NOVO IMPORT
import type { ReturnFormData } from '@/types/database'; // IMPORT CORRETO

// Define a interface de props do componente
interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chromebookId: string;
  onChromebookIdChange: (id: string) => void;
  returnData: ReturnFormData & { notes?: string }; // Usando ReturnFormData
  onReturnDataChange: (data: ReturnFormData & { notes?: string }) => void;
  onConfirm: (ids: string[], returnData: ReturnFormData) => void;
}

/**
 * Componente de diálogo para processar devolução de Chromebooks
 */
export function ReturnDialog({
  open,
  onOpenChange,
  chromebookId,
  onReturnDataChange,
  returnData, // Acessando a prop
  onConfirm
}: ReturnDialogProps) {
  // === ESTADOS (STATES) ===
  
  const [showScanner, setShowScanner] = useState(false);
  const [batchDevices, setBatchDevices] = useState<string[]>([]);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedChromebook, setSelectedChromebook] = useState<ChromebookSearchResult | null>(null); // NOVO ESTADO

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    onReturnDataChange({
      ...returnData,
      name: user.name,
      ra: user.ra || '',
      email: user.email,
      userType: user.type,
    });
  };

  const handleUserClear = () => {
    setSelectedUser(null);
    onReturnDataChange({
      ...returnData,
      name: '',
      ra: '',
      email: '',
      userType: 'aluno',
    });
  };
  
  const handleChromebookSelect = (chromebook: ChromebookSearchResult) => {
    // 1. Verifica se o status é 'emprestado' (ativo)
    if (chromebook.status !== 'emprestado') {
      toast({
        title: "Chromebook Indisponível",
        description: `O Chromebook ${chromebook.chromebook_id} não está registrado como emprestado. Status: ${chromebook.status.toUpperCase()}.`,
        variant: "destructive",
      });
      setSelectedChromebook(null);
      return;
    }
    
    // 2. Se estiver emprestado, seleciona
    setSelectedChromebook(chromebook);
  };
  
  const handleChromebookClear = () => {
    setSelectedChromebook(null);
  };

  /**
   * Processa o resultado da leitura do QR Code
   */
  const handleQRCodeScan = (result: string) => {
    const sanitizedId = sanitizeQRCodeData(result);
    
    if (typeof sanitizedId === 'string' && sanitizedId) {
      // No modo individual, o Autocomplete fará a busca e validação
      // Aqui, apenas notificamos o usuário para usar a busca
      toast({
        title: "QR Code lido",
        description: `ID do Chromebook: ${sanitizedId}. Use a busca para selecionar e confirmar a devolução.`,
        variant: "info",
      });
    }
    setShowScanner(false);
  };

  /**
   * Função chamada ao clicar no botão de confirmação
   */
  const handleConfirmClick = () => {
    let idsToReturn: string[] = [];
    
    if (!selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione o solicitante usando a busca automática.",
        variant: "destructive",
      });
      return;
    }
    
    if (returnData.type === 'lote') {
      // === DEVOLUÇÃO EM LOTE ===
      if (batchDevices.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um dispositivo para devolução em lote",
          variant: "destructive",
        });
        return;
      }
      idsToReturn = batchDevices;
    } else {
      // === DEVOLUÇÃO INDIVIDUAL ===
      if (!selectedChromebook) {
        toast({
          title: "Erro",
          description: "Selecione um Chromebook ativo para devolução.",
          variant: "destructive",
        });
        return;
      }
      idsToReturn = [selectedChromebook.chromebook_id];
    }
    
    // Prepara os dados de retorno, excluindo 'notes' se não for parte do tipo ReturnFormData
    const { notes, ...baseReturnData } = returnData;
    
    // Chama a função de callback para confirmar a devolução, passando os IDs e os dados
    onConfirm(idsToReturn, baseReturnData);
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <>
      {/* Diálogo principal de devolução */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <RotateCcw className="h-6 w-6 text-blue-600" />
              Registrar Devolução
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Coluna Esquerda - Dispositivo/Lote (AGORA AZUL) */}
            <Card className="p-4 space-y-4 bg-blue-50/50 border-blue-100 shadow-inner">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                <Computer className="h-5 w-5" /> Detalhes do Equipamento
              </CardTitle>
              
              {/* Seletor de tipo de devolução (individual ou lote) */}
              <div className="space-y-2">
                <Label htmlFor="returnType" className="text-gray-700">
                  Tipo de Devolução
                </Label>
                <Select
                  value={returnData.type}
                  onValueChange={(value: 'individual' | 'lote') => {
                    onReturnDataChange({ ...returnData, type: value });
                    if (value === 'individual') {
                      setBatchDevices([]);
                    } else {
                      setSelectedChromebook(null); // Limpa ID individual ao mudar para lote
                    }
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Selecione o tipo de devolução" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="lote">Em Lote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos específicos para cada tipo de devolução */}
              {returnData.type === 'individual' ? (
                /* Campo de ID para devolução individual (AGORA COM AUTOCOMPLETE) */
                <div className="space-y-2">
                  <Label htmlFor="chromebookId" className="text-gray-700">
                    ID do Chromebook *
                  </Label>
                  <ChromebookSearchInput
                      selectedChromebook={selectedChromebook}
                      onSelect={handleChromebookSelect}
                      onClear={handleChromebookClear}
                      disabled={false}
                      filterStatus="ativo" // Apenas Chromebooks emprestados
                      onScanClick={() => setShowScanner(true)}
                  />
                </div>
              ) : (
                /* Interface de devolução em lote (usando BatchDeviceInput) */
                <BatchDeviceInput
                  batchDevices={batchDevices}
                  setBatchDevices={setBatchDevices}
                  onScan={handleQRCodeScan}
                  disabled={false}
                  filterStatus="ativo" // Passa o filtro para o BatchDeviceInput
                />
              )}
            </Card>

            {/* Coluna Direita - Informações do Usuário e Observações (VERDE/TEAL) */}
            <div className="space-y-6">
              <Card className="p-4 space-y-4 bg-green-50/50 border-green-100 shadow-inner">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <User className="h-5 w-5" /> Informações do Solicitante
                </CardTitle>
                
                {/* Seletor de Usuário com Autocompletar (ÚNICO CAMPO) */}
                <div className="space-y-2">
                  <Label htmlFor="userSearch" className="text-gray-700">
                    Buscar Solicitante (Nome, RA ou Email) *
                  </Label>
                  <UserAutocomplete
                    selectedUser={selectedUser}
                    onSelect={handleUserSelect}
                    onClear={handleUserClear}
                    disabled={false}
                  />
                </div>
                
                {/* Mensagem de aviso se nenhum usuário for selecionado */}
                {!selectedUser && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Selecione o solicitante para prosseguir com a devolução.
                    </p>
                  </div>
                )}
              </Card>
              
              {/* Campo de Observações (NEUTRO) */}
              <Card className="p-4 space-y-4 bg-white border-gray-100 shadow-md">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                  <AlertTriangle className="h-5 w-5" /> Observações da Devolução
                </CardTitle>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-700">
                    Condição do equipamento ou notas sobre a devolução (Opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={returnData.notes || ''}
                    onChange={(e) => onReturnDataChange({ ...returnData, notes: e.target.value })}
                    placeholder="Ex: O Chromebook foi devolvido com a tela trincada."
                    className="bg-white border-gray-200 min-h-[80px]"
                  />
                </div>
              </Card>
            </div>
          </div>

{/* Confirmação */}
          <div className="mt-4 p-3 rounded-md border bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <Checkbox id="confirmChecked" checked={confirmChecked} onCheckedChange={(v) => setConfirmChecked(!!v)} className="mt-1" />
              <Label htmlFor="confirmChecked" className="text-sm text-gray-700 leading-5 cursor-pointer">
                <div className="flex items-center gap-1 font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Verificação Obrigatória
                </div>
                Confirmo que verifiquei o estado físico do equipamento (danos, acessórios) no momento da devolução.
              </Label>
            </div>
          </div>

          {/* Botões de ação no rodapé do diálogo */}
          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={
                !confirmChecked || 
                !selectedUser ||
                (returnData.type === 'lote' && batchDevices.length === 0) ||
                (returnData.type === 'individual' && !selectedChromebook)
              }
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {returnData.type === 'lote' 
                ? `Confirmar Devolução de ${batchDevices.length} Dispositivo${batchDevices.length !== 1 ? 's' : ''}` 
                : "Confirmar Devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Componente de leitura de QR Code (visível apenas quando showScanner = true) */}
      {returnData.type === 'individual' && (
        <QRCodeReader
          open={showScanner}
          onOpenChange={setShowScanner}
          onScan={handleQRCodeScan}
        />
      )}
    </>
  );
}