import React, { useState, useCallback, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Computer, Plus, QrCode, Loader2, X, AlertTriangle, Search } from 'lucide-react';
import { toast } from './ui/use-toast';
import { normalizeChromebookId, sanitizeQRCodeData } from '@/utils/security';
import { QRCodeReader } from './QRCodeReader';
import { useChromebookSearch, ChromebookSearchResult } from '@/hooks/useChromebookSearch';
import { cn } from '@/lib/utils';
import ChromebookSearchInput from './ChromebookSearchInput'; // Importando o componente de busca

interface DeviceListInputProps {
  deviceIds: string[];
  setDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;
  disabled: boolean;
  filterStatus?: 'disponivel' | 'emprestado' | 'all'; // Para validar o status
  actionLabel: 'Empréstimo' | 'Devolução';
}

export function DeviceListInput({ deviceIds, setDeviceIds, disabled, filterStatus = 'disponivel', actionLabel }: DeviceListInputProps) {
  const [currentInput, setCurrentInput] = useState("");
  const [isQRReaderOpen, setIsQRReaderOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { chromebooks, loading: searchLoading } = useChromebookSearch();

  const requiredStatus = filterStatus === 'emprestado' ? 'emprestado' : 'disponivel';
  const requiredStatusLabel = requiredStatus === 'emprestado' ? 'Emprestado (Ativo)' : 'Disponível';

  // Função de validação centralizada
  const validateAndNormalizeInput = useCallback((rawInput: string) => {
    const normalizedInput = normalizeChromebookId(rawInput);
    
    if (!normalizedInput) {
      return { error: "O ID do dispositivo não pode estar vazio." };
    }
    
    if (deviceIds.includes(normalizedInput)) {
      return { error: `O Chromebook ${normalizedInput} já está na lista.` };
    }
    
    const chromebook = chromebooks.find(cb => cb.chromebook_id === normalizedInput);
    
    if (!chromebook) {
      return { error: `Chromebook ${normalizedInput} não encontrado no inventário.` };
    }
    
    if (chromebook.status !== requiredStatus) {
      return { error: `Status Incorreto: ${chromebook.status.toUpperCase()}. Requerido: ${requiredStatusLabel}.` };
    }

    return { normalizedInput, chromebook };
  }, [deviceIds, chromebooks, requiredStatus, requiredStatusLabel]);

  // Lógica de adição (usada por digitação manual e QR code)
  const addDevice = useCallback((inputOverride?: string) => {
    const rawInput = inputOverride || currentInput;
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

    setDeviceIds(prev => [...prev, normalizedInput]);
    setCurrentInput("");
    setValidationError(null);
    toast({
      title: "Dispositivo adicionado",
      description: `ID: ${normalizedInput} (${chromebook.model})`,
      variant: "success",
    });
  }, [currentInput, validateAndNormalizeInput, setDeviceIds]);
  
  // Lógica de adição via busca visual (ChromebookSearchInput)
  const handleVisualSelect = useCallback((chromebook: ChromebookSearchResult) => {
    const validation = validateAndNormalizeInput(chromebook.chromebook_id);
    
    if (validation.error) {
      toast({
        title: "Erro de Validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    
    setDeviceIds(prev => [...prev, chromebook.chromebook_id]);
    toast({
      title: "Dispositivo adicionado",
      description: `ID: ${chromebook.chromebook_id} (${chromebook.model})`,
      variant: "success",
    });
  }, [validateAndNormalizeInput, setDeviceIds]);


  const handleQRCodeScan = (data: string) => {
    const sanitizedId = sanitizeQRCodeData(data); 
    
    if (typeof sanitizedId === 'string' && sanitizedId) {
      addDevice(sanitizedId);
    }
    setIsQRReaderOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDevice();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentInput(value);
    setValidationError(null); // Limpa o erro ao digitar
  };

  const removeDevice = (deviceId: string) => {
    setDeviceIds(deviceIds.filter(id => id !== deviceId));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="deviceInput" className="text-foreground font-semibold">
          Adicionar Dispositivo (Status Requerido: {requiredStatusLabel})
        </Label>
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
          {deviceIds.length} selecionado(s)
        </Badge>
      </div>
      
      {/* NOVO: Busca Visual (ChromebookSearchInput) */}
      <ChromebookSearchInput
        selectedChromebook={null} // Sempre nulo para permitir a busca contínua
        onSelect={handleVisualSelect}
        onClear={() => {}} // Não faz nada no modo lista
        disabled={disabled || searchLoading}
        filterStatus={filterStatus}
        onScanClick={() => setIsQRReaderOpen(true)}
        isListMode={true} // Ativa o modo lista
      />
      
      {/* Lista de Dispositivos Adicionados */}
      <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 max-h-[150px] overflow-y-auto dark:bg-card dark:border-border">
        {deviceIds.length > 0 ? (
          <div className="space-y-2">
            {deviceIds.map((deviceId, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 dark:bg-muted/50 dark:border-border">
                <div className="flex items-center gap-2">
                  <Computer className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm text-foreground">{deviceId}</span>
                </div>
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => removeDevice(deviceId)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <Computer className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
            <p className="text-sm">Adicione o primeiro dispositivo</p>
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