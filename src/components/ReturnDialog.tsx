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
import { DeviceListInput } from "./DeviceListInput"; // NOVO IMPORT
import type { ChromebookSearchResult } from '@/hooks/useChromebookSearch'; // NOVO IMPORT
import type { ReturnFormData } from '@/types/database'; // IMPORT CORRETO

// Define a interface de props do componente
interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chromebookId: string; // Mantido para compatibilidade, mas não usado
  onChromebookIdChange: (id: string) => void; // Mantido para compatibilidade, mas não usado
  returnData: ReturnFormData & { notes?: string }; // Usando ReturnFormData
  onReturnDataChange: (data: ReturnFormData & { notes?: string }) => void;
  onConfirm: (ids: string[], returnData: ReturnFormData & { notes?: string }) => void; // ALTERADO: Incluindo notes
}

/**
 * Componente de diálogo para processar devolução de Chromebooks
 */
export function ReturnDialog({
  open,
  onOpenChange,
  chromebookId,
  onChromebookIdChange, // Mantido para compatibilidade
  onReturnDataChange,
  returnData, // Acessando a prop
  onConfirm
}: ReturnDialogProps) {
  // === ESTADOS (STATES) ===
  
  const [deviceIds, setDeviceIds] = useState<string[]>([]); // Lista de IDs de dispositivos
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    onReturnDataChange({
      ...returnData,
      name: user.name,
      ra: user.ra || '',
      email: user.email,
      userType: user.type,
      type: 'lote', // Forçamos 'lote' para o payload, já que o fluxo é unificado
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
      type: 'lote',
    });
  };

  /**
   * Função chamada ao clicar no botão de confirmação
   */
  const handleConfirmClick = () => {
    
    if (!selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione o solicitante usando a busca automática.",
        variant: "destructive",
      });
      return;
    }
    
    if (deviceIds.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um dispositivo para devolução.",
        variant: "destructive",
      });
      return;
    }
    
    // Passa o objeto returnData completo, incluindo 'notes'
    onConfirm(deviceIds, returnData);
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <>
      {/* Diálogo principal de devolução */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-foreground flex items-center gap-2">
              <RotateCcw className="h-6 w-6 text-blue-600" />
              Registrar Devolução
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Coluna Esquerda - Dispositivo/Lote (AGORA AZUL) */}
            <Card className="p-4 space-y-4 bg-blue-50/50 border-blue-100 shadow-inner dark:bg-blue-950/50 dark:border-blue-900/50">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Computer className="h-5 w-5" /> Dispositivos para Devolução
              </CardTitle>
              
              {/* Entrada de Dispositivos Unificada */}
              <DeviceListInput
                deviceIds={deviceIds}
                setDeviceIds={setDeviceIds}
                disabled={false}
                filterStatus="emprestado" // Apenas Chromebooks emprestados
                actionLabel="Devolução"
              />
            </Card>

            {/* Coluna Direita - Informações do Usuário e Observações (VERDE/TEAL) */}
            <div className="space-y-6">
              <Card className="p-4 space-y-4 bg-green-50/50 border-green-100 shadow-inner dark:bg-green-950/50 dark:border-green-900/50">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                  <User className="h-5 w-5" /> Informações do Solicitante
                </CardTitle>
                
                {/* Seletor de Usuário com Autocompletar (ÚNICO CAMPO) */}
                <div className="space-y-2">
                  <Label htmlFor="userSearch" className="text-foreground">
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
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950/50 dark:border-red-900">
                    <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Selecione o solicitante para prosseguir com a devolução.
                    </p>
                  </div>
                )}
              </Card>
              
              {/* Campo de Observações (NEUTRO) */}
              <Card className="p-4 space-y-4 bg-white border-gray-100 shadow-md dark:bg-card dark:border-border">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-700 dark:text-foreground">
                  <AlertTriangle className="h-5 w-5" /> Observações da Devolução
                </CardTitle>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground">
                    Condição do equipamento ou notas sobre a devolução (Opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={returnData.notes || ''}
                    onChange={(e) => onReturnDataChange({ ...returnData, notes: e.target.value })}
                    placeholder="Ex: O Chromebook foi devolvido com a tela trincada."
                    className="bg-white border-gray-200 min-h-[80px] dark:bg-card dark:border-border"
                  />
                </div>
              </Card>
            </div>
          </div>

{/* Confirmação */}
          <div className="mt-4 p-3 rounded-md border bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-900">
            <div className="flex items-start gap-2">
              <Checkbox id="confirmChecked" checked={confirmChecked} onCheckedChange={(v) => setConfirmChecked(!!v)} className="mt-1" />
              <Label htmlFor="confirmChecked" className="text-sm text-foreground leading-5 cursor-pointer">
                <div className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-400">
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
                deviceIds.length === 0
              }
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {`Confirmar Devolução de ${deviceIds.length} Dispositivo${deviceIds.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}