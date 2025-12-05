import React, { useState, useCallback, useEffect } from 'react';
import { Label } from './ui/label';
import { Computer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { normalizeChromebookId, sanitizeQRCodeData } from '@/utils/security';
import { QRCodeReader } from './QRCodeReader';
import { useChromebookSearch, ChromebookSearchResult } from '@/hooks/useChromebookSearch';
import { cn } from '@/lib/utils';
import ChromebookSearchInput from './ChromebookSearchInput';
import { useDatabase } from '@/hooks/useDatabase';
import type { LoanHistoryItem } from '@/types/database';
import { DeviceCard } from './DeviceCard';

interface DeviceListItem extends ChromebookSearchResult {
  loanStatus: 'ativo' | 'inativo' | 'atrasado' | 'desconhecido';
}

interface DeviceListInputProps {
  deviceIds: string[];
  setDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;
  disabled: boolean;
  filterStatus?: 'disponivel' | 'emprestado' | 'all';
  actionLabel: 'Empréstimo' | 'Devolução';
}

export function DeviceListInput({ deviceIds, setDeviceIds, disabled, filterStatus = 'disponivel', actionLabel }: DeviceListInputProps) {
  const [deviceList, setDeviceList] = useState<DeviceListItem[]>([]);
  const [isQRReaderOpen, setIsQRReaderOpen] = useState(false);
  const { chromebooks, loading: searchLoading } = useChromebookSearch();
  const { getActiveLoans } = useDatabase();
  const [activeLoansCache, setActiveLoansCache] = useState<LoanHistoryItem[]>([]);
  const [isLoanCacheLoading, setIsLoanCacheLoading] = useState(true);

  useEffect(() => {
    const loadLoans = async () => {
      setIsLoanCacheLoading(true);
      const loans = await getActiveLoans();
      setActiveLoansCache(loans);
      setIsLoanCacheLoading(false);
    };
    loadLoans();
  }, [getActiveLoans]);

  React.useEffect(() => {
    const initialList = deviceIds
      .map(id => {
        const chromebook = chromebooks.find(cb => cb.chromebook_id === id);
        if (!chromebook) return null;

        const activeLoan = activeLoansCache.find(loan => loan.chromebook_id === id);

        return {
          ...chromebook,
          loanStatus: activeLoan ? (activeLoan.status === 'atrasado' ? 'atrasado' : 'ativo') : 'inativo'
        } as DeviceListItem;
      })
      .filter((cb): cb is DeviceListItem => !!cb);

    if (initialList.length !== deviceList.length || initialList.some((item, index) => item.id !== deviceList[index]?.id)) {
      setDeviceList(initialList);
    }
  }, [deviceIds, chromebooks, activeLoansCache]);

  const requiredStatus = filterStatus === 'emprestado' ? 'emprestado' : 'disponivel';
  const requiredStatusLabel = requiredStatus === 'emprestado' ? 'Emprestado' : 'Disponível';

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

    const activeLoan = activeLoansCache.find(loan => loan.chromebook_id === normalizedInput);
    const loanStatus: DeviceListItem['loanStatus'] = activeLoan ? (activeLoan.status === 'atrasado' ? 'atrasado' : 'ativo') : 'inativo';

    if (actionLabel === 'Empréstimo') {
      if (chromebook.status !== 'disponivel') {
        return { error: `Status Incorreto: ${chromebook.status.toUpperCase()}. Requerido: Disponível.` };
      }
      if (loanStatus === 'ativo' || loanStatus === 'atrasado') {
        return { error: `O Chromebook ${normalizedInput} possui um empréstimo ativo no sistema.` };
      }
    }

    if (actionLabel === 'Devolução') {
      if (loanStatus === 'inativo') {
        return { error: `O Chromebook ${normalizedInput} não possui um empréstimo ativo registrado.` };
      }
    }

    return { chromebook: { ...chromebook, loanStatus } as DeviceListItem };
  }, [deviceList, chromebooks, actionLabel, activeLoansCache]);

  const addDevice = useCallback(async (chromebook: ChromebookSearchResult) => {
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
      setDeviceIds(newList.map(item => item.chromebook_id));
      return newList;
    });

    toast({
      title: "✓ Dispositivo adicionado",
      description: `${chromebook.chromebook_id} (${chromebook.model})`,
      variant: "success",
      duration: 2000,
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
      setDeviceIds(newList.map(item => item.chromebook_id));
      return newList;
    });

    if (removedItem) {
      toast({
        title: "Dispositivo removido",
        description: `${removedItem.chromebook_id} removido da lista.`,
        duration: 2000,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="deviceInput" className="text-foreground font-semibold text-sm">
          Adicionar Dispositivo (Status Requerido: {requiredStatusLabel})
        </Label>
      </div>

      <ChromebookSearchInput
        selectedChromebook={null}
        onSelect={addDevice}
        onClear={() => { }}
        disabled={disabled || searchLoading || isLoanCacheLoading}
        filterStatus={filterStatus === 'emprestado' ? 'ativo' : 'disponivel'}
        onScanClick={() => setIsQRReaderOpen(true)}
        isListMode={true}
      />

      {/* Lista de Dispositivos - NOVO DESIGN */}
      <div className="mt-3 p-3 bg-card/50 rounded-lg border border-border/50 max-h-[280px] overflow-y-auto backdrop-blur-sm transition-all duration-300">
        {deviceList.length > 0 ? (
          <div className="space-y-2">
            {deviceList.map((chromebook, index) => (
              <DeviceCard
                key={chromebook.chromebook_id}
                deviceId={chromebook.chromebook_id}
                status={chromebook.status}
                condition={chromebook.condition}
                onRemove={() => removeDevice(chromebook.chromebook_id)}
                variant={actionLabel === 'Empréstimo' ? 'loan' : 'return'}
                showDetails={true}
                className="animate-in slide-in-from-left-3 fade-in duration-300"
                style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8 animate-in fade-in duration-500">
            <Computer className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium">Nenhum dispositivo adicionado</p>
            <p className="text-xs mt-1 text-muted-foreground/70">Use a busca acima para adicionar</p>
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