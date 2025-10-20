import React, { useState, useCallback, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Computer, Plus, QrCode, Loader2, X, AlertTriangle } from 'lucide-react';
import { toast } from './ui/use-toast';
import { normalizeChromebookId, sanitizeQRCodeData } from '@/utils/security';
import { QRCodeReader } from './QRCodeReader';
import { useChromebookSearch } from '@/hooks/useChromebookSearch';
import { cn } from '@/lib/utils';

interface BatchDeviceInputProps {
  batchDevices: string[];
  setBatchDevices: React.Dispatch<React.SetStateAction<string[]>>;
  onScan: (data: string) => void;
  disabled: boolean;
  filterStatus?: 'disponivel' | 'ativo' | 'all'; // Para validar o status
}

export function BatchDeviceInput({ batchDevices, setBatchDevices, onScan, disabled, filterStatus = 'disponivel' }: BatchDeviceInputProps) {
  const [currentBatchInput, setCurrentBatchInput] = useState("");
  const [isQRReaderOpen, setIsQRReaderOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { chromebooks, loading: searchLoading } = useChromebookSearch();

  const requiredStatus = filterStatus === 'ativo' ? 'emprestado' : 'disponivel';

  // Função de validação centralizada
  const validateAndNormalizeInput = useCallback((rawInput: string) => {
    const normalizedInput = normalizeChromebookId(rawInput);
    
    if (!normalizedInput) {
      return { error: "O ID do dispositivo não pode estar vazio." };
    }
    
    if (batchDevices.includes(normalizedInput)) {
      return { error: `O Chromebook ${normalizedInput} já está na lista.` };
    }
    
    const chromebook = chromebooks.find(cb => cb.chromebook_id === normalizedInput);
    
    if (!chromebook) {
      return { error: `Chromebook ${normalizedInput} não encontrado no inventário.` };
    }
    
    if (chromebook.status !== requiredStatus) {
      return { error: `Status Incorreto: ${chromebook.status.toUpperCase()}. Requerido: ${requiredStatus.toUpperCase()}.` };
    }

    return { normalizedInput, chromebook };
  }, [batchDevices, chromebooks, requiredStatus]);

  // Lógica de adição
  const addDeviceToBatch = useCallback((inputOverride?: string) => {
    const rawInput = inputOverride || currentBatchInput;
    const validation = validateAndNormalizeInput(rawInput);
    
    if (validation.error) {
      toast({
        title: "Erro de Validação",
        description: validation.error,
        variant: "destructive",
      });
      setValidationError(validation.error);
      return;
    }
    
    const { normalizedInput, chromebook } = validation as { normalizedInput: string, chromebook: any };

    setBatchDevices(prev => [...prev, normalizedInput]);
    setCurrentBatchInput("");
    setValidationError(null);
    toast({
      title: "Dispositivo adicionado",
      description: `ID: ${normalizedInput} (${chromebook.model})`,
      variant: "success",
    });
  }, [currentBatchInput, validateAndNormalizeInput, setBatchDevices]);

  const handleQRCodeScan = (data: string) => {
    const sanitizedId = sanitizeQRCodeData(data); 
    
    if (typeof sanitizedId === 'string' && sanitizedId) {
      addDeviceToBatch(sanitizedId);
    }
    setIsQRReaderOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDeviceToBatch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentBatchInput(value);
    setValidationError(null); // Limpa o erro ao digitar
  };

  const removeDeviceFromBatch = (deviceId: string) => {
    setBatchDevices(batchDevices.filter(id => id !== deviceId));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor="batchDevices" className="text-gray-700">
          Dispositivos em Lote (Status Requerido: {requiredStatus.toUpperCase()})
        </Label>
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
          {batchDevices.length} dispositivos
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="w-full">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="batchInput"
                value={currentBatchInput}
                onChange={handleInputChange}
                placeholder="Digite o ID do dispositivo (ex: 12 ou CHR012)"
                className={cn("border-gray-200 w-full bg-white pl-3", validationError && "border-destructive focus-visible:ring-destructive")}
                onKeyDown={handleInputKeyDown}
                disabled={disabled || searchLoading}
              />
              {validationError && (
                <div className="absolute top-full left-0 mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationError}
                </div>
              )}
            </div>
            
            {/* Botão de Adicionar */}
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
        
        <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 max-h-[150px] overflow-y-auto">
          {batchDevices.length > 0 ? (
            <div className="space-y-2">
              {batchDevices.map((deviceId, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Computer className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{deviceId}</span>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => removeDeviceFromBatch(deviceId)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
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
              <span className="text-green-600">dispositivo(s) para {filterStatus === 'ativo' ? 'devolução' : 'empréstimo'}</span>
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