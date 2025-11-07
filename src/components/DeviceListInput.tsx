import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Computer, Plus, QrCode, Loader2, X, AlertTriangle, Search, Factory, Tag, Hash } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { normalizeChromebookId, sanitizeQRCodeData } from '@/utils/security';
import { QRCodeReader } from './QRCodeReader';
import { useChromebookSearch, ChromebookSearchResult } from '@/hooks/useChromebookSearch';
import { cn } from '@/lib/utils';
import ChromebookSearchInput from './ChromebookSearchInput'; // Importando o componente de busca
import { useDatabase } from '@/hooks/useDatabase'; // NOVO IMPORT
import type { LoanHistoryItem } from '@/types/database'; // Importando o tipo de histórico

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
  const { getActiveLoans } = useDatabase(); // Usando useDatabase para buscar empréstimos ativos
  const [activeLoansCache, setActiveLoansCache] = useState<LoanHistoryItem[]>([]);
  const [isLoanCacheLoading, setIsLoanCacheLoading] = useState(true);

  // 1. Carregar empréstimos ativos no início
  useEffect(() => {
    const loadLoans = async () => {
      setIsLoanCacheLoading(true);
      const loans = await getActiveLoans();
      setActiveLoansCache(loans);
      setIsLoanCacheLoading(false);
    };
    loadLoans();
  }, [getActiveLoans]);


  // 2. Sincroniza deviceList com deviceIds (apenas para inicialização ou se deviceIds for alterado externamente)
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
  // SIMPLIFICADO: Apenas 'Ativo' ou 'Disponível'
  const requiredStatusLabel = requiredStatus === 'emprestado' ? 'Ativo' : 'Disponível'; 

  // Função de validação centralizada
  const validateAndNormalizeInput = useCallback(async (rawInput: string) => {
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
    
    // 1. Validação de Status (baseada no cache local)
    // Para empréstimo, o status deve ser 'disponivel'
    if (actionLabel === 'Empréstimo' && chromebook.status !== 'disponivel') {
        return { error: `Status Incorreto: ${chromebook.status.toUpperCase()}. Requerido: Disponível.` };
    }
    
    // 2. Validação de Empréstimo Ativo (Verificação de consistência com o DB via loan_history)
    const activeLoan = activeLoansCache.find(loan => loan.chromebook_id === normalizedInput);
    
    if (actionLabel === 'Devolução') {
        // Fluxo de Devolução: Deve ter um empréstimo ativo (status 'ativo' ou 'atrasado' no loan_history)
        if (!activeLoan) {
            return { error: `O Chromebook ${normalizedInput} não possui um empréstimo ativo registrado no sistema.` };
        }
        // Se houver um empréstimo ativo, a devolução é permitida, mesmo que o status do CB esteja inconsistente.
    } else if (actionLabel === 'Empréstimo') {
        // Fluxo de Empréstimo: Não deve ter um empréstimo ativo
        if (activeLoan) {
            // Se o status do CB for 'disponivel' mas houver um empréstimo ativo, é uma inconsistência.
            // Bloqueamos o empréstimo e sugerimos sincronização.
            return { error: `O Chromebook ${normalizedInput} possui um empréstimo ativo no sistema. Tente sincronizar o status no Dashboard.` };
        }
    }

    return { chromebook: chromebook as DeviceListItem };
  }, [deviceList, chromebooks, actionLabel, activeLoansCache]); // Adicionando activeLoansCache como dependência

  // Lógica de adição (usada por busca visual e QR code)
  const addDevice = useCallback(async (chromebook: DeviceListItem) => {
    // Revalida o item antes de adicionar (necessário para o fluxo de busca visual)
    const validation = await validateAndNormalizeInput(chromebook.chromebook_id);
    
    if (validation.error) {
      toast({
        title: "Erro de Validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    
    setDeviceList(prev => {
      const newList = [...prev, validation.chromebook];
      setDeviceIds(newList.map(item => item.chromebook_id)); // Atualiza a lista externa de IDs
      return newList;
    });
    
    toast({
      title: "Dispositivo adicionado",
      description: `ID: ${chromebook.chromebook_id} (${chromebook.model})`,
      variant: "success",
      duration: 2000, // Duração reduzida para microinteração
    });
  }, [validateAndNormalizeInput, setDeviceIds]);


  const handleQRCodeScan = async (data: string) => {
    const sanitizedId = sanitizeQRCodeData(data); 
    
    if (typeof sanitizedId === 'string' && sanitizedId) {
      const validation = await validateAndNormalizeInput(sanitizedId);
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
    const removedItem = deviceList.find(item => item.chromebook_id === deviceId);
    
    setDeviceList(prev => {
      const newList = prev.filter(item => item.chromebook_id !== deviceId);
      setDeviceIds(newList.map(item => item.chromebook_id)); // Atualiza a lista externa de IDs
      return newList;
    });
    
    if (removedItem) {
        toast({
            title: "Dispositivo removido",
            description: `ID: ${removedItem.chromebook_id} removido da lista.`,
            duration: 2000, // Duração reduzida para microinteração
        });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="deviceInput" className="text-foreground font-semibold">
          Adicionar Dispositivo (Status: {actionLabel === 'Devolução' ? 'Emprestado' : 'Disponível'})
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
        disabled={disabled || searchLoading || isLoanCacheLoading}
        filterStatus={filterStatus === 'emprestado' ? 'ativo' : 'disponivel'} // Mapeia para o filtro interno do SearchInput
        onScanClick={() => setIsQRReaderOpen(true)}
        isListMode={true} // Ativa o modo lista
      />
      
      {/* Lista de Dispositivos Adicionados */}
      <div className="mt-2 p-2 bg-card rounded-md border border-border max-h-[250px] overflow-y-auto dark:bg-card dark:border-border">
        {deviceList.length > 0 ? (
          <div className="space-y-2">
            {deviceList.map((chromebook) => (
              <div key={chromebook.chromebook_id} className="flex justify-between items-center p-3 bg-muted/50 rounded border border-border dark:bg-muted/50 dark:border-border">
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