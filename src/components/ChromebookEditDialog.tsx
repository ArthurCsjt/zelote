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
import { toast } from "@/hooks/use-toast";
import { Edit3, Save, Tag, Hash, Factory, MapPin, AlertTriangle, Loader2, Map, CheckCircle, XCircle, Info } from "lucide-react";
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

// Mapeamento de Fabricantes e Modelos (Copiado de ManualChromebookForm.tsx)
const MANUFACTURER_MODELS: Record<string, string[]> = {
  Acer: ['N18Q5', 'N24P1'],
  Samsung: ['XE500c13', 'XE310XBA', 'XE501C13', 'XE500C13'],
  Lenovo: ['100e Chromebook Gen 3'],
  HP: ['Chromebook 11 G8 EE', 'Chromebook 11 G9 EE'],
  Dell: ['Chromebook 3100'],
  Multilaser: ['Chromebook M11C'],
};
const AVAILABLE_MANUFACTURERS = Object.keys(MANUFACTURER_MODELS);

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

  // Handle form change (apenas para inputs de texto)
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editingChromebook) return;

    // Mapeia IDs de input para chaves do estado (que são snake_case)
    const fieldMap: Record<string, keyof ChromebookDataExtended> = {
      'chromebook_id': 'chromebook_id',
      'patrimony_number': 'patrimony_number',
      'serial_number': 'serial_number',
      'location': 'location',
      'classroom': 'classroom',
      'condition': 'condition',
    };

    const field = fieldMap[e.target.id] || e.target.id as keyof ChromebookDataExtended;

    setEditingChromebook({
      ...editingChromebook,
      [field]: e.target.value,
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

  // Handle Select change (Fabricante, Modelo)
  const handleSelectChange = (field: keyof ChromebookDataExtended, value: string) => {
    if (!editingChromebook) return;

    if (field === 'manufacturer') {
      setEditingChromebook(prev => ({
        ...prev!,
        manufacturer: value,
        model: '', // Limpa o modelo ao mudar o fabricante
      }));
    } else {
      setEditingChromebook(prev => ({
        ...prev!,
        [field]: value,
      }));
    }
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
      return newState;
    });
  };


  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingChromebook) return;

    // Validate required fields
    if (!editingChromebook.chromebook_id || !editingChromebook.model || !editingChromebook.manufacturer) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha os campos ID, Fabricante e Modelo.",
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

    // Mapeia os campos snake_case do estado local para camelCase do ChromebookData
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

  const currentModels = editingChromebook.manufacturer ? MANUFACTURER_MODELS[editingChromebook.manufacturer] || [] : [];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] max-w-none sm:w-full sm:max-w-5xl sm:max-h-[90vh] flex flex-col p-0 border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] rounded-none sm:rounded-none bg-white dark:bg-zinc-900 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b-4 border-black dark:border-white shrink-0 bg-yellow-300 dark:bg-yellow-900/50">
          <DialogTitle className="text-xl font-black uppercase flex items-center gap-3 text-black dark:text-white tracking-tight">
            <div className="p-1.5 border-2 border-black dark:border-white bg-white dark:bg-black">
              <Edit3 className="h-5 w-5 text-black dark:text-white" />
            </div>
            Editar Chromebook: <span className="font-mono bg-white dark:bg-black px-2 py-0.5 border-2 border-black dark:border-white">{editingChromebook.chromebook_id}</span>
          </DialogTitle>
          <DialogDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
            Atualize as informações do Chromebook. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-white dark:bg-zinc-900">

          {/* Seção 1: Identificação e Modelo */}
          <div className="space-y-4 p-5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
            <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-4">
              <Tag className="h-4 w-4" />
              Identificação e Modelo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="chromebook_id" className="text-xs font-bold uppercase dark:text-white">
                  ID do Chromebook *
                </Label>
                <Input
                  id="chromebook_id"
                  value={editingChromebook.chromebook_id}
                  className="h-10 border-2 border-black dark:border-white rounded-none bg-gray-100 dark:bg-zinc-800 font-mono font-bold"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patrimony_number" className="text-xs font-bold uppercase flex items-center gap-1 dark:text-white">
                  <Hash className="h-3 w-3" /> Patrimônio
                </Label>
                <Input
                  id="patrimony_number"
                  value={editingChromebook.patrimony_number || ""}
                  onChange={handleEditChange}
                  placeholder="NÚMERO DO PATRIMÔNIO"
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="serial_number" className="text-xs font-bold uppercase flex items-center gap-1 dark:text-white">
                  <Hash className="h-3 w-3" /> Número de Série
                </Label>
                <Input
                  id="serial_number"
                  value={editingChromebook.serial_number || ""}
                  onChange={handleEditChange}
                  placeholder="NÚMERO DE SÉRIE"
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fabricante (SELECT) */}
              <div className="space-y-1.5">
                <Label htmlFor="manufacturer" className="text-xs font-bold uppercase flex items-center gap-1 dark:text-white">
                  <Factory className="h-3 w-3" /> Fabricante *
                </Label>
                <Select
                  value={editingChromebook.manufacturer || ''}
                  onValueChange={(value) => handleSelectChange('manufacturer', value)}
                >
                  <SelectTrigger className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0">
                    <SelectValue placeholder="SELECIONE O FABRICANTE" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {AVAILABLE_MANUFACTURERS.map(manufacturer => (
                      <SelectItem key={manufacturer} value={manufacturer} className="font-bold uppercase text-xs">
                        {manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Modelo (SELECT) */}
              <div className="space-y-1.5">
                <Label htmlFor="model" className="text-xs font-bold uppercase dark:text-white">Modelo *</Label>
                <Select
                  value={editingChromebook.model}
                  onValueChange={(value) => handleSelectChange('model', value)}
                  disabled={!editingChromebook.manufacturer || currentModels.length === 0}
                >
                  <SelectTrigger className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0">
                    <SelectValue placeholder={editingChromebook.manufacturer ? "SELECIONE O MODELO" : "SELECIONE UM FABRICANTE PRIMEIRO"} />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {currentModels.map(model => (
                      <SelectItem key={model} value={model} className="font-bold uppercase text-xs">
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção 2: Status e Localização (REESTRUTURADA) */}
          <div className="space-y-4 p-5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
            <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-4">
              <MapPin className="h-4 w-4" />
              Status e Localização
            </h4>

            {/* Linha 1: Status de Uso (Select) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase dark:text-white">Status de Uso</Label>
              <Select
                value={editingChromebook.status}
                onValueChange={handleEditStatusChange}
                disabled={isEmprestado}
              >
                <SelectTrigger className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectItem value="disponivel" className="font-bold uppercase text-xs">Disponível</SelectItem>
                  <SelectItem value="emprestado" disabled className="font-bold uppercase text-xs">Emprestado</SelectItem>
                  <SelectItem value="fixo" className="font-bold uppercase text-xs">Fixo</SelectItem>
                  <SelectItem value="manutencao" className="font-bold uppercase text-xs">Manutenção</SelectItem>
                  <SelectItem value="fora_uso" className="font-bold uppercase text-xs">Inativo</SelectItem>
                </SelectContent>
              </Select>
              {isEmprestado && (
                <p className="text-[10px] font-bold uppercase text-yellow-600 flex items-center gap-1 mt-1 bg-yellow-50 p-1 border border-yellow-200 w-fit">
                  <AlertTriangle className="h-3 w-3" /> Status definido por empréstimo ativo.
                </p>
              )}
            </div>

            {/* Linha 2: Status de Mobilidade (RadioGroup) */}
            <div className="space-y-2 pt-4 border-t-2 border-dashed border-black/20 dark:border-white/20">
              <Label className="text-xs font-bold uppercase dark:text-white">Status de Mobilidade</Label>
              <RadioGroup
                value={currentMobilityStatus}
                onValueChange={handleMobilityChange}
                className="flex space-x-6"
                disabled={isMobilityDisabled}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="movel" id="movel-edit" className="border-2 border-black text-black" />
                  <Label htmlFor="movel-edit" className="font-bold text-xs uppercase cursor-pointer dark:text-white">Móvel (Disponível)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixo" id="fixo-edit" className="border-2 border-black text-black" />
                  <Label htmlFor="fixo-edit" className="font-bold text-xs uppercase cursor-pointer dark:text-white">Fixo em Sala</Label>
                </div>
              </RadioGroup>
              {isMobilityDisabled && (
                <p className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" /> Mobilidade desabilitada: Status atual é {editingChromebook.status}.
                </p>
              )}
            </div>

            {/* Linha 3: Localização (Geral e Sala) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-bold uppercase flex items-center gap-1 dark:text-white">
                  <Map className="h-3 w-3" /> Localização Geral
                </Label>
                <Input
                  id="location"
                  value={editingChromebook.location || ""}
                  onChange={handleEditChange}
                  placeholder="EX: SALA DE INFORMÁTICA"
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="classroom" className="text-xs font-bold uppercase dark:text-white">Sala de Aula (Obrigatório se Fixo)</Label>
                <Input
                  id="classroom"
                  value={editingChromebook.classroom || ''}
                  onChange={handleEditChange}
                  placeholder="EX: SALA 21"
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case"
                  required={isFixed}
                  disabled={!isFixed}
                />
              </div>
            </div>

            {/* Linha 4: Status de Provisionamento (RadioGroup) */}
            <div className="space-y-2 pt-4 border-t-2 border-dashed border-black/20 dark:border-white/20">
              <Label className="text-xs font-bold uppercase dark:text-white">Status de Provisionamento</Label>
              <RadioGroup
                value={currentProvisioningStatus}
                onValueChange={handleProvisioningChange}
                className="flex space-x-6"
                disabled={isProvisioningDisabled}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="provisioned" id="provisioned-edit" className="border-2 border-black text-black" />
                  <Label htmlFor="provisioned-edit" className="flex items-center gap-1 font-bold text-xs uppercase cursor-pointer dark:text-white">
                    <CheckCircle className="h-3 w-3 text-green-600" /> Provisionado
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="deprovisioned" id="deprovisioned-edit" className="border-2 border-black text-black" />
                  <Label htmlFor="deprovisioned-edit" className="flex items-center gap-1 font-bold text-xs uppercase cursor-pointer dark:text-white">
                    <XCircle className="h-3 w-3 text-red-600" /> Desprovisionado
                  </Label>
                </div>
              </RadioGroup>
              {isProvisioningDisabled && (
                <p className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" /> Provisionamento desabilitado: O equipamento está emprestado.
                </p>
              )}
            </div>
          </div>

          {/* Seção 3: Condição/Observações */}
          <div className="space-y-4 p-5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
            <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-4">
              <AlertTriangle className="h-4 w-4" />
              Condição e Notas
            </h4>

            <div className="space-y-1.5">
              <Label htmlFor="condition" className="text-xs font-bold uppercase dark:text-white">Condição/Observações</Label>
              <Textarea
                id="condition"
                value={editingChromebook.condition || ""}
                onChange={handleConditionChange}
                placeholder="OBSERVAÇÕES (EX: TELA TRINCADA, BATERIA FRACA)"
                className="resize-none min-h-[100px] border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 bg-white dark:bg-zinc-950 uppercase placeholder:normal-case font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-6 border-t-4 border-black dark:border-white bg-gray-50 shrink-0 flex-col sm:flex-row gap-3 sm:justify-end dark:bg-zinc-900">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-10 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white font-bold uppercase text-xs"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            className="w-full sm:w-auto h-10 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-black hover:bg-gray-800 text-white font-bold uppercase text-xs"
            disabled={isSaving || !editingChromebook.model || !editingChromebook.manufacturer || (isFixed && !editingChromebook.classroom)}
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