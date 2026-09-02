import React, { useState, useCallback, useEffect } from 'react';
import { Label } from './ui/label';
import { Computer, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { normalizeChromebookId, sanitizeQRCodeData } from '@/utils/security';
import { QRCodeReader } from './QRCodeReader';
import { useChromebookSearch, ChromebookSearchResult } from '@/hooks/useChromebookSearch';
import { cn } from '@/lib/utils';
import ChromebookSearchInput from './ChromebookSearchInput';
import { useDatabase } from '@/hooks/useDatabase';
import type { LoanHistoryItem, ReturnFormData } from '@/types/database';
import { DeviceCard } from './DeviceCard';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { NeoPagination } from './ui/NeoPagination';
import { QuickReturnDialog } from './QuickReturnDialog';
import { useQueryClient } from '@tanstack/react-query';

interface DeviceListItem extends ChromebookSearchResult {
  loanStatus: 'ativo' | 'inativo' | 'atrasado' | 'desconhecido';
}

interface DeviceListInputProps {
  deviceIds: string[];
  setDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;
  disabled: boolean;
  filterStatus?: 'disponivel' | 'emprestado' | 'all';
  actionLabel: 'Empréstimo' | 'Devolução';
  // Props para integração de Empréstimos Ativos
  userActiveLoans?: LoanHistoryItem[];
  loadingUserLoans?: boolean;
  onToggleLoan?: (chromebookId: string) => void;
  onSelectAllLoans?: () => void;
  selectedUserName?: string;
}

export function DeviceListInput({
  deviceIds,
  setDeviceIds,
  disabled,
  filterStatus = 'disponivel',
  actionLabel,
  userActiveLoans = [],
  loadingUserLoans = false,
  onToggleLoan,
  onSelectAllLoans,
  selectedUserName
}: DeviceListInputProps) {
  const [deviceList, setDeviceList] = useState<DeviceListItem[]>([]);
  const [isQRReaderOpen, setIsQRReaderOpen] = useState(false);
  const { chromebooks, loading: searchLoading, fetchChromebooks } = useChromebookSearch();
  const { getActiveLoans, returnChromebookById, syncChromebookStatus } = useDatabase();
  const queryClient = useQueryClient();

  const [activeLoansCache, setActiveLoansCache] = useState<LoanHistoryItem[]>([]);
  const [isLoanCacheLoading, setIsLoanCacheLoading] = useState(true);
  const [addedDevicesPage, setAddedDevicesPage] = useState(1);
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const itemsPerPage = 5;

  // Estado para o diálogo de devolução rápida
  const [quickReturnTarget, setQuickReturnTarget] = useState<{
    chromebook: ChromebookSearchResult;
    activeLoan: LoanHistoryItem;
  } | null>(null);
  const [isReturningQuickly, setIsReturningQuickly] = useState(false);

  // Resetar página quando o usuário ou a lista bruta mudar
  useEffect(() => {
    setAddedDevicesPage(1);
    setSuggestionsPage(1);
  }, [selectedUserName]);

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
        const hasActiveLoan = !!activeLoan;

        // Calcula o status real com base na posse ativa
        let computedStatus = chromebook.status;
        if (hasActiveLoan) {
          computedStatus = 'emprestado';
        } else if (computedStatus === 'emprestado') {
          // Se não há empréstimo ativo no sistema, o status real para novo empréstimo é disponível
          computedStatus = 'disponivel';
        }

        return {
          ...chromebook,
          status: computedStatus,
          loanStatus: activeLoan ? (activeLoan.status === 'atrasado' ? 'atrasado' : 'ativo') : 'inativo'
        } as DeviceListItem;
      })
      .filter((cb): cb is DeviceListItem => !!cb);

    if (
      initialList.length !== deviceList.length ||
      initialList.some((item, index) => item.id !== deviceList[index]?.id || item.status !== deviceList[index]?.status)
    ) {
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
    const hasActiveLoan = !!activeLoan;

    // Resolução de status dinâmico
    let computedStatus = chromebook.status;
    if (hasActiveLoan) {
      computedStatus = 'emprestado';
    } else if (computedStatus === 'emprestado') {
      computedStatus = 'disponivel';
      // Sincroniza silenciosamente com o banco de dados em background para corrigir discrepâncias
      if (syncChromebookStatus) {
        syncChromebookStatus(chromebook.chromebook_id, false).catch(() => {});
      }
    }

    if (actionLabel === 'Empréstimo') {
      const isBusy = (activeLoan && (loanStatus === 'ativo' || loanStatus === 'atrasado')) || (chromebook.status === 'emprestado' && activeLoan);
      if (isBusy) {
        return {
          mustQuickReturn: true,
          chromebook: { ...chromebook, status: computedStatus, loanStatus } as DeviceListItem,
          activeLoan: activeLoan || null
        };
      }
    }

    if (actionLabel === 'Devolução') {
      if (loanStatus === 'inativo') {
        return { error: `O Chromebook ${normalizedInput} não possui um empréstimo ativo registrado.` };
      }
    }

    return { chromebook: { ...chromebook, status: computedStatus, loanStatus } as DeviceListItem };
  }, [deviceList, chromebooks, actionLabel, activeLoansCache, syncChromebookStatus]);

  const addDevice = useCallback(async (chromebook: ChromebookSearchResult) => {
    const validation = await validateAndNormalizeInput(chromebook.chromebook_id);

    if (validation.mustQuickReturn) {
      if (validation.activeLoan) {
        setQuickReturnTarget({
          chromebook: validation.chromebook,
          activeLoan: validation.activeLoan
        });
        return;
      }

      // Se não tiver empréstimo ativo registrado, adiciona normalmente
    }

    if (validation.error) {
      toast({
        title: "Erro de Validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setDeviceList(prev => {
      if (!validation.chromebook) return prev;
      // Previne qualquer adição duplicada mesmo que aconteça em chamadas concorrentes
      if (prev.some(item => item.chromebook_id === validation.chromebook?.chromebook_id)) {
        return prev;
      }
      const newList = [validation.chromebook, ...prev]; // Invertido: novo item no topo
      setDeviceIds(newList.map(item => item.chromebook_id));
      setAddedDevicesPage(1); // Volta para a página 1 para ver o item recém-adicionado
      return newList;
    });

    toast({
      title: "✓ Dispositivo adicionado",
      description: `${chromebook.chromebook_id} (${chromebook.model})`,
      variant: "success",
      duration: 2000,
    });
  }, [validateAndNormalizeInput, setDeviceIds]);

  const handleConfirmQuickReturn = async () => {
    if (!quickReturnTarget) return;

    setIsReturningQuickly(true);
    try {
      const { chromebook, activeLoan } = quickReturnTarget;
      const returnData: ReturnFormData & { notes?: string } = {
        name: activeLoan.student_name,
        ra: activeLoan.student_ra || '',
        email: activeLoan.student_email,
        type: activeLoan.loan_type,
        userType: activeLoan.user_type,
        notes: `Devolução Rápida realizada durante novo empréstimo. Solicitante original: ${activeLoan.student_name} (${activeLoan.student_email}).`
      };

      const success = await returnChromebookById(chromebook.chromebook_id, returnData);
      if (success) {
        // 1. Remove do cache local de empréstimos ativos
        setActiveLoansCache(prev => prev.filter(loan => loan.chromebook_id !== chromebook.chromebook_id));

        // 2. Remove do localStorage de devoluções pendentes se existir
        const pendingJson = localStorage.getItem('zelote_pending_returns');
        if (pendingJson) {
          try {
            const pending: string[] = JSON.parse(pendingJson);
            const filtered = pending.filter(id => id !== chromebook.chromebook_id);
            localStorage.setItem('zelote_pending_returns', JSON.stringify(filtered));
          } catch (e) {}
        }

        // 3. Adiciona imediatamente o Chromebook à lista de empréstimo atual
        const availableDevice: DeviceListItem = {
          ...chromebook,
          status: 'disponivel',
          loanStatus: 'inativo',
        };

        setDeviceList(prev => {
          if (prev.some(item => item.chromebook_id === chromebook.chromebook_id)) {
            return prev;
          }
          const newList = [availableDevice, ...prev];
          setDeviceIds(newList.map(item => item.chromebook_id));
          setAddedDevicesPage(1);
          return newList;
        });

        // 4. Recarrega o inventário de busca e invalida caches globais
        await fetchChromebooks();
        queryClient.invalidateQueries({ queryKey: ['chromebooks'] });
        queryClient.invalidateQueries({ queryKey: ['active-loans'] });
        queryClient.invalidateQueries({ queryKey: ['loan-history'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

        toast({
          title: "Devolução Realizada com Sucesso",
          description: `O Chromebook ${chromebook.chromebook_id} foi devolvido e adicionado à lista do novo empréstimo.`,
          variant: "success",
        });

        setQuickReturnTarget(null);
      }
    } catch (err: any) {
      toast({
        title: "Erro na Devolução",
        description: err.message || "Não foi possível concluir a devolução do equipamento.",
        variant: "destructive",
      });
    } finally {
      setIsReturningQuickly(false);
    }
  };

  const handleQRCodeScan = async (data: string) => {
    const sanitizedId = sanitizeQRCodeData(data);

    if (typeof sanitizedId === 'string' && sanitizedId) {
      const normalized = normalizeChromebookId(sanitizedId);
      if (normalized && deviceIds.includes(normalized)) {
        toast({
          title: "Dispositivo já adicionado",
          description: `O Chromebook ${normalized} já está na lista.`,
          variant: "warning",
          duration: 2000,
        });
        return;
      }

      const validation = await validateAndNormalizeInput(sanitizedId);
      if (validation.error) {
        toast({
          title: "Erro de Validação",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      if (validation.chromebook) {
        addDevice(validation.chromebook);
      }
    }
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
    <div className="space-y-4 h-full flex flex-col">
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
        keepFocusAfterSelect={true}
      />

      {/* Lista de Dispositivos - NEO-BRUTALISM */}
      <div className="mt-3 p-2 sm:p-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-1 overflow-y-auto overflow-x-hidden max-w-full transition-all duration-300 min-h-[250px] flex flex-col gap-6 w-full min-w-0">

        {/* SEÇÃO 1: Dispositivos Já Adicionados */}
        {deviceList.length > 0 && (
          <div className="space-y-3 w-full max-w-full">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
              {actionLabel === 'Empréstimo' ? 'Dispositivos Adicionados' : 'Dispositivos para Devolução'} ({deviceList.length})
            </p>
            <div className="space-y-2 w-full max-w-full">
              {(() => {
                const totalPages = Math.ceil(deviceList.length / itemsPerPage);
                const startIndex = (addedDevicesPage - 1) * itemsPerPage;
                const paginatedDevices = deviceList.slice(startIndex, startIndex + itemsPerPage);

                return (
                  <>
                    {paginatedDevices.map((chromebook, index) => (
                      <DeviceCard
                        key={chromebook.chromebook_id}
                        deviceId={chromebook.chromebook_id}
                        status={chromebook.status as any}
                        manufacturer={chromebook.manufacturer}
                        model={chromebook.model}
                        serial_number={chromebook.serial_number}
                        onRemove={() => removeDevice(chromebook.chromebook_id)}
                        variant={actionLabel === 'Empréstimo' ? 'loan' : 'return'}
                        showDetails={true}
                        className="animate-in slide-in-from-left-3 fade-in duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      />
                    ))}

                    {deviceList.length > itemsPerPage && (
                      <NeoPagination
                        currentPage={addedDevicesPage}
                        totalPages={totalPages}
                        onPageChange={setAddedDevicesPage}
                        className="mt-4"
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* SEÇÃO 2: Sugestões de Empréstimos Ativos (INTEGRAÇÃO) */}
        {selectedUserName && (userActiveLoans.length > 0 || loadingUserLoans) && (() => {
          const suggestions = userActiveLoans.filter(l => !deviceIds.includes(l.chromebook_id));

          if (suggestions.length === 0 && !loadingUserLoans && deviceList.length > 0) return null;

          const totalPages = Math.ceil(suggestions.length / itemsPerPage);
          const startIndex = (suggestionsPage - 1) * itemsPerPage;
          const paginatedSuggestions = suggestions.slice(startIndex, startIndex + itemsPerPage);

          return (
            <div className={cn(
              "flex flex-col animate-in fade-in duration-500",
              deviceList.length > 0 && "pt-6 border-t-4 border-black dark:border-white border-dashed"
            )}>
              <div className="flex items-center justify-between mb-4 bg-blue-600 dark:bg-blue-500 p-2 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[12px] font-black uppercase tracking-tight flex items-center gap-2 text-white">
                  <Computer className="h-4 w-4" />
                  Sugeridos: {selectedUserName.split(' ')[0]}
                  {suggestions.length > itemsPerPage && <span className="text-[10px] opacity-70 ml-2">({suggestions.length})</span>}
                </p>
                {suggestions.length > 0 && !loadingUserLoans && onSelectAllLoans && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onSelectAllLoans}
                    className="h-7 px-3 text-[10px] font-black border-2 border-black dark:border-white text-black dark:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-none transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Selecionar Todos
                  </Button>
                )}
              </div>

              {loadingUserLoans ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  <div className="grid gap-3 pr-1">
                    {paginatedSuggestions.map((loan, idx) => (
                      <div
                        key={loan.id}
                        className={cn(
                          "flex items-center gap-4 p-3 border-2 transition-all cursor-pointer group",
                          "bg-white dark:bg-zinc-800 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(59,130,246,0.3)] hover:shadow-[5px_5px_0px_0px_rgba(59,130,246,1)] hover:-translate-y-0.5 hover:-translate-x-0.5"
                        )}
                        onClick={() => onToggleLoan?.(loan.chromebook_id)}
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <div className="relative">
                          <Checkbox
                            checked={false}
                            className="h-6 w-6 border-2 border-black dark:border-white rounded-none data-[state=checked]:bg-blue-500 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-black uppercase text-black dark:text-white">
                              {loan.chromebook_id}
                            </p>
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black rounded-none border-2 px-1.5 h-5",
                              loan.status === 'atrasado'
                                ? "border-red-500 text-red-600 bg-red-50"
                                : "border-blue-500 text-blue-600 bg-blue-50"
                            )}>
                              {loan.status === 'atrasado' ? 'ATRASADO' : 'ATIVO'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">
                              {loan.purpose}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PAGINAÇÃO NEO-BRUTALISTA CENTRALIZADA */}
                  {suggestions.length > itemsPerPage && (
                    <NeoPagination
                      currentPage={suggestionsPage}
                      totalPages={totalPages}
                      onPageChange={setSuggestionsPage}
                      className="mt-6 mb-2"
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <div className="inline-flex items-center justify-center p-2 mb-2 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-[10px] font-black text-foreground uppercase tracking-wider">
                    Tudo certo!
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">
                    Sem empréstimos pendentes para este aluno.
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ESTADO VAZIO: Apenas se não houver dispositivos E não houver sugestões a mostrar */}
        {deviceList.length === 0 && (!selectedUserName || (userActiveLoans.length === 0 && !loadingUserLoans)) && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-full mb-4 border-2 border-dashed border-gray-200 dark:border-zinc-700">
              <Computer className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-black uppercase tracking-tight">Nenhum dispositivo adicionado</p>
            <p className="text-xs mt-1 font-medium opacity-70">Use a busca acima para adicionar manualmente</p>
          </div>
        )}
      </div>

      <QRCodeReader
        open={isQRReaderOpen}
        onOpenChange={setIsQRReaderOpen}
        onScan={handleQRCodeScan}
        initialCount={deviceList.length}
        existingCodes={deviceList.map(d => d.chromebook_id)}
        title={actionLabel === 'Empréstimo' ? 'Escanear para Empréstimo' : 'Escanear para Devolução'}
      />

      <QuickReturnDialog
        open={!!quickReturnTarget}
        onOpenChange={(open) => {
          if (!open) setQuickReturnTarget(null);
        }}
        chromebook={quickReturnTarget?.chromebook || null}
        activeLoan={quickReturnTarget?.activeLoan || null}
        onConfirm={handleConfirmQuickReturn}
        loading={isReturningQuickly}
      />
    </div>
  );
}