import React, { useState, useCallback, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Computer, Plus, QrCode, Loader2, X, AlertTriangle, Search, Factory, Tag, Hash } from 'lucide-react';
import { toast } from './ui/use-toast';
import { normalizeChromebookId, sanitizeQRCodeData } from '@/utils/security';
import { QRCodeReader } from './QRCodeReader';
import { useChromebookSearch, ChromebookSearchResult } from '@/hooks/useChromebookSearch';
import { cn } from '@/lib/utils';
import ChromebookSearchInput from './ChromebookSearchInput'; // Importando o componente de busca

// Novo tipo para armazenar o dispositivo completo na lista
interface DeviceListItem extends ChromebookSearchResult {
  // Herda id, chromebook_id, model, status, searchable
}

interface DeviceListInputProps {
  deviceIds: string[]; // Mantemos a prop para compatibilidade externa, mas internamente usamos deviceList
  setDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;
  disabled: boolean;
  filterStatus?: 'disponivel' | 'emprestado' | 'all'; // Para validar o status
  actionLabel: 'Empréstimo' | 'Devolução';
}

export function DeviceListInput({ deviceIds, setDeviceIds, disabled, filterStatus = 'disponivel', actionLabel }: DeviceListInputProps) {
  const [deviceList, setDeviceList] = useState<DeviceListItem[]>([]);
  const [isQRReaderOpen, setIsQRReaderOpen] = useState(false);
  const { chromebooks, loading: searchLoading } = useChromebookSearch();

  // Sincroniza deviceList com deviceIds (apenas para inicialização ou se deviceIds for alterado externamente)
  // No entanto, para evitar loops, vamos gerenciar a lista internamente e apenas atualizar deviceIds no final.
  // Usamos useEffect para garantir que a lista interna reflita a lista externa (deviceIds)
  React.useEffect(() => {
    // Mapeia os IDs externos para os objetos internos, se possível
    const initialList = deviceIds
      .map(id => chromebooks.find(cb => cb.chromebook_id === id))
      .filter((cb): cb is DeviceListItem => !!cb);
      
    if (initialList.length !== deviceList.length || initialList.some((item, index) => item.id !== deviceList[index]?.id)) {
        setDeviceList(initialList);
    }
  }, [deviceIds, chromebooks]);


  const requiredStatus = filterStatus === 'emprestado' ? 'emprestado' : 'disponivel';
  const requiredStatusLabel = requiredStatus === 'emprestado' ? 'Emprestado (Ativo)' : 'Disponível';

  // Função de validação centralizada
  const validateAndNormalizeInput = useCallback((rawInput: string) => {
    const normalizedInput = normalizeChromebookId(rawInput);
    
    if (!normalizedInput) {
      return { error: "O ID do dispositivo não pode estar vazio." };
    }
    
    if (deviceList.some(item => item.chromebook_id === normalizedInput)) {
      return { error: `O Chromebook ${normalizedInput} já está na lista.` };
    }
    
    const chromebook = chromebooks.find(cb => cb.chromebook_id === normalizedInput);
    
    if (!chromebook) {
      return { error: `Chromebook ${normalizedInput} não encontrado no inventário.` };
    }
    
    if (chromebook.status !== requiredStatus) {
      return { error: `Status Incorreto: ${chromebook.status.toUpperCase()}. Requerido: ${requiredStatusLabel}.` };
    }

    return { chromebook: chromebook as DeviceListItem };
  }, [deviceList, chromebooks, requiredStatus, requiredStatusLabel]);

  // Lógica de adição (usada por busca visual e QR code)
  const addDevice = useCallback((chromebook: DeviceListItem) => {
    const validation = validateAndNormalizeInput(chromebook.chromebook_id);
    
    if (validation.error) {
      toast({
        title: "Erro de Validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    
    setDeviceList(prev => {
      const newList = [...prev, chromebook];
      setDeviceIds(newList.map(item => item.chromebook_id)); // Atualiza a lista externa de IDs
      return newList;
    });
    
    toast({
      title: "Dispositivo adicionado",
      description: `ID: ${chromebook.chromebook_id} (${chromebook.model})`,
      variant: "success",
    });
  }, [validateAndNormalizeInput, setDeviceIds]);


  const handleQRCodeScan = (data: string) => {
    const sanitizedId = sanitizeQRCodeData(data); 
    
    if (typeof sanitizedId === 'string' && sanitizedId) {
      const validation = validateAndNormalizeInput(sanitizedId);
      if (validation.error) {
        toast({
          title: "Erro de Validação",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      addDevice(validation.chromebook);
    }
    setIsQRReaderOpen(false);
  };

  const removeDevice = (deviceId: string) => {
    setDeviceList(prev => {
      const newList = prev.filter(item => item.chromebook_id !== deviceId);
      setDeviceIds(newList.map(item => item.chromebook_id)); // Atualiza a lista externa de IDs
      return newList;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="deviceInput" className="text-foreground font-semibold">
          Adicionar Dispositivo (Status Requerido: {requiredStatusLabel})
        </Label>
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
          {deviceList.length} selecionado(s)
        </Badge>
      </div>
      
      {/* Busca Visual (ChromebookSearchInput) */}
      <ChromebookSearchInput
        selectedChromebook={null} // Sempre nulo para permitir a busca contínua
        onSelect={addDevice} // Adiciona o objeto completo
        onClear={() => {}} // Não faz nada no modo lista
        disabled={disabled || searchLoading}
        filterStatus={filterStatus === 'emprestado' ? 'ativo' : 'disponivel'} // Mapeia para o filtro interno do SearchInput
        onScanClick={() => setIsQRReaderOpen(true)}
        isListMode={true} // Ativa o modo lista
      />
      
      {/* Lista de Dispositivos Adicionados */}
      <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 max-h-[150px] overflow-y-auto dark:bg-card dark:border-border">
        {deviceList.length > 0 ? (
          <div className="space-y-2">
            {deviceList.map((chromebook) => (
              <div key={chromebook.chromebook_id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 dark:bg-muted/50 dark:border-border">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Computer className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-medium text-foreground">{chromebook.chromebook_id}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    {/* Linha 1: Fabricante e Modelo */}
                    <div className="flex items-center gap-x-3">
                      {chromebook.manufacturer && (
                        <span className="flex items-center text-gray-700 dark:text-gray-300">
                          <Factory className="h-3 w-3 mr-1" /> {chromebook.manufacturer}
                        </span>
                      )}
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {chromebook.model}
                      </span>
                    </div>
                    
                    {/* Linha 2: Série e Patrimônio */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {chromebook.serial_number && (
                        <span className="flex items-center text-[10px] text-gray-600 dark:text-gray-400">
                          <Hash className="h-3 w-3 mr-1" /> Série: {chromebook.serial_number}
                        </span>
                      )}
                      {chromebook.patrimony_number && (
                        <span className="flex items-center text-[10px] text-gray-600 dark:text-gray-400">
                          <Tag className="h-3 w-3 mr-1" /> Patrimônio: {chromebook.patrimony_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => removeDevice(chromebook.chromebook_id)}
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