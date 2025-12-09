import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Laptop, Factory, Tag, Hash, MapPin, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
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

// Mapeamento de Fabricantes e Modelos
const MANUFACTURER_MODELS: Record<string, string[]> = {
  Acer: ['N18Q5', 'N24P1'],
  Samsung: ['XE500c13', 'XE310XBA', 'XE501C13', 'XE500C13'], // Adicionado XE500C13
  Lenovo: ['100e Chromebook Gen 3'],
};

const AVAILABLE_MANUFACTURERS = Object.keys(MANUFACTURER_MODELS);

export function ManualChromebookForm({ onRegistrationSuccess }: { onRegistrationSuccess: (newChromebook: any) => void }) {
  const { createChromebook, loading } = useDatabase();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    manufacturer: "", model: "", series: "",
    manufacturingYear: "",
    patrimonyNumber: "",
    mobilityStatus: 'movel', // PADRÃO: MÓVEL
    classroomLocation: "", observations: "", provisioning_status: 'provisioned',
  });

  const resetForm = () => {
    setFormData({
      manufacturer: "", model: "", series: "",
      manufacturingYear: "",
      patrimonyNumber: "",
      mobilityStatus: 'movel', // PADRÃO: MÓVEL
      classroomLocation: "", observations: "", provisioning_status: 'provisioned',
    });
  };

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
  };

  const handleManufacturerChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      manufacturer: value,
      model: '' // Limpa o modelo ao mudar o fabricante
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.manufacturer || !formData.model || !formData.series) {
      toast({ title: "Erro de Validação", description: "Preencha os campos Fabricante, Modelo e Série.", variant: "destructive" });
      return;
    }

    const isFixed = formData.mobilityStatus === 'fixo';
    if (isFixed && !formData.classroomLocation) {
      toast({ title: "Erro de Validação", description: "A localização da sala é obrigatória para equipamentos fixos.", variant: "destructive" });
      return;
    }

    const chromebookData = {
      model: formData.model,
      serialNumber: formData.series,
      patrimonyNumber: formData.patrimonyNumber || undefined,
      manufacturer: formData.manufacturer,
      // manufacturingYear não é mapeado diretamente para o DB, mas pode ser incluído em 'condition' se necessário
      condition: formData.observations || 'novo',
      location: isFixed ? formData.classroomLocation : undefined,
      // O status é definido pela mobilidade, e não pelo provisionamento
      status: isFixed ? 'fixo' as const : 'disponivel' as const,
      is_deprovisioned: formData.provisioning_status === 'deprovisioned', // PASSANDO O VALOR
    };

    const result = await createChromebook(chromebookData);

    if (result) {
      toast({ title: "Sucesso", description: `Chromebook ${result.chromebook_id} cadastrado.` });
      onRegistrationSuccess(result);
      resetForm();
    }
    // O erro é tratado dentro do useDatabase
  };

  const isFormValid = formData.manufacturer && formData.model && formData.series;
  const currentModels = formData.manufacturer ? MANUFACTURER_MODELS[formData.manufacturer] || [] : [];
  const isFixed = formData.mobilityStatus === 'fixo';

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-black dark:border-white pb-4 mb-6">
        <h4 className="font-black uppercase text-lg flex items-center gap-2 text-black dark:text-white">
          <Laptop className="h-6 w-6" />
          Cadastro Manual
        </h4>
        <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mt-1">
          Preencha os detalhes para registrar um novo Chromebook.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Seção 1: Identificação e Modelo */}
        <div className="space-y-4 p-5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
          <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-4">
            <Tag className="h-4 w-4" />
            Identificação e Modelo
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="model" className="text-xs font-bold uppercase dark:text-white">Modelo *</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => handleFormChange('model', value)}
                required
                disabled={!formData.manufacturer || currentModels.length === 0}
              >
                <SelectTrigger className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 font-bold uppercase">
                  <SelectValue placeholder={formData.manufacturer ? "SELECIONE O MODELO" : "FABRICANTE PRIMEIRO"} />
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
                <RadioGroupItem value="movel" id="movel" className="border-2 border-black text-black" />
                <Label htmlFor="movel" className="font-bold text-xs uppercase cursor-pointer dark:text-white">Móvel (Disponível)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixo" id="fixo" className="border-2 border-black text-black" />
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
                <RadioGroupItem value="provisioned" id="provisioned" className="border-2 border-black text-black" />
                <Label htmlFor="provisioned" className="flex items-center gap-1 font-bold text-xs uppercase cursor-pointer dark:text-white">
                  <CheckCircle className="h-3 w-3 text-green-600" /> Provisionado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deprovisioned" id="deprovisioned" className="border-2 border-black text-black" />
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
              className="resize-none min-h-[100px] border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 bg-white dark:bg-zinc-950 uppercase placeholder:normal-case font-mono text-sm"
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