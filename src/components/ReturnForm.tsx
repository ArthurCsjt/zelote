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
  const { bulkReturnChromebooks, getLoanDetailsByChromebookId, loading: dbLoading } = useDatabase();

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

  // NOVO ESTADO: Modal de confirmação
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Efeito para limpar o formulário ao montar/resetar
  useEffect(() => {
    // Se a lista de IDs estiver vazia, garante que o usuário e a confirmação também estejam limpos
    if (deviceIds.length === 0) {
      setSelectedUser(null);
      setConfirmChecked(false);
      setReturnData({ name: "", ra: "", email: "", type: 'lote', userType: 'aluno', notes: '' });
    }
  }, [deviceIds.length]);

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
    <form onSubmit={handleConfirmReturn} className="space-y-5 relative">
      {/* Gradiente de fundo removido */}

      <div className="grid md:grid-cols-2 gap-5 relative z-10">

        {/* COLUNA ESQUERDA */}
        <div className="flex flex-col gap-5 h-full">
          {/* ═══ SEÇÃO 1: DISPOSITIVOS (Cor 1: Âmbar) ═══ */}
          <div className="neo-card flex-1 p-0 overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b-2 border-black dark:border-white bg-amber-100 dark:bg-amber-900/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-foreground">
                  <Computer className="h-5 w-5 text-black dark:text-white" />
                  Dispositivos para Devolução
                </CardTitle>
                <Badge variant="outline" className={cn(
                  "text-xs font-bold border-2 border-black text-black dark:border-white dark:text-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]",
                  deviceIds.length === 0 ? "bg-gray-100" : "bg-amber-300 dark:bg-amber-700"
                )}>
                  {deviceIds.length === 0
                    ? 'Nenhum dispositivo'
                    : `${deviceIds.length} ${deviceIds.length === 1 ? 'dispositivo' : 'dispositivos'}`
                  }
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <DeviceListInput
                deviceIds={deviceIds}
                setDeviceIds={setDeviceIds}
                disabled={dbLoading}
                filterStatus="emprestado" // Filtra por emprestado
                actionLabel="Devolução"
                className="neo-input"
              />
              {/* Validação em tempo real para Dispositivos */}
              {deviceIds.length === 0 && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-3">
                  <AlertTriangle className="h-3 w-3" />
                  Adicione pelo menos um dispositivo.
                </p>
              )}

              {/* NOVO: Detalhes dos Empréstimos */}
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
                          "p-3 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
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
          <div className="neo-card p-0 overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-800">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-foreground">
                <BookOpen className="h-5 w-5 text-black dark:text-white" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground font-bold uppercase text-xs">
                  Condição do equipamento ou notas (Opcional)
                </Label>
                <Textarea
                  id="notes"
                  value={returnData.notes || ''}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  placeholder="Ex: O Chromebook foi devolvido com a tela trincada."
                  className="neo-input min-h-[80px]"
                  disabled={dbLoading}
                />
              </div>
            </CardContent>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-5">
          {/* ═══ SEÇÃO 3: SOLICITANTE DA DEVOLUÇÃO ═══ */}
          <div className="neo-card p-0 overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b-2 border-black dark:border-white bg-amber-100 dark:bg-amber-900/20">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-black dark:text-white" />
                Solicitante da Devolução
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
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
                <div className="flex items-center gap-2 text-xs text-black bg-green-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-700" />
                  <div className="flex-1">
                    <p className="font-black uppercase">{selectedUser.name}</p>
                    <p className="font-mono">{selectedUser.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          {/* ═══ SEÇÃO 4: CONFIRMAÇÃO OBRIGATÓRIA ═══ */}
          <div className="p-5 border-2 border-black dark:border-white bg-yellow-100 dark:bg-yellow-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirmChecked"
                checked={confirmChecked}
                onCheckedChange={(v) => setConfirmChecked(!!v)}
                className="mt-1 border-2 border-black checkbox-neo"
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
          "w-full h-14 text-lg font-black uppercase tracking-tight",
          "bg-amber-400 hover:bg-amber-500 text-black border-2 border-black",
          "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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