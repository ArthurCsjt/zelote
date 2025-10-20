import React, { useState, useCallback } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Computer, Plus, QrCode, Loader2 } from 'lucide-react';
import { toast } from './ui/use-toast';
import { normalizeChromebookId, sanitizeQRCodeData } from '@/utils/security';
import { QRCodeReader } from './QRCodeReader';
import { useChromebookSearch } from '@/hooks/useChromebookSearch'; // Importando o hook de busca

interface BatchDeviceInputProps {
  batchDevices: string[];
  setBatchDevices: React.Dispatch<React.SetStateAction<string[]>>;
  onScan: (data: string) => void;
  disabled: boolean;
  filterStatus?: 'disponivel' | 'ativo' | 'all'; // NOVO: Para validar o status
}

export function BatchDeviceInput({ batchDevices, setBatchDevices, onScan, disabled, filterStatus = 'disponivel' }: BatchDeviceInputProps) {
  const [currentBatchInput, setCurrentBatchInput] = useState("");
  const [isQRReaderOpen, setIsQRReaderOpen] = useState(false);
  const { chromebooks, loading: searchLoading } = useChromebookSearch();

  const handleQRCodeScan = (data: string) => {
    const sanitizedId = sanitizeQRCodeData(data); 
    
    if (typeof sanitizedId === 'string' && sanitizedId) {
      // Tenta adicionar o ID escaneado
      addDeviceToBatch(sanitizedId);
    }
    setIsQRReaderOpen(false);
  };

  const addDeviceToBatch = useCallback((inputOverride?: string) => {
    const rawInput = inputOverride || currentBatchInput;
    const normalizedInput = normalizeChromebookId(rawInput);
    
    if (!normalizedInput) {
      toast({
        title: "Erro",
        description: "O ID do dispositivo não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    
    if (batchDevices.includes(normalizedInput)) {
      toast({
        title: "Dispositivo já adicionado",
        description: `O Chromebook ${normalizedInput} já está na lista`,
        variant: "destructive",
      });
      return;
    }
    
    // 1. Validação de existência e status
    const chromebook = chromebooks.find(cb => cb.chromebook_id === normalizedInput);
    
    if (!chromebook) {
      toast({
        title: "Erro de Inventário",
        description: `Chromebook ${normalizedInput} não encontrado no inventário.`,
        variant: "destructive",
      });
      return;
    }
    
    const requiredStatus = filterStatus === 'ativo' ? 'emprestado' : 'disponivel';
    
    if (chromebook.status !== requiredStatus) {
      toast({
        title: "Status Incorreto",
        description: `O Chromebook ${normalizedInput} está com status: ${chromebook.status.toUpperCase()}. Requerido: ${requiredStatus.toUpperCase()}.`,
        variant: "destructive",
      });
      return;
    }

    // 2. Adiciona se passar na validação
    setBatchDevices(prev => [...prev, normalizedInput]);
    setCurrentBatchInput("");
    toast({
      title: "Dispositivo adicionado",
      description: `ID: ${normalizedInput} (${chromebook.model})`,
      variant: "success",
    });
  }, [currentBatchInput, batchDevices, chromebooks, filterStatus]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDeviceToBatch();
    }
  };

  const removeDeviceFromBatch = (deviceId: string) => {
    setBatchDevices(batchDevices.filter(id => id !== deviceId));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor="batchDevices" className="text-gray-700">
          Dispositivos em Lote
        </Label>
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
          {batchDevices.length} dispositivos
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="w-full">
            <div className="flex gap-2">
              <Input
                id="batchInput"
                value={currentBatchInput}
                onChange={(e) => setCurrentBatchInput(e.target.value)}
                placeholder="Digite o ID do dispositivo (ex: 12 ou CHR012)"
                className="border-gray-200 w-full bg-white"
                onKeyDown={handleInputKeyDown}
                disabled={disabled || searchLoading}
              />
              
              {/* Botão de Adicionar reintroduzido */}
              <Button 
                type="button"
                variant="outline"
                onClick={() => addDeviceToBatch()}
                className="text-green-600 hover:text-green-700 hover:bg-green-100 border-green-200 px-3"
                disabled={disabled || searchLoading || !currentBatchInput.trim()}
              >
                {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="border-gray-200 bg-white hover:bg-gray-50 px-3"
                onClick={() => setIsQRReaderOpen(true)}
                disabled={disabled || searchLoading}
              >
                <QrCode className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 max-h-[150px] overflow-y-auto">
          {batchDevices.length > 0 ? (
            <div className="space-y-2">
              {batchDevices.map((device, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Computer className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{device}</span>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => removeDeviceFromBatch(device)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={disabled}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <Computer className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum dispositivo adicionado</p>
            </div>
          )}
        </div>
        
        {batchDevices.length > 0 && (
          <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg">
            <div className="flex items-center justify-center bg-white p-3 rounded-md mb-2 border border-green-100">
              <span className="text-2xl font-bold text-green-700 mr-2">{batchDevices.length}</span>
              <span className="text-green-600">dispositivo(s) para empréstimo</span>
            </div>
          </div>
        )}
      </div>

      <QRCodeReader
        open={isQRReaderOpen}
        onOpenChange={setIsQRReaderOpen}
        onScan={handleQRCodeScan}
      />
    </div>
  );
}