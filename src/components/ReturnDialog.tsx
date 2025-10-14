CHR012) na entrada manual e no lote do diálogo de devolução.">

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
import { Computer, Plus, QrCode } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { sanitizeQRCodeData, normalizeChromebookId } from "@/utils/security"; // Importando a função de normalização

// Define a interface de props do componente
interface ReturnDialogProps {
  open: boolean;                                   // Controla se o diálogo está aberto
  onOpenChange: (open: boolean) => void;           // Função chamada quando o estado de abertura muda
  chromebookId: string;                            // ID do Chromebook a ser devolvido
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
  onConfirm: () => void;                           // Função chamada ao confirmar a devolução
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
  
  // Valor atual do campo de entrada para adicionar dispositivos ao lote
  const [currentBatchInput, setCurrentBatchInput] = useState("");
// Confirmação de verificação do estado do equipamento
  const [confirmChecked, setConfirmChecked] = useState(false);

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  /**
   * Processa o resultado da leitura do QR Code
   * @param result - String com o resultado da leitura do QR Code
   */
  const handleQRCodeScan = (result: string) => {
    // sanitizeQRCodeData já inclui a normalização
    const sanitizedId = sanitizeQRCodeData(result);
    
    if (sanitizedId) {
      if (returnData.type === 'lote') {
        // Para devolução em lote, adiciona à lista se não existir
        if (!batchDevices.includes(sanitizedId)) {
          setBatchDevices([...batchDevices, sanitizedId]);
          toast({
            title: "Dispositivo adicionado ao lote",
            description: `ID do Chromebook: ${sanitizedId}`,
          });
        } else {
          toast({
            title: "Dispositivo já adicionado",
            description: `O Chromebook ${sanitizedId} já está na lista`,
            variant: "destructive",
          });
        }
      } else {
        // Para devolução individual, atualiza o campo de ID
        onChromebookIdChange(sanitizedId);
        toast({
          title: "QR Code lido com sucesso",
          description: `ID do Chromebook: ${sanitizedId}`,
        });
      }
    }
    // Fecha o scanner após processar
    setShowScanner(false);
  };

  /**
   * Adiciona um dispositivo à lista de lote
   * Verifica se o dispositivo já existe na lista antes de adicionar
   */
  const addDeviceToBatch = () => {
    const normalizedInput = normalizeChromebookId(currentBatchInput);
    
    if (normalizedInput && !batchDevices.includes(normalizedInput)) {
      setBatchDevices([...batchDevices, normalizedInput]);
      setCurrentBatchInput(""); // Limpa o campo após adicionar
    } else if (normalizedInput) {
      toast({
        title: "Dispositivo já adicionado",
        description: `O Chromebook ${normalizedInput} já está na lista`,
        variant: "destructive",
      });
    }
  };

  /**
   * Remove um dispositivo da lista de lote
   * @param deviceId - ID do dispositivo a ser removido
   */
  const removeDeviceFromBatch = (deviceId: string) => {
    setBatchDevices(batchDevices.filter(id => id !== deviceId));
  };

  /**
   * Função chamada ao clicar no botão de confirmação
   * Processa a devolução e chama a callback principal
   */
  const handleConfirm = () => {
    if (returnData.type === 'lote') {
      // === DEVOLUÇÃO EM LOTE ===
      
      // Se houver dispositivos na lista, atualiza o campo de IDs
      if (batchDevices.length > 0) {
        // Converte a lista de dispositivos para string, separados por vírgula
        onChromebookIdChange(batchDevices.join(','));
      } else {
        // Se não houver dispositivos, exibe uma mensagem de erro
        toast({
          title: "Erro",
          description: "Adicione pelo menos um dispositivo para devolução em lote",
          variant: "destructive",
        });
        return;
      }
    } else {
      // === DEVOLUÇÃO INDIVIDUAL ===
      // Normaliza o ID antes de enviar para a função principal
      const normalizedId = normalizeChromebookId(chromebookId);
      if (!normalizedId) {
        toast({
          title: "Erro",
          description: "O ID do Chromebook é obrigatório.",
          variant: "destructive",
        });
        return;
      }
      onChromebookIdChange(normalizedId);
    }
    
    // Chama a função de callback para confirmar a devolução
    onConfirm();
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <>
      {/* Diálogo principal de devolução */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Devolução de Chromebook
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Coluna Esquerda - Formulário de Devolução */}
            <div className="space-y-4">
              {/* Seletor de tipo de devolução (individual ou lote) */}
              <div className="space-y-2">
                <Label htmlFor="returnType" className="text-gray-700">
                  Tipo de Devolução
                </Label>
                <Select
                  value={returnData.type}
                  onValueChange={(value: 'individual' | 'lote') => {
                    onReturnDataChange({ ...returnData, type: value });
                    // Limpa o ID do chromebook ao trocar o tipo de devolução
                    if (value === 'individual') {
                      onChromebookIdChange("");
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
                    <Input
                      id="chromebookId"
                      value={chromebookId}
                      onChange={(e) => onChromebookIdChange(e.target.value)}
                      placeholder="Digite o ID do Chromebook (ex: 12 ou CHR012)"
                      className="bg-white border-gray-200"
                    />
                    {/* Botão para escanear QR Code */}
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowScanner(true)}
                    >
                      Escanear QR
                    </Button>
                  </div>
                </div>
              ) : (
                /* Interface de devolução em lote */
                <div className="space-y-2">
                  {/* Cabeçalho com contador de dispositivos */}
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="batchDevices" className="text-gray-700">
                      Dispositivos em Lote
                    </Label>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {batchDevices.length} dispositivos
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Campo para adicionar dispositivos */}
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full">
                        <Input
                          id="batchInput"
                          value={currentBatchInput}
                          onChange={(e) => setCurrentBatchInput(e.target.value)}
                          placeholder="Digite o ID do dispositivo (ex: 12 ou CHR012)"
                          className="bg-white border-gray-200 pr-16"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addDeviceToBatch();
                            }
                          }}
                        />
                        {/* Botão flutuante para adicionar dispositivo */}
                        <Button 
                          type="button"
                          variant="ghost"
                          onClick={addDeviceToBatch}
                          className="absolute right-1 top-1 h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          <span className="text-xs">Adicionar</span>
                        </Button>
                      </div>
                      
                      {/* Botão para escanear QR Code */}
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowScanner(true)}
                        className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Escanear Código QR
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lista de dispositivos adicionados ao lote */}
                  <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200 max-h-[150px] overflow-y-auto">
                    {batchDevices.length > 0 ? (
                      <div className="space-y-2">
                        {/* Lista de dispositivos */}
                        {batchDevices.map((device, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                            <div className="flex items-center gap-2">
                              <Computer className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">{device}</span>
                            </div>
                            {/* Botão para remover dispositivo */}
                            <Button 
                              type="button"
                              variant="ghost"
                              onClick={() => removeDeviceFromBatch(device)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Mensagem quando nenhum dispositivo foi adicionado */
                      <div className="text-center text-gray-500 py-4">
                        <Computer className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum dispositivo adicionado</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
            </div>

            {/* Coluna Direita - Informações do Usuário */}
            <div className="space-y-4">
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

              {/* Resumo da devolução em lote (visível apenas para devolução em lote) */}
              {returnData.type === 'lote' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-700">Resumo da Devolução</h4>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Em Lote
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center bg-white p-3 rounded-md mb-2 border border-blue-100">
                    <span className="text-2xl font-bold text-blue-700 mr-2">{batchDevices.length}</span>
                    <span className="text-blue-600">dispositivos para devolução</span>
                  </div>
                  <div className="text-xs text-blue-600">
                    {batchDevices.length === 0 ? (
                      <p>Adicione dispositivos para devolução</p>
                    ) : (
                      <p>IDs: {batchDevices.slice(0, 3).join(", ")}{batchDevices.length > 3 ? ` e mais ${batchDevices.length - 3}...` : ""}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

{/* Confirmação */}
          <div className="mt-2 p-3 rounded-md border bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <Checkbox id="confirmChecked" checked={confirmChecked} onCheckedChange={(v) => setConfirmChecked(!!v)} />
              <Label htmlFor="confirmChecked" className="text-sm text-gray-700 leading-5">
                Confirmo que verifiquei o estado do equipamento no momento da devolução.
              </Label>
            </div>
          </div>

          {/* Botões de ação no rodapé do diálogo */}
          <DialogFooter className="mt-6 flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!confirmChecked || (returnData.type === 'lote' && batchDevices.length === 0)}
            >
              {returnData.type === 'lote' 
                ? `Confirmar Devolução de ${batchDevices.length} Dispositivos` 
                : "Confirmar Devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Componente de leitura de QR Code (visível apenas quando showScanner = true) */}
      <QRCodeReader
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={handleQRCodeScan}
      />
    </>
  );
}