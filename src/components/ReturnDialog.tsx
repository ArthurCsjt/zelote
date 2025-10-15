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
import { sanitizeQRCodeData, normalizeChromebookId } from "@/utils/security"; // Importando a função de normalização
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Importando Card para melhor agrupamento
import UserAutocomplete from "./UserAutocomplete"; // Importando UserAutocomplete
import type { UserSearchResult } from '@/hooks/useUserSearch'; // Importando tipo de resultado de busca
import { BatchDeviceInput } from "./BatchDeviceInput"; // Importando o componente de lote

// Define a interface de props do componente
interface ReturnDialogProps {
  open: boolean;                                   // Controla se o diálogo está aberto
  onOpenChange: (open: boolean) => void;           // Função chamada quando o diálogo está aberto
  chromebookId: string;                            // ID do Chromebook a ser devolvido (apenas para individual)
  onChromebookIdChange: (id: string) => void;      // Função chamada quando o ID muda
  returnData: {                                    // Dados da pessoa que está devolvendo
    name: string;                                  // Nome do solicitante
    ra?: string;                                   // RA (Registro Acadêmico), opcional
    email: string;                                 // Email do solicitante
    type: 'individual' | 'lote';                   // Tipo de devolução
    userType: 'aluno' | 'professor' | 'funcionario'; // Tipo de usuário
  };
  onReturnDataChange: (data: {                     // Função chamada quando os dados mudam
    name: string;
    ra?: string;
    email: string;
    type: 'individual' | 'lote';
    userType: 'aluno' | 'professor' | 'funcionario';
  }) => void;
  // Alterado o tipo de retorno para incluir a lista de IDs de lote
  onConfirm: (ids: string[], returnData: ReturnFormData) => void;                           // Função chamada ao confirmar a devolução
}

/**
 * Componente de diálogo para processar devolução de Chromebooks
 * Permite devoluções individuais ou em lote
 */
export function ReturnDialog({
  open,
  onOpenChange,
  chromebookId,
  onChromebookIdChange,
  returnData,
  onReturnDataChange,
  onConfirm
}: ReturnDialogProps) {
  // === ESTADOS (STATES) ===
  
  // Controla a exibição do scanner de QR Code
  const [showScanner, setShowScanner] = useState(false);
  
  // Lista de dispositivos para devolução em lote
  const [batchDevices, setBatchDevices] = useState<string[]>([]);
  
  // Confirmação de verificação do estado do equipamento
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Estado para o usuário selecionado via autocompletar
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
    });
  };

  const handleUserClear = () => {
    setSelectedUser(null);
    onReturnDataChange({
      ...returnData,
      name: '',
      ra: '',
      email: '',
      userType: 'aluno', // Volta para o padrão
    });
  };

  /**
   * Processa o resultado da leitura do QR Code
   * @param result - String com o resultado da leitura do QR Code
   */
  const handleQRCodeScan = (result: string) => {
    // sanitizeQRCodeData já inclui a normalização
    const sanitizedId = sanitizeQRCodeData(result);
    
    if (sanitizedId) {
      // O scanner só é aberto para o modo individual neste componente
      onChromebookIdChange(sanitizedId);
      toast({
        title: "QR Code lido com sucesso",
        description: `ID do Chromebook: ${sanitizedId}`,
      });
    }
    // Fecha o scanner após processar
    setShowScanner(false);
  };

  /**
   * Normaliza e valida o ID do Chromebook no modo individual.
   */
  const handleValidateIndividualId = () => {
    const normalizedId = normalizeChromebookId(chromebookId);
    
    if (!normalizedId) {
      toast({
        title: "Erro",
        description: "O ID do Chromebook não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    onChromebookIdChange(normalizedId);

    toast({
      title: "ID Verificado",
      description: `ID normalizado: ${normalizedId}. Pronto para devolução.`,
    });
  };

  /**
   * Função chamada ao clicar no botão de confirmação
   * Processa a devolução e chama a callback principal
   */
  const handleConfirmClick = () => {
    let idsToReturn: string[] = [];
    
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
      const normalizedId = normalizeChromebookId(chromebookId);
      if (!normalizedId) {
        toast({
          title: "Erro",
          description: "O ID do Chromebook é obrigatório.",
          variant: "destructive",
        });
        return;
      }
      idsToReturn = [normalizedId];
    }
    
    // Chama a função de callback para confirmar a devolução, passando os IDs e os dados
    onConfirm(idsToReturn, returnData);
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <>
      {/* Diálogo principal de devolução */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <RotateCcw className="h-6 w-6 text-blue-600" />
              Registrar Devolução
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Coluna Esquerda - Dispositivo/Lote */}
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
                      setBatchDevices([]); // Limpa lote ao mudar para individual
                    } else {
                      onChromebookIdChange(""); // Limpa ID individual ao mudar para lote
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
                /* Campo de ID para devolução individual */
                <div className="space-y-2">
                  <Label htmlFor="chromebookId" className="text-gray-700">
                    ID do Chromebook
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="chromebookId"
                        value={chromebookId}
                        onChange={(e) => onChromebookIdChange(e.target.value)}
                        placeholder="Digite o ID do Chromebook (ex: 12 ou CHR012)"
                        className="bg-white border-gray-200 pr-10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleValidateIndividualId();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={handleValidateIndividualId}
                        className="absolute right-1 top-1 h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                        title="Validar ID"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Botão para escanear QR Code */}
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowScanner(true)}
                      className="bg-white hover:bg-gray-50"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Interface de devolução em lote (usando BatchDeviceInput) */
                <BatchDeviceInput
                  batchDevices={batchDevices}
                  setBatchDevices={setBatchDevices}
                  onScan={handleQRCodeScan} // Passamos a função de adicionar para o scanner interno
                  disabled={false}
                />
              )}
            </Card>

            {/* Coluna Direita - Informações do Usuário */}
            <Card className="p-4 space-y-4 bg-white border-gray-100 shadow-md">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                <User className="h-5 w-5" /> Informações do Solicitante
              </CardTitle>
              
              {/* NOVO: Seletor de Usuário com Autocompletar */}
              <div className="space-y-2">
                <Label htmlFor="userSearch" className="text-gray-700">
                  Buscar Solicitante (Nome, RA ou Email)
                </Label>
                <UserAutocomplete
                  selectedUser={selectedUser}
                  onSelect={handleUserSelect}
                  onClear={handleUserClear}
                  disabled={false} // Deve estar sempre habilitado
                />
              </div>

              {/* Campos de Usuário (Exibidos apenas se NENHUM usuário estiver selecionado) */}
              {!selectedUser && (
                <>
                  {/* Seletor de tipo de usuário */}
                  <div className="space-y-2">
                    <Label htmlFor="userType" className="text-gray-700">
                      Tipo de Solicitante
                    </Label>
                    <Select
                      value={returnData.userType}
                      onValueChange={(value: 'aluno' | 'professor' | 'funcionario') =>
                        onReturnDataChange({ ...returnData, userType: value })
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue placeholder="Selecione o tipo de solicitante" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluno">Aluno</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo de nome do solicitante */}
                  <div className="space-y-2">
                    <Label htmlFor="returnerName" className="text-gray-700">
                      Nome do Solicitante
                    </Label>
                    <Input
                      id="returnerName"
                      value={returnData.name}
                      onChange={(e) => onReturnDataChange({ ...returnData, name: e.target.value })}
                      placeholder="Digite o nome do solicitante"
                      className="bg-white border-gray-200"
                    />
                  </div>

                  {/* Campo de RA (apenas para alunos) */}
                  {returnData.userType === 'aluno' && (
                    <div className="space-y-2">
                      <Label htmlFor="returnerRA" className="text-gray-700">
                        RA do Aluno (opcional)
                      </Label>
                      <Input
                        id="returnerRA"
                        value={returnData.ra}
                        onChange={(e) => onReturnDataChange({ ...returnData, ra: e.target.value })}
                        placeholder="Digite o RA"
                        className="bg-white border-gray-200"
                      />
                    </div>
                  )}

                  {/* Campo de email */}
                  <div className="space-y-2">
                    <Label htmlFor="returnerEmail" className="text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="returnerEmail"
                      type="email"
                      value={returnData.email}
                      onChange={(e) => onReturnDataChange({ ...returnData, email: e.target.value })}
                      placeholder="Digite o email"
                      className="bg-white border-gray-200"
                      required
                    />
                  </div>
                </>
              )}
            </Card>
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
              disabled={!confirmChecked || (returnData.type === 'lote' && batchDevices.length === 0 && !chromebookId)}
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
      {/* Mantemos o scanner aqui apenas para o modo INDIVIDUAL, o modo LOTE usa o scanner interno do BatchDeviceInput */}
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