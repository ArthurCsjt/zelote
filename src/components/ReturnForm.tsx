import React, { useState, useCallback, useEffect } from 'react';
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Computer, User, AlertTriangle, CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { toast } from "./ui/use-toast";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";
import UserAutocomplete from "./UserAutocomplete";
import { DeviceListInput } from "./DeviceListInput";
import { GlassCard } from "./ui/GlassCard";
import { useDatabase } from '@/hooks/useDatabase';
import type { UserSearchResult } from '@/hooks/useUserSearch';
import type { ReturnFormData } from '@/types/database';

interface ReturnFormProps {
  onReturnSuccess?: () => void;
}

export function ReturnForm({ onReturnSuccess }: ReturnFormProps) {
  const { bulkReturnChromebooks, loading: dbLoading } = useDatabase();
  
  // Inicializa a lista de dispositivos vazia
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
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
        // O TOAST DE SUCESSO JÁ É EMITIDO DENTRO DO bulkReturnChromebooks
        
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

  return (
    <form onSubmit={handleConfirmReturn} className="space-y-6 relative">
      {/* Gradiente de fundo sutil para a área do formulário */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-amber-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      <div className="grid md:grid-cols-2 gap-6 relative z-10">
        
        {/* Coluna Esquerda - Dispositivo/Lote (Cor 1: Âmbar) */}
        <GlassCard className="bg-menu-amber/10 border-menu-amber/30 shadow-inner dark:bg-menu-amber/20 dark:border-menu-amber/50">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg flex items-center gap-2 text-menu-amber dark:text-orange-400">
              <Computer className="h-5 w-5" /> Dispositivos para Devolução
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <DeviceListInput
              deviceIds={deviceIds}
              setDeviceIds={setDeviceIds}
              disabled={dbLoading}
              filterStatus="emprestado"
              actionLabel="Devolução"
            />
          </CardContent>
        </GlassCard>

        {/* Coluna Direita - Informações do Usuário e Observações */}
        <div className="space-y-6">
          {/* Informações do Solicitante (Cor 2: Âmbar) */}
          <GlassCard className="bg-menu-amber/10 border-menu-amber/30 shadow-inner dark:bg-menu-amber/20 dark:border-menu-amber/50">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-lg flex items-center gap-2 text-menu-amber dark:text-orange-400">
                <User className="h-5 w-5" /> Informações do Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
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
              
              {!selectedUser && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950/50 dark:border-red-900">
                  <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Selecione o solicitante para prosseguir.
                  </p>
                </div>
              )}
            </CardContent>
          </GlassCard>
          
          {/* Campo de Observações (Cor 3: Âmbar) */}
          <GlassCard className="p-4 space-y-4 bg-menu-amber/10 border-menu-amber/30 shadow-md dark:bg-menu-amber/20 dark:border-menu-amber/50">
            <CardTitle className="text-lg flex items-center gap-2 text-menu-amber dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" /> Observações da Devolução
            </CardTitle>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground">
                Condição do equipamento ou notas (Opcional)
              </Label>
              <Textarea
                id="notes"
                value={returnData.notes || ''}
                onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                placeholder="Ex: O Chromebook foi devolvido com a tela trincada."
                className="bg-white border-gray-200 min-h-[80px] dark:bg-card dark:border-border"
              />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Confirmação e Botão Final */}
      <div className="mt-4 p-4 rounded-xl border bg-amber-50/50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-900">
        <div className="flex items-start gap-2">
          <Checkbox id="confirmChecked" checked={confirmChecked} onCheckedChange={(v) => setConfirmChecked(!!v)} className="mt-1 border-amber-500" />
          <Label htmlFor="confirmChecked" className="text-sm text-foreground leading-5 cursor-pointer">
            <div className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Verificação Obrigatória
            </div>
            Confirmo que verifiquei o estado físico do(s) equipamento(s) (danos, acessórios) no momento da devolução.
          </Label>
        </div>
      </div>

      <Button 
        type="submit"
        className="w-full bg-menu-amber hover:bg-menu-amber-hover"
        disabled={
          dbLoading || 
          !confirmChecked || 
          !selectedUser ||
          deviceIds.length === 0
        }
      >
        {dbLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            {`Confirmar Devolução de ${deviceIds.length} Dispositivo${deviceIds.length !== 1 ? 's' : ''}`}
          </>
        )}
      </Button>
    </form>
  );
}