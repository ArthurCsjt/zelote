import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { toast } from "./ui/use-toast";
import { Edit3, Save, Tag, Hash, Factory, MapPin, AlertTriangle, Loader2, Map, CheckCircle, XCircle } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useDatabase } from '@/hooks/useDatabase';
import { useProfileRole } from '@/hooks/use-profile-role';
import type { Chromebook, ChromebookData } from "@/types/database";

// Interface para o estado interno do formulário de edição
interface ChromebookDataExtended extends Chromebook {
  classroom?: string;
  manufacturer?: string;
  is_deprovisioned?: boolean;
}

interface ChromebookEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chromebook: ChromebookDataExtended | null;
}

export function ChromebookEditDialog({ open, onOpenChange, chromebook }: ChromebookEditDialogProps) {
  const { isAdmin } = useProfileRole();
  const { updateChromebook, loading: isSaving } = useDatabase();
  const [editingChromebook, setEditingChromebook] = useState<ChromebookDataExtended | null>(null);

  // Sincroniza o estado interno com a prop externa
  useEffect(() => {
    if (chromebook) {
      setEditingChromebook({ ...chromebook });
    }
  }, [chromebook]);

  // Handle form change
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editingChromebook) return;

    setEditingChromebook({
      ...editingChromebook,
      [e.target.id]: e.target.value,
    });
  };

  // Handle condition change
  const handleConditionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingChromebook) return;

    setEditingChromebook({
      ...editingChromebook,
      condition: e.target.value,
    });
  };

  // Handle status change in edit dialog
  const handleEditStatusChange = (value: string) => {
    if (!editingChromebook) return;
    
    const newStatus = value as ChromebookDataExtended['status'];
    
    // Se o status for 'emprestado', não permite alteração manual
    if (newStatus === 'emprestado' && editingChromebook.status !== 'emprestado') {
        toast({ title: "Atenção", description: "O status 'Emprestado' é definido automaticamente pelo sistema de empréstimos.", variant: "destructive" });
        return;
    }

    setEditingChromebook(prev => ({
      ...prev!,
      status: newStatus,
    }));
  };
  
  // Handle mobility status change (movel/fixo)
  const handleMobilityChange = (value: 'movel' | 'fixo') => {
    if (!editingChromebook) return;
    
    const newStatus = value === 'fixo' ? 'fixo' : 'disponivel';
    
    // Se o status atual for emprestado/manutencao/fora_uso, não sobrescreve, apenas atualiza o campo classroom
    if (editingChromebook.status === 'emprestado' || editingChromebook.status === 'manutencao' || editingChromebook.status === 'fora_uso') {
        setEditingChromebook(prev => ({
            ...prev!,
            // Mantém o status atual, mas atualiza a localização se for fixo
            classroom: value === 'movel' ? '' : prev!.classroom,
        }));
        return;
    }

    setEditingChromebook(prev => ({
      ...prev!,
      status: newStatus,
      classroom: value === 'movel' ? '' : prev!.classroom,
    }));
  };

  // Handle provisioning status change (provisioned/deprovisioned)
  const handleProvisioningChange = (value: 'provisioned' | 'deprovisioned') => {
    if (!editingChromebook) return;
    
    const isDeprovisioned = value === 'deprovisioned';
    
    setEditingChromebook(prev => {
      const newState = { ...prev!, is_deprovisioned: isDeprovisioned };
      
      // Sugestão de status: se desprovisionado, sugere 'fora_uso'. Se provisionado, sugere 'disponivel'.
      // Mas só muda se o status atual for 'fora_uso' ou 'disponivel' (para não sobrescrever 'fixo' ou 'manutencao')
      if (isDeprovisioned && newState.status !== 'emprestado' && newState.status !== 'manutencao' && newState.status !== 'fixo') {
        newState.status = 'fora_uso';
      } else if (!isDeprovisioned && newState.status === 'fora_uso') {
        newState.status = 'disponivel';
      }
      
      return newState;
    });
  };


  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingChromebook) return;

    // Validate required fields
    if (!editingChromebook.chromebook_id || !editingChromebook.model) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Validação de localização para status 'fixo'
    const isFixed = editingChromebook.status === 'fixo';
    if (isFixed && !editingChromebook.classroom) {
        toast({
            title: "Erro de Validação",
            description: "A localização da sala é obrigatória para equipamentos fixos.",
            variant: "destructive",
        });
        return;
    }

    const updatePayload: Partial<ChromebookData> = {
      chromebookId: editingChromebook.chromebook_id,
      model: editingChromebook.model,
      manufacturer: editingChromebook.manufacturer,
      serialNumber: editingChromebook.serial_number,
      patrimonyNumber: editingChromebook.patrimony_number,
      status: editingChromebook.status,
      condition: editingChromebook.condition,
      location: editingChromebook.location,
      classroom: editingChromebook.classroom,
      is_deprovisioned: editingChromebook.is_deprovisioned,
    };

    const success = await updateChromebook(editingChromebook.id, updatePayload);

    if (success) {
      onOpenChange(false);
    }
  };

  if (!editingChromebook) return null;
  
  const isFixed = editingChromebook.status === 'fixo';
  const isEmprestado = editingChromebook.status === 'emprestado';
  const isManutencao = editingChromebook.status === 'manutencao';
  const isForaUso = editingChromebook.status === 'fora_uso';
  
  const currentMobilityStatus = isFixed ? 'fixo' : 'movel';
  const currentProvisioningStatus = editingChromebook.is_deprovisioned ? 'deprovisioned' : 'provisioned';
  
  // Desabilita a mudança de mobilidade se o status for ativo (emprestado, manutencao, fora_uso)
  const isMobilityDisabled = isEmprestado || isManutencao || isForaUso;
  // Desabilita a mudança de provisionamento se estiver emprestado
  const isProvisioningDisabled = isEmprestado;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] h-[95vh] max-w-none sm:w-full sm:max-w-5xl sm:max-h-[90vh] flex flex-col p-0"
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Editar Chromebook: {editingChromebook.chromebook_id}
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do Chromebook. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          
          {/* Seção 1: Identificação e Modelo (Sem Alterações) */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              Identificação e Modelo
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="chromebook_id" className="text-xs font-medium flex items-center gap-1">
                  ID do Chromebook *
                </Label>
                <Input
                  id="chromebook_id"
                  value={editingChromebook.chromebook_id}
                  className="h-10 bg-gray-200 cursor-not-allowed font-mono text-sm dark:bg-gray-700 dark:text-gray-200"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patrimony_number" className="text-xs font-medium flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Patrimônio
                </Label>
                <Input
                  id="patrimony_number"
                  value={editingChromebook.patrimony_number || ""}
                  onChange={handleEditChange}
                  placeholder="Número do patrimônio"
                  className="h-10"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="serial_number" className="text-xs font-medium flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Número de Série
                </Label>
                <Input
                  id="serial_number"
                  value={editingChromebook.serial_number || ""}
                  onChange={handleEditChange}
                  placeholder="Número de série"
                  className="h-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="manufacturer" className="text-xs font-medium flex items-center gap-1">
                  <Factory className="h-3 w-3" /> Fabricante
                </Label>
                <Input
                  id="manufacturer"
                  value={editingChromebook.manufacturer || ""}
                  onChange={handleEditChange}
                  placeholder="Ex: Lenovo"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model" className="text-xs font-medium">Modelo *</Label>
                <Input
                  id="model"
                  value={editingChromebook.model}
                  onChange={handleEditChange}
                  placeholder="Ex: Chromebook 14e"
                  className="h-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Status e Localização (REESTRUTURADA) */}
          <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm dark:bg-card">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              Status e Localização
            </h4>
            
            {/* Linha 1: Status de Uso (Select) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status de Uso (Empréstimo/Manutenção)</Label>
              <Select 
                  value={editingChromebook.status} 
                  onValueChange={handleEditStatusChange}
                  disabled={isEmprestado} // Não permite mudar se estiver emprestado
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="emprestado" disabled>Emprestado (Ativo)</SelectItem>
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="fora_uso">Inativo</SelectItem>
                </SelectContent>
              </Select>
              {isEmprestado && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" /> Status definido por empréstimo ativo.
                  </p>
              )}
            </div>

            {/* Linha 2: Status de Mobilidade (RadioGroup) */}
            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-border">
              <Label className="text-sm font-medium">Status de Mobilidade</Label>
              <RadioGroup
                value={currentMobilityStatus}
                onValueChange={handleMobilityChange}
                className="flex space-x-4"
                disabled={isMobilityDisabled}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="movel" id="movel-edit" />
                  <Label htmlFor="movel-edit">Móvel (Disponível para Empréstimo)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixo" id="fixo-edit" />
                  <Label htmlFor="fixo-edit">Fixo em Sala de Aula</Label>
                </div>
              </RadioGroup>
              {isMobilityDisabled && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3" /> Mobilidade desabilitada: Status atual é {editingChromebook.status}.
                  </p>
              )}
            </div>
            
            {/* Linha 3: Localização (Geral e Sala) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs font-medium flex items-center gap-1">
                      <Map className="h-3 w-3" /> Localização Geral
                    </Label>
                    <Input
                      id="location"
                      value={editingChromebook.location || ""}
                      onChange={handleEditChange}
                      placeholder="Ex: Sala de informática"
                      className="h-10"
                    />
                </div>
                
                <div className="space-y-1.5">
                    <Label htmlFor="classroom" className="text-xs font-medium">Sala de Aula (Obrigatório se Fixo)</Label>
                    <Input
                      id="classroom"
                      value={editingChromebook.classroom || ''}
                      onChange={handleEditChange}
                      placeholder="Ex.: Sala 21"
                      className="h-10"
                      required={isFixed}
                      disabled={!isFixed}
                    />
                </div>
            </div>
            
            {/* Linha 4: Status de Provisionamento (RadioGroup) */}
            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-border">
              <Label className="text-sm font-medium">Status de Provisionamento</Label>
              <RadioGroup
                value={currentProvisioningStatus}
                onValueChange={handleProvisioningChange}
                className="flex space-x-4"
                disabled={isProvisioningDisabled}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="provisioned" id="provisioned-edit" />
                  <Label htmlFor="provisioned-edit" className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" /> Provisionado
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="deprovisioned" id="deprovisioned-edit" />
                  <Label htmlFor="deprovisioned-edit" className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" /> Desprovisionado
                  </Label>
                </div>
              </RadioGroup>
              {isProvisioningDisabled && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3" /> Provisionamento desabilitado: O equipamento está emprestado.
                  </p>
              )}
            </div>
          </div>

          {/* Seção 3: Condição/Observações (Sem Alterações) */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Condição e Notas
            </h4>
            
            <div className="space-y-1.5">
              <Label htmlFor="condition" className="text-xs font-medium">Condição/Observações</Label>
              <Textarea
                id="condition"
                value={editingChromebook.condition || ""}
                onChange={handleConditionChange}
                placeholder="Digite observações sobre a condição do equipamento (ex: tela trincada, bateria fraca)"
                className="resize-none min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-white shrink-0 flex-col sm:flex-row gap-2 sm:justify-end dark:bg-card">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-10"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveEdit}
            className="w-full sm:w-auto h-10"
            disabled={isSaving || !editingChromebook.model || (isFixed && !editingChromebook.classroom)}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}