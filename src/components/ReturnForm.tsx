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
import { Badge } from './ui/badge'; // IMPORT CORRIGIDO

interface ReturnFormProps {
  onReturnSuccess?: () => void;
  initialChromebookId?: string; // Adicionado para pré-seleção
}

export function ReturnForm({ onReturnSuccess, initialChromebookId }: ReturnFormProps) {
  const { bulkReturnChromebooks, loading: dbLoading } = useDatabase();
  
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

  // Efeito para limpar o formulário ao montar/resetar
  useEffect(() => {
    // Se a lista de IDs estiver vazia, garante que o usuário e a confirmação também estejam limpos
    if (deviceIds.length === 0) {
        setSelectedUser(null);
        setConfirmChecked(false);
        setReturnData({ name: "", ra: "", email: "", type: 'lote', userType: 'aluno', notes: '' });
    }
  }, [deviceIds.length]);

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

    try {
      const result = await bulkReturnChromebooks(deviceIds, returnData);
      const { successCount, errorCount } = result;
      
      if (successCount > 0) {
        // Resetar formulário
        setDeviceIds([]);
        setSelectedUser(null);
        setConfirmChecked(false);
        setReturnData({ name: "", ra: "", email: "", type: 'lote', userType: 'aluno', notes: '' });
        
        onReturnSuccess?.();
      } else if (errorCount > 0) {
        // Erros já são toastados dentro do useDatabase
      }
    } catch (error) {
      console.error('Erro ao processar devolução:', error);
      toast({ title: "Erro", description: "Falha ao processar devolução", variant: "destructive" });
    }
  }, [deviceIds, selectedUser, confirmChecked, returnData, bulkReturnChromebooks, onReturnSuccess]);

  const isFormValid = selectedUser && deviceIds.length > 0 && confirmChecked;

  return (
    <form onSubmit={handleConfirmReturn} className="space-y-5 relative">
      {/* Gradiente de fundo sutil para a área do formulário */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-amber-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      <div className="grid md:grid-cols-2 gap-5 relative z-10">
        
        {/* COLUNA ESQUERDA */}
        <div className="space-y-5">
            {/* ═══ SEÇÃO 1: DISPOSITIVOS (Cor 1: Âmbar) ═══ */}
            <GlassCard className={cn(
                "bg-gradient-to-br from-amber-500/5 via-amber-500/3 to-transparent",
                "border border-amber-500/20",
                "shadow-xl shadow-amber-500/5" // ADICIONANDO shadow-xl
            )}>
                <CardHeader className="p-5 pb-3 border-b border-amber-500/10 dark:border-amber-500/30">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <Computer className="h-5 w-5 text-menu-amber" /> 
                            Dispositivos para Devolução
                        </CardTitle>
                        <Badge variant="outline" className={cn(
                            "text-xs font-medium transition-colors",
                            deviceIds.length === 0 ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800"
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
                    />
                    {/* Validação em tempo real para Dispositivos */}
                    {deviceIds.length === 0 && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-3">
                            <AlertTriangle className="h-3 w-3" />
                            Adicione pelo menos um dispositivo para devolução.
                        </p>
                    )}
                </CardContent>
            </GlassCard>
            
            {/* ═══ SEÇÃO 2: OBSERVAÇÕES ═══ */}
            <GlassCard className="bg-muted/30 border border-border/50 shadow-xl"> {/* ADICIONANDO shadow-xl */}
                <CardHeader className="p-5 pb-3 border-b border-border/50">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <BookOpen className="h-5 w-5 text-muted-foreground" /> 
                        Observações
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-foreground">
                            Condição do equipamento ou notas (Opcional)
                        </Label>
                        <Textarea
                            id="notes"
                            value={returnData.notes || ''}
                            onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                            placeholder="Ex: O Chromebook foi devolvido com a tela trincada."
                            className="bg-input border-gray-200 min-h-[80px] dark:bg-card dark:border-border"
                            disabled={dbLoading}
                        />
                    </div>
                </CardContent>
            </GlassCard>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-5">
            {/* ═══ SEÇÃO 3: SOLICITANTE DA DEVOLUÇÃO ═══ */}
            <GlassCard className={cn(
                "bg-gradient-to-br from-amber-500/5 via-amber-500/3 to-transparent",
                "border border-amber-500/20",
                "shadow-xl shadow-amber-500/5" // ADICIONANDO shadow-xl
            )}>
                <CardHeader className="p-5 pb-3 border-b border-amber-500/10 dark:border-amber-500/30">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <User className="h-5 w-5 text-menu-amber" /> 
                        Solicitante da Devolução
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="userSearch" className="text-foreground">
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
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            Selecione o solicitante para prosseguir.
                        </p>
                    )}
                    
                    {selectedUser && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div className="flex-1">
                                <p className="font-medium text-foreground">{selectedUser.name}</p>
                                <p>{selectedUser.email}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </GlassCard>
            
            {/* ═══ SEÇÃO 4: CONFIRMAÇÃO OBRIGATÓRIA ═══ */}
            <div className="p-5 rounded-xl border bg-amber-50/50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-900 shadow-xl"> {/* ADICIONANDO shadow-xl */}
                <div className="flex items-start gap-3">
                    <Checkbox 
                        id="confirmChecked" 
                        checked={confirmChecked} 
                        onCheckedChange={(v) => setConfirmChecked(!!v)} 
                        className="mt-1 border-amber-500 shrink-0" 
                        disabled={dbLoading}
                    />
                    <Label htmlFor="confirmChecked" className="text-sm text-foreground leading-5 cursor-pointer">
                        <div className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4" />
                            Verificação Obrigatória *
                        </div>
                        Confirmo que verifiquei o estado físico do(s) equipamento(s) (danos, acessórios) no momento da devolução.
                    </Label>
                </div>
                {!confirmChecked && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-3 ml-7">
                        <AlertTriangle className="h-3 w-3" />
                        A confirmação é obrigatória para registrar a devolução.
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
            "w-full h-12 text-base font-semibold",
            "bg-menu-amber hover:bg-menu-amber-hover",
            "shadow-lg shadow-amber-500/25",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        disabled={dbLoading || !isFormValid}
      >
        {dbLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processando devolução...
          </>
        ) : (
          <>
            <RotateCcw className="h-5 w-5 mr-2" />
            {`Confirmar Devolução de ${deviceIds.length} Dispositivo${deviceIds.length !== 1 ? 's' : ''}`}
          </>
        )}
      </Button>
    </form>
  );
}