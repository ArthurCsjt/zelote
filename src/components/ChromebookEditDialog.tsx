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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"; // Importando RadioGroup
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
      // Se o status for 'fora_uso', marca como desprovisionado
      is_deprovisioned: newStatus === 'fora_uso',
    }));
  };
  
  // Handle is_deprovisioned checkbox change in edit dialog
  const handleDeprovisionedChange = (checked: boolean) => {
    if (!editingChromebook) return;
    
    // Se marcar como desprovisionado, o status deve ser 'fora_uso'
    const newStatus = checked ? 'fora_uso' : 'disponivel';

    setEditingChromebook(prev => ({
      ...prev!,
      is_deprovisioned: checked,
      status: newStatus,
    }));
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
    if (editingChromebook.status === 'fixo' && !editingChromebook.classroom) {
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
          
          {/* Seção 1: Identificação e Modelo */}
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

          {/* Seção 2: Status e Localização */}
          <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm dark:bg-card">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              Status e Localização
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs font-medium">Status</Label>
                <Select 
                    value={editingChromebook.status} 
                    onValueChange={handleEditStatusChange}
                    disabled={editingChromebook.status === 'emprestado'} // Não permite mudar se estiver emprestado
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="emprestado" disabled>Emprestado</SelectItem>
                    <SelectItem value="fixo">Fixo</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="fora_uso">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                {editingChromebook.status === 'emprestado' && (
                    <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" /> Status definido por empréstimo ativo.
                    </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">Status de Mobilidade</Label>
                <RadioGroup
                    value={isFixed ? 'fixo' : 'movel'}
                    onValueChange={(value: 'movel' | 'fixo') => {
                        const newStatus = value === 'fixo' ? 'fixo' : 'disponivel';
                        handleEditStatusChange(newStatus);
                    }}
                    className="flex space-x-4 h-10 items-center"
                    disabled={editingChromebook.status === 'emprestado' || editingChromebook.status === 'manutencao' || editingChromebook.status === 'fora_uso'}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="movel" id="movel" />
                        <Label htmlFor="movel">Móvel (Empréstimo)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixo" id="fixo" />
                        <Label htmlFor="fixo">Fixo (Sala de Aula)</Label>
                    </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    />
                </div>
            </div>
            
            {/* Checkbox de Desprovisionamento */}
            <div className="flex items-center space-x-2 pt-4 border-t border-gray-100 dark:border-border">
              <Checkbox 
                id="is_deprovisioned" 
                checked={editingChromebook.is_deprovisioned} 
                onCheckedChange={(checked) => handleDeprovisionedChange(!!checked)}
                disabled={!isAdmin || editingChromebook.status === 'emprestado'}
              />
              <Label htmlFor="is_deprovisioned" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                {editingChromebook.is_deprovisioned ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                Desprovisionado (Marca o equipamento como Inativo/Fora de Uso)
              </Label>
            </div>
          </div>

          {/* Seção 3: Condição/Observações */}
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