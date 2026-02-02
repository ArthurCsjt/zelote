import React, { useState, useCallback, useEffect } from 'react';
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Computer, User, AlertTriangle, CheckCircle, RotateCcw, Loader2, BookOpen, X } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";
import UserAutocomplete from "./UserAutocomplete";
import { DeviceListInput } from "./DeviceListInput";
import { GlassCard } from "./ui/GlassCard";
import { useDatabase } from '@/hooks/useDatabase';
import type { UserSearchResult } from '@/hooks/useUserSearch';
import type { ReturnFormData } from '@/types/database';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ConfirmReturnDialog } from './ConfirmReturnDialog'; // NOVO IMPORT
import type { LoanHistoryItem } from '@/types/database';
import { isOverdue, calculateOverdueDays, formatDetailedDuration } from '@/utils/loanCalculations'; // NOVO IMPORT

interface ReturnFormProps {
  onReturnSuccess?: () => void;
  initialChromebookId?: string; // Adicionado para pré-seleção
}

export function ReturnForm({ onReturnSuccess, initialChromebookId }: ReturnFormProps) {
  const { bulkReturnChromebooks, getLoanDetailsByChromebookId, getActiveLoansByUser, loading: dbLoading } = useDatabase();

  // Inicializa a lista de dispositivos com o ID inicial, se houver
  const [deviceIds, setDeviceIds] = useState<string[]>(initialChromebookId ? [initialChromebookId] : []);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [returnData, setReturnData] = useState<ReturnFormData & { notes?: string }>({
    name: "",
    ra: "",
    email: "",
    type: 'lote',
    userType: 'aluno',
    notes: ''
  });

  // NOVO ESTADO: Detalhes dos empréstimos
  const [loanDetails, setLoanDetails] = useState<Map<string, LoanHistoryItem>>(new Map());

  // NOVO ESTADO: Empréstimos ativos do usuário selecionado
  const [userActiveLoans, setUserActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [loadingUserLoans, setLoadingUserLoans] = useState(false);

  // NOVO ESTADO: Modal de confirmação
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Efeito para limpar o formulário ao montar/resetar
  useEffect(() => {
    // Se a lista de IDs estiver vazia, garante que o usuário e a confirmação também estejam limpos
    if (deviceIds.length === 0) {
      setSelectedUser(null);
      setConfirmChecked(false);
      setReturnData({ name: "", ra: "", email: "", type: 'lote', userType: 'aluno', notes: '' });
      setUserActiveLoans([]);
    }
  }, [deviceIds.length]);

  // NOVO EFEITO: Buscar empréstimos ativos quando o usuário é selecionado
  useEffect(() => {
    const fetchUserLoans = async () => {
      if (!selectedUser) {
        setUserActiveLoans([]);
        return;
      }

      setLoadingUserLoans(true);
      try {
        const loans = await getActiveLoansByUser({
          ra: selectedUser.ra || undefined,
          email: selectedUser.email
        });
        setUserActiveLoans(loans);
      } catch (error) {
        console.error('Erro ao buscar empréstimos do usuário:', error);
      } finally {
        setLoadingUserLoans(false);
      }
    };

    fetchUserLoans();
  }, [selectedUser, getActiveLoansByUser]);

  // NOVO EFEITO: Buscar detalhes do empréstimo quando dispositivos são adicionados
  useEffect(() => {
    const fetchLoanDetails = async () => {
      const newLoanDetails = new Map<string, LoanHistoryItem>();

      for (const deviceId of deviceIds) {
        // Só busca se ainda não temos os detalhes
        if (!loanDetails.has(deviceId)) {
          const details = await getLoanDetailsByChromebookId(deviceId);
          if (details) {
            newLoanDetails.set(deviceId, details);
          }
        } else {
          // Mantém os detalhes existentes
          newLoanDetails.set(deviceId, loanDetails.get(deviceId)!);
        }
      }

      setLoanDetails(newLoanDetails);
    };

    if (deviceIds.length > 0) {
      fetchLoanDetails();
    } else {
      setLoanDetails(new Map());
    }
  }, [deviceIds, getLoanDetailsByChromebookId]);

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setReturnData(prev => ({
      ...prev,
      name: user.name,
      ra: user.ra || '',
      email: user.email,
      userType: user.type,
      type: 'lote',
    }));
  };

  const handleUserClear = () => {
    setSelectedUser(null);
    setReturnData(prev => ({
      ...prev,
      name: '',
      ra: '',
      email: '',
      userType: 'aluno',
      type: 'lote',
    }));
  };

  const toggleLoanSelection = (chromebookId: string) => {
    setDeviceIds(prev =>
      prev.includes(chromebookId)
        ? prev.filter(id => id !== chromebookId)
        : [...prev, chromebookId]
    );
  };

  const selectAllUserLoans = () => {
    const allLoanIds = userActiveLoans.map(l => l.chromebook_id);
    setDeviceIds(prev => {
      const otherIds = prev.filter(id => !allLoanIds.includes(id));
      return [...otherIds, ...allLoanIds];
    });
  };

  const handleConfirmReturn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast({ title: "Erro", description: "Selecione o solicitante da devolução.", variant: "destructive" });
      return;
    }

    if (deviceIds.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um dispositivo para devolução.", variant: "destructive" });
      return;
    }

    if (!confirmChecked) {
      toast({ title: "Erro", description: "Confirme a verificação do estado físico do equipamento.", variant: "destructive" });
      return;
    }

    // Abrir modal de confirmação ao invés de enviar direto
    setShowConfirmDialog(true);
  }, [selectedUser, deviceIds.length, confirmChecked]);

  // NOVA FUNÇÃO: Confirmar e enviar após revisão
  const handleConfirmReturnSubmit = useCallback(async () => {
    setShowConfirmDialog(false);

    try {
      const result = await bulkReturnChromebooks(deviceIds, returnData);
      const { successCount, errorCount } = result;

      if (successCount > 0) {
        // Resetar formulário
        setDeviceIds([]);
        setSelectedUser(null);
        setConfirmChecked(false);
        setReturnData({ name: "", ra: "", email: "", type: 'lote', userType: 'aluno', notes: '' });
        setLoanDetails(new Map());

        onReturnSuccess?.();
      } else if (errorCount > 0) {
        // Erros já são toastados dentro do useDatabase
      }
    } catch (error) {
      console.error('Erro ao processar devolução:', error);
      toast({ title: "Erro", description: "Falha ao processar devolução", variant: "destructive" });
    }
  }, [deviceIds, returnData, bulkReturnChromebooks, onReturnSuccess]);

  const isFormValid = selectedUser && deviceIds.length > 0 && confirmChecked;

  return (
    <form onSubmit={handleConfirmReturn} className="space-y-6 relative">
      {/* Gradiente de fundo removido */}

      <div className="grid md:grid-cols-2 gap-3 relative z-10">

        {/* COLUNA ESQUERDA */}
        <div className="flex flex-col gap-6 h-full">
          {/* ═══ SEÇÃO 1: DISPOSITIVOS (Cor 1: Âmbar) ═══ */}
          <div className="border-4 border-amber-500 bg-amber-100 dark:bg-amber-950/20 shadow-[6px_6px_0px_0px_rgba(245,158,11,0.3)] border-l-[6px] md:border-l-[12px] flex-1 p-0 overflow-hidden">
            <CardHeader className="p-3 pb-2 border-b-3 border-amber-500/30 bg-gradient-to-r from-amber-400 to-orange-500">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-white">
                  <Computer className="h-5 w-5" />
                  Dispositivos para Devolução
                </CardTitle>
                <Badge variant="outline" className={cn(
                  "text-xs font-bold border-3 border-white text-white rounded-none shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]",
                  deviceIds.length === 0 ? "bg-white/20" : "bg-white/30"
                )}>
                  {deviceIds.length === 0
                    ? 'Nenhum'
                    : `${deviceIds.length} ${deviceIds.length === 1 ? 'PC' : 'PCs'}`
                  }
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <DeviceListInput
                deviceIds={deviceIds}
                setDeviceIds={setDeviceIds}
                disabled={dbLoading}
                filterStatus="emprestado" // Filtra por emprestado
                actionLabel="Devolução"
                userActiveLoans={userActiveLoans}
                loadingUserLoans={loadingUserLoans}
                onToggleLoan={toggleLoanSelection}
                onSelectAllLoans={selectAllUserLoans}
                selectedUserName={selectedUser?.name}
              />
              {/* Validação em tempo real para Dispositivos */}
              {deviceIds.length === 0 && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-2 uppercase">
                  <AlertTriangle className="h-3 w-3" />
                  Adicione pelo menos um dispositivo.
                </p>
              )}



              {/* NOVO: Detalhes dos Empréstimos (Existente para quando já tem deviceIds) */}
              {deviceIds.length > 0 && loanDetails.size > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-tight text-muted-foreground mb-2">
                    Detalhes dos Empréstimos
                  </p>
                  {deviceIds.map(deviceId => {
                    const loan = loanDetails.get(deviceId);
                    if (!loan) return null;

                    const overdue = isOverdue(loan.expected_return_date);
                    const overdueDays = overdue ? calculateOverdueDays(loan.expected_return_date!) : 0;
                    const duration = formatDetailedDuration(loan.loan_date);

                    return (
                      <div
                        key={deviceId}
                        className={cn(
                          "p-2.5 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                          overdue
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-sm text-black dark:text-white">{deviceId}</p>
                              {overdue && (
                                <Badge variant="destructive" className="text-[10px] h-5 px-2 font-bold border-2 border-black rounded-none">
                                  {overdueDays}d atraso
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-800 dark:text-gray-300 truncate font-bold uppercase">
                              <User className="h-3 w-3 inline mr-1" />
                              {loan.student_name}
                            </p>
                            <p className="text-xs text-gray-800 dark:text-gray-300 truncate mt-1 font-mono">
                              <BookOpen className="h-3 w-3 inline mr-1" />
                              {loan.purpose}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-black dark:text-white">{duration}</p>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 font-semibold uppercase">
                              emprestado
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>

          {/* ═══ SEÇÃO 2: OBSERVAÇÕES ═══ */}
          <div className="border-4 border-gray-500 bg-gray-100 dark:bg-gray-950/20 shadow-[6px_6px_0px_0px_rgba(107,114,128,0.3)] border-l-[6px] md:border-l-[12px] p-0 overflow-hidden">
            <CardHeader className="p-3 pb-2 border-b-3 border-gray-500/30 bg-gradient-to-r from-gray-400 to-gray-600">
              <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground font-bold uppercase text-xs">
                  Condição do equipamento ou notas (Opcional)
                </Label>
                <Textarea
                  id="notes"
                  value={returnData.notes || ''}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  placeholder="Ex: O Chromebook foi devolvido com a tela trincada."
                  className="neo-input min-h-[60px]"
                  disabled={dbLoading}
                />
              </div>
            </CardContent>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">
          {/* ═══ SEÇÃO 3: SOLICITANTE DA DEVOLUÇÃO ═══ */}
          <div className="border-4 border-violet-500 bg-violet-100 dark:bg-violet-950/20 shadow-[6px_6px_0px_0px_rgba(139,92,246,0.3)] border-l-[6px] md:border-l-[12px] p-0 overflow-hidden">
            <CardHeader className="p-3 pb-2 border-b-3 border-violet-500/30 bg-gradient-to-r from-violet-400 to-purple-500">
              <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                Solicitante da Devolução
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <div className="space-y-2">
                <Label htmlFor="userSearch" className="text-foreground font-bold uppercase text-xs">
                  Buscar Solicitante (Nome, RA ou Email) *
                </Label>
                <UserAutocomplete
                  selectedUser={selectedUser}
                  onSelect={handleUserSelect}
                  onClear={handleUserClear}
                  disabled={dbLoading}
                />
              </div>

              {/* Validação em tempo real para Solicitante */}
              {!selectedUser && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Selecione o solicitante.
                </p>
              )}

              {selectedUser && (
                <>
                  <div className="flex items-center gap-2 text-xs text-white bg-green-500 border-3 border-green-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-700" />
                    <div className="flex-1">
                      <p className="font-black uppercase">{selectedUser.name}</p>
                      <p className="font-mono">{selectedUser.email}</p>
                    </div>
                  </div>

                  {/* NOVA MENSAGEM INFORMATIVA COM ANIMAÇÃO ZOOM */}
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border-3 border-blue-500 shadow-[3px_3px_0px_0px_rgba(59,130,246,0.5)] animate-zoom-pulse">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-blue-500 rounded-sm mt-0.5">
                        <BookOpen className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase text-black dark:text-white mb-1">
                          📋 Próximo Passo
                        </p>
                        <p className="text-[10px] font-bold text-black dark:text-white leading-tight">
                          Agora, <span className="font-black underline">selecione os dispositivos</span> na lista de "Sugeridos" à esquerda para validar quais equipamentos serão devolvidos.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </div>

          {/* ═══ SEÇÃO 4: CONFIRMAÇÃO OBRIGATÓRIA ═══ */}
          <div className="p-4 border-4 border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 shadow-[6px_6px_0px_0px_rgba(234,179,8,0.4)]">
            <div className="flex items-start gap-2">
              <Checkbox
                id="confirmChecked"
                checked={confirmChecked}
                onCheckedChange={(v) => setConfirmChecked(!!v)}
                className="mt-0.5 w-5 h-5 border-3 border-black checkbox-neo"
                disabled={dbLoading}
              />
              <Label htmlFor="confirmChecked" className="text-sm text-foreground leading-5 cursor-pointer">
                <div className="flex items-center gap-1 font-black uppercase text-amber-900 dark:text-amber-300 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Verificação Obrigatória *
                </div>
                Confirmo que verifiquei o estado físico do(s) equipamento(s) (danos, acessórios) no momento da devolução.
              </Label>
            </div>
            {!confirmChecked && (
              <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-3 ml-7">
                <AlertTriangle className="h-3 w-3" />
                Confirmação obrigatória.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BOTÃO FINAL ═══ */}
      <Button
        type="submit"
        size="lg"
        className={cn(
          "w-full h-16 text-xl font-black uppercase tracking-tight",
          "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
          "text-white border-4 border-black dark:border-white",
          "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)]",
          "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
          "active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px]",
          "transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-[8px] disabled:translate-y-[8px]"
        )}
        disabled={dbLoading || !isFormValid}
      >
        {dbLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <RotateCcw className="h-5 w-5 mr-2" />
            {`CONFIRMAR DEVOLUÇÃO (${deviceIds.length})`}
          </>
        )}
      </Button>

      {/* Modal de Confirmação */}
      <ConfirmReturnDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        deviceIds={deviceIds}
        loanDetails={loanDetails}
        returnData={returnData}
        onConfirm={handleConfirmReturnSubmit}
        loading={dbLoading}
      />
    </form>
  );
}