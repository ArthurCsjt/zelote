import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Laptop, Tag, Hash, MapPin, AlertTriangle, Loader2, CheckCircle, Plus, X } from "lucide-react";
import { useDatabase } from '@/hooks/useDatabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface FormData {
  chromebookId: string;
  manufacturer: string;
  model: string;
  series: string; // Usado como serial_number
  manufacturingYear: string;
  patrimonyNumber: string;
  mobilityStatus: 'movel' | 'fixo'; // NOVO CAMPO
  classroomLocation: string; // Usado como location
  observations: string; // Usado como condition
  provisioning_status: string;
}

// Mapeamento de Fabricantes e Modelos (base fixa)
const BASE_MANUFACTURER_MODELS: Record<string, string[]> = {
  Acer: ['N18Q5', 'N24P1', 'N15Q8', 'N18Q12'],
  Samsung: ['XE500C13', 'XE310XBA', 'XE501C13'],
  Lenovo: ['100e Chromebook Gen 3'],
  HP: ['Chromebook 11 G8 EE', 'Chromebook 11 G9 EE'],
  Dell: ['Chromebook 3100'],
  Multilaser: ['Chromebook M11C'],
  Positivo: ['Chromebook C464'],
  Outro: [],
};

const AVAILABLE_MANUFACTURERS = Object.keys(BASE_MANUFACTURER_MODELS);

export function ManualChromebookForm({ onRegistrationSuccess }: { onRegistrationSuccess: (newChromebook: any) => void }) {
  const { createChromebook, getNextChromebookId, loading } = useDatabase();
  const { toast } = useToast();

  // Estado de modelos dinâmicos (pode adicionar novos modelos por fabricante)
  const [customModelsByManufacturer, setCustomModelsByManufacturer] = useState<Record<string, string[]>>({});
  const [addingModel, setAddingModel] = useState(false);
  const [newModelInput, setNewModelInput] = useState('');
  const addModelInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    chromebookId: "",
    manufacturer: "", model: "", series: "",
    manufacturingYear: "",
    patrimonyNumber: "",
    mobilityStatus: 'movel',
    classroomLocation: "", observations: "", provisioning_status: 'provisioned',
  });
  const [loadingNextId, setLoadingNextId] = useState(false);

  const fetchNextId = useCallback(async () => {
    setLoadingNextId(true);
    try {
      const nextId = await getNextChromebookId();
      if (nextId) {
        setFormData(prev => ({ ...prev, chromebookId: nextId }));
      }
    } finally {
      setLoadingNextId(false);
    }
  }, [getNextChromebookId]);

  useEffect(() => {
    fetchNextId();
  }, [fetchNextId]);

  useEffect(() => {
    if (addingModel && addModelInputRef.current) {
      addModelInputRef.current.focus();
    }
  }, [addingModel]);

  const resetForm = () => {
    setFormData({
      chromebookId: "",
      manufacturer: "", model: "", series: "",
      manufacturingYear: "",
      patrimonyNumber: "",
      mobilityStatus: 'movel',
      classroomLocation: "", observations: "", provisioning_status: 'provisioned',
    });
    fetchNextId();
  };

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
  };

  const handleManufacturerChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      manufacturer: value,
      model: '',
    }));
    setAddingModel(false);
    setNewModelInput('');
  };

  const handleAddModel = () => {
    const trimmed = newModelInput.trim().toUpperCase();
    if (!trimmed || !formData.manufacturer) return;

    const already = getModelsForManufacturer(formData.manufacturer).includes(trimmed);
    if (already) {
      toast({ title: "Modelo já existe", description: `"${trimmed}" já está na lista.`, variant: "destructive" });
      return;
    }

    setCustomModelsByManufacturer(prev => ({
      ...prev,
      [formData.manufacturer]: [...(prev[formData.manufacturer] || []), trimmed],
    }));
    setFormData(prev => ({ ...prev, model: trimmed }));
    setAddingModel(false);
    setNewModelInput('');
    toast({ title: "Modelo adicionado", description: `"${trimmed}" foi adicionado à lista de ${formData.manufacturer}.` });
  };

  const getModelsForManufacturer = (manufacturer: string): string[] => {
    const base = BASE_MANUFACTURER_MODELS[manufacturer] || [];
    const custom = customModelsByManufacturer[manufacturer] || [];
    return [...base, ...custom];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.manufacturer || !formData.model || !formData.series.trim()) {
      toast({ title: "Erro de Validação", description: "Preencha os campos Fabricante, Modelo e Série.", variant: "destructive" });
      return;
    }

    const isFixed = formData.mobilityStatus === 'fixo';
    if (isFixed && !formData.classroomLocation) {
      toast({ title: "Erro de Validação", description: "A localização da sala é obrigatória para equipamentos fixos.", variant: "destructive" });
      return;
    }

    const finalObservations = [
      formData.observations.trim(),
      formData.manufacturingYear.trim() ? `Fabricação: ${formData.manufacturingYear.trim()}` : null
    ].filter(Boolean).join(' | ');

    const chromebookData = {
      chromebookId: formData.chromebookId.trim().toUpperCase() || undefined,
      model: formData.model,
      serialNumber: formData.series.trim().toUpperCase(),
      patrimonyNumber: formData.patrimonyNumber.trim() || undefined,
      manufacturer: formData.manufacturer,
      condition: finalObservations || 'novo',
      location: isFixed ? formData.classroomLocation.trim().toUpperCase() : undefined,
      status: isFixed ? 'fixo' as const : 'disponivel' as const,
      is_deprovisioned: formData.provisioning_status === 'deprovisioned',
    };

    const result = await createChromebook(chromebookData);

    if (result) {
      toast({ title: "Sucesso", description: `Chromebook ${result.chromebook_id} cadastrado com sucesso.` });
      onRegistrationSuccess(result);
      resetForm();
    }
  };

  const currentModels = formData.manufacturer ? getModelsForManufacturer(formData.manufacturer) : [];
  const isFormValid = formData.manufacturer && formData.model && formData.series.trim();
  const isFixed = formData.mobilityStatus === 'fixo';

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-black dark:border-white pb-4 mb-6">
        <h4 className="font-black uppercase text-lg flex items-center gap-2 text-black dark:text-white">
          <Laptop className="h-6 w-6" />
          Cadastro Manual
        </h4>
        <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mt-1">
          Preencha os detalhes para registrar um novo Chromebook na sequência.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Seção 1: Identificação e Modelo */}
        <div className="space-y-4 p-5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
          <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-4">
            <Tag className="h-4 w-4" />
            Identificação e Modelo
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="chromebookId" className="text-xs font-bold uppercase flex items-center gap-1 dark:text-white">
                  <Laptop className="h-3 w-3" /> ID Sequencial *
                </Label>
                <span className="text-[10px] font-black uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-1.5 py-0.5 border border-green-500 flex items-center gap-1">
                  {loadingNextId ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
                  Automático
                </span>
              </div>
              <div className="relative">
                <Input
                  id="chromebookId"
                  value={formData.chromebookId}
                  readOnly
                  placeholder={loadingNextId ? "CONSULTANDO..." : "EX: CHR185"}
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase font-mono font-black text-sm bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                Gerado na sequência padrão do inventário para evitar saltos ou duplicidades.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manufacturer" className="text-xs font-bold uppercase dark:text-white">Fabricante *</Label>
              <Select
                value={formData.manufacturer}
                onValueChange={handleManufacturerChange}
                required
              >
                <SelectTrigger className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 font-bold uppercase">
                  <SelectValue placeholder="SELECIONE" />
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="model" className="text-xs font-bold uppercase dark:text-white">Modelo *</Label>
                {formData.manufacturer && !addingModel && (
                  <button
                    type="button"
                    onClick={() => setAddingModel(true)}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-1.5 py-0.5 border border-blue-500 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                    title="Adicionar novo modelo"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    Novo Modelo
                  </button>
                )}
              </div>

              {addingModel ? (
                <div className="flex gap-1">
                  <Input
                    ref={addModelInputRef}
                    value={newModelInput}
                    onChange={(e) => setNewModelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddModel(); }
                      if (e.key === 'Escape') { setAddingModel(false); setNewModelInput(''); }
                    }}
                    placeholder="NOME DO MODELO"
                    className="h-10 border-2 border-blue-600 dark:border-blue-400 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,200,0.4)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddModel}
                    disabled={!newModelInput.trim()}
                    className="h-10 w-10 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 transition-colors flex-shrink-0"
                    title="Confirmar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingModel(false); setNewModelInput(''); }}
                    className="h-10 w-10 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                    title="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Select
                  value={formData.model}
                  onValueChange={(value) => handleFormChange('model', value)}
                  required
                  disabled={!formData.manufacturer}
                >
                  <SelectTrigger className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 font-bold uppercase">
                    <SelectValue placeholder={formData.manufacturer ? (currentModels.length === 0 ? "USE + PARA ADICIONAR" : "SELECIONE O MODELO") : "FABRICANTE PRIMEIRO"} />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {currentModels.map(model => (
                      <SelectItem key={model} value={model} className="font-bold uppercase text-xs">
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="series" className="text-xs font-bold uppercase flex items-center gap-1 dark:text-white">
                <Hash className="h-3 w-3" /> Série *
              </Label>
              <Input
                id="series"
                value={formData.series}
                onChange={(e) => handleFormChange('series', e.target.value)}
                placeholder="NÚMERO DE SÉRIE"
                required
                className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patrimonyNumber" className="text-xs font-bold uppercase flex items-center gap-1 dark:text-white">
                <Hash className="h-3 w-3" /> Patrimônio
              </Label>
              <Input
                id="patrimonyNumber"
                value={formData.patrimonyNumber}
                onChange={(e) => handleFormChange('patrimonyNumber', e.target.value)}
                placeholder="NÚMERO DE PATRIMÔNIO"
                className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manufacturingYear" className="text-xs font-bold uppercase dark:text-white">Ano de Fabricação</Label>
              <Input
                id="manufacturingYear"
                value={formData.manufacturingYear}
                onChange={(e) => handleFormChange('manufacturingYear', e.target.value)}
                placeholder="EX: 2022"
                className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Localização e Provisionamento */}
        <div className="space-y-4 p-5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
          <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-4">
            <MapPin className="h-4 w-4" />
            Localização e Status
          </h4>

          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase dark:text-white">Status de Mobilidade</Label>
            <RadioGroup
              value={formData.mobilityStatus}
              onValueChange={(value: 'movel' | 'fixo') => {
                handleFormChange('mobilityStatus', value);
                if (value === 'movel') {
                  handleFormChange('classroomLocation', ''); // Limpa localização se for móvel
                }
              }}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="movel" id="movel" className="neo-radio" />
                <Label htmlFor="movel" className="font-bold text-xs uppercase cursor-pointer dark:text-white">Móvel (Disponível)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixo" id="fixo" className="neo-radio" />
                <Label htmlFor="fixo" className="font-bold text-xs uppercase cursor-pointer dark:text-white">Fixo em Sala</Label>
              </div>
            </RadioGroup>

            {isFixed && (
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="classroomLocation" className="text-xs font-bold uppercase dark:text-white">Localização da Sala *</Label>
                <Input
                  id="classroomLocation"
                  value={formData.classroomLocation}
                  onChange={(e) => handleFormChange('classroomLocation', e.target.value)}
                  placeholder="EX: SALA 101"
                  required={isFixed}
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t-2 border-dashed border-black/20 dark:border-white/20">
            <Label className="text-xs font-bold uppercase dark:text-white">Status de Provisionamento</Label>
            <RadioGroup
              value={formData.provisioning_status}
              onValueChange={(value) => handleFormChange('provisioning_status', value)}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="provisioned" id="provisioned" className="neo-radio" />
                <Label htmlFor="provisioned" className="flex items-center gap-1 font-bold text-xs uppercase cursor-pointer dark:text-white">
                  <CheckCircle className="h-3 w-3 text-green-600" /> Provisionado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deprovisioned" id="deprovisioned" className="neo-radio" />
                <Label htmlFor="deprovisioned" className="flex items-center gap-1 font-bold text-xs uppercase cursor-pointer dark:text-white">
                  <AlertTriangle className="h-3 w-3 text-red-600" /> Desprovisionado
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Seção 3: Observações */}
        <div className="space-y-4 p-5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
          <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-4">
            <AlertTriangle className="h-4 w-4" />
            Condição e Observações
          </h4>
          <div className="space-y-1.5">
            <Label htmlFor="observations" className="text-xs font-bold uppercase dark:text-white">Observações (Condição)</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => handleFormChange('observations', e.target.value)}
              placeholder="EX: TELA TRINCADA, BATERIA VICIADA, ETC."
              className="resize-none min-h-[100px] border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 bg-white dark:bg-zinc-950 font-mono text-sm"
            />
          </div>
        </div>

        {/* Botão de Submissão */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full sm:w-auto h-12 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-black hover:bg-gray-800 text-white font-black uppercase tracking-wide transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Cadastrando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Cadastrar Chromebook
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}