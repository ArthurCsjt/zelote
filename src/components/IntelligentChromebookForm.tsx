import { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Laptop, Factory, Tag, Hash, MapPin, AlertTriangle, Loader2, QrCode, CheckCircle } from "lucide-react";
import { useDatabase } from '@/hooks/useDatabase';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

import { QRCodeReader } from "./QRCodeReader";

interface FormData {
  chromebookId: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  patrimonyNumber: string;
  mobilityStatus: 'movel' | 'fixo';
  classroomLocation: string;
  observations: string;
  provisioning_status: string;
}

// Mapeamento de Modelos para Fabricante (Case Insensitive para chaves)
const MODEL_MAPPING: Record<string, { manufacturer: string; model: string }> = {
  'XE500C13': { manufacturer: 'Samsung', model: 'XE500C13' },
  'XE500c13': { manufacturer: 'Samsung', model: 'XE500c13' },
  'N18Q5': { manufacturer: 'Acer', model: 'N18Q5' },
  'N24P1': { manufacturer: 'Acer', model: 'N24P1' },
  'N15Q8': { manufacturer: 'Acer', model: 'N15Q8' },
  'N18Q12': { manufacturer: 'Acer', model: 'N18Q12' },
  '100e Chromebook Gen 3': { manufacturer: 'Lenovo', model: '100e Chromebook Gen 3' },
  'XE310XBA': { manufacturer: 'Samsung', model: 'XE310XBA' },
  'XE501C13': { manufacturer: 'Samsung', model: 'XE501C13' },
};

const parseQRCodeData = (data: string): Partial<FormData> => {
  try {
    const json = JSON.parse(data);
    if (json && typeof json === 'object') {
      return {
        chromebookId: json.id || '',
        model: json.model || '',
        serialNumber: json.serial || '',
        patrimonyNumber: json.pat || '',
        manufacturer: json.manufacturer || (json.model?.split(' ')[1] || 'Outro'),
      };
    }
  } catch {
    return { chromebookId: data };
  }
  return {};
};

export function IntelligentChromebookForm({ onRegistrationSuccess }: { onRegistrationSuccess: (newChromebook: any) => void }) {
  const { createChromebook, loading } = useDatabase();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    chromebookId: "", manufacturer: "", model: "", serialNumber: "",
    patrimonyNumber: "",
    mobilityStatus: 'movel',
    classroomLocation: "", observations: "Re-cadastrado via QR Code", provisioning_status: 'provisioned',
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const resetForm = () => {
    setFormData({
      chromebookId: "", manufacturer: "", model: "", serialNumber: "",
      patrimonyNumber: "",
      mobilityStatus: 'movel',
      classroomLocation: "", observations: "Re-cadastrado via QR Code", provisioning_status: 'provisioned',
    });
    setIsDataLoaded(false);
  };

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
  };

  const handleScanSuccess = useCallback((scannedData: string) => {
    setIsScannerOpen(false);
    const parsedData = parseQRCodeData(scannedData);

    if (!parsedData.chromebookId && !parsedData.serialNumber) {
      toast({ title: "Erro de Leitura", description: "O QR Code não continha dados de identificação válidos.", variant: "destructive" });
      return;
    }

    let inferredManufacturer = parsedData.manufacturer || '';
    let inferredModel = parsedData.model || '';

    const modelKey = inferredModel.toUpperCase();
    if (MODEL_MAPPING[modelKey]) {
      const mapped = MODEL_MAPPING[modelKey];
      inferredManufacturer = mapped.manufacturer;
      inferredModel = mapped.model;
    } else if (parsedData.chromebookId && MODEL_MAPPING[parsedData.chromebookId.toUpperCase()]) {
      const mapped = MODEL_MAPPING[parsedData.chromebookId.toUpperCase()];
      inferredManufacturer = mapped.manufacturer;
      inferredModel = mapped.model;
    }

    setFormData(prev => ({
      ...prev,
      chromebookId: parsedData.chromebookId || prev.chromebookId,
      model: inferredModel || parsedData.model || prev.model,
      serialNumber: parsedData.serialNumber || prev.serialNumber,
      patrimonyNumber: parsedData.patrimonyNumber || prev.patrimonyNumber,
      manufacturer: inferredManufacturer || parsedData.manufacturer || prev.manufacturer,
      observations: "Re-cadastrado via QR Code",
    }));
    setIsDataLoaded(true);
    toast({ title: "Dados Carregados", description: `Dados do Chromebook ${parsedData.chromebookId || parsedData.serialNumber} carregados. Revise e salve.` });
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chromebookId || !formData.model || !formData.serialNumber) {
      toast({ title: "Erro de Validação", description: "Preencha os campos ID, Modelo e Série.", variant: "destructive" });
      return;
    }

    const isFixed = formData.mobilityStatus === 'fixo';
    if (isFixed && !formData.classroomLocation) {
      toast({ title: "Erro de Validação", description: "A localização da sala é obrigatória para equipamentos fixos.", variant: "destructive" });
      return;
    }

    const chromebookData = {
      chromebookId: formData.chromebookId,
      model: formData.model,
      serialNumber: formData.serialNumber,
      patrimonyNumber: formData.patrimonyNumber || undefined,
      manufacturer: formData.manufacturer,
      condition: formData.observations || 'novo',
      location: isFixed ? formData.classroomLocation : undefined,
      status: isFixed ? 'fixo' as const : 'disponivel' as const,
      is_deprovisioned: formData.provisioning_status === 'deprovisioned',
    };

    const result = await createChromebook(chromebookData);

    if (result) {
      toast({ title: "Sucesso", description: `Chromebook ${result.chromebook_id} re-cadastrado.` });
      onRegistrationSuccess(result);
      resetForm();
    }
  };

  const isFormValid = formData.chromebookId && formData.model && formData.serialNumber;
  const isFixed = formData.mobilityStatus === 'fixo';

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-black dark:border-white pb-4 mb-6">
        <h4 className="font-black uppercase text-lg flex items-center gap-2 text-black dark:text-white">
          <QrCode className="h-6 w-6" />
          Cadastro Inteligente (QR Code)
        </h4>
        <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mt-1">
          Escaneie o QR Code para preencher automaticamente os dados.
        </p>
      </div>

      <Button
        onClick={() => setIsScannerOpen(true)}
        size="lg"
        className="w-full mb-6 h-12 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-black hover:bg-gray-800 text-white font-black uppercase tracking-wide transition-all"
        disabled={loading}
      >
        <QrCode className="mr-2 h-5 w-5" />
        Escanear QR Code do Equipamento
      </Button>

      {isDataLoaded && (
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="space-y-4 p-5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950">
            <h4 className="font-black uppercase text-sm flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 mb-4">
              <Tag className="h-4 w-4" />
              Dados do QR Code (Revise)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="chromebookId" className="text-xs font-bold uppercase dark:text-white">
                  ID do Chromebook *
                </Label>
                <Input
                  id="chromebookId"
                  value={formData.chromebookId}
                  onChange={(e) => handleFormChange('chromebookId', e.target.value)}
                  placeholder="ID (EX: CHR001)"
                  required
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold font-mono"
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
                <Label htmlFor="serialNumber" className="text-xs font-bold uppercase flex items-center gap-1 dark:text-white">
                  <Hash className="h-3 w-3" /> Número de Série *
                </Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleFormChange('serialNumber', e.target.value)}
                  placeholder="NÚMERO DE SÉRIE"
                  required
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="manufacturer" className="text-xs font-bold uppercase dark:text-white">Fabricante</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleFormChange('manufacturer', e.target.value)}
                  placeholder="EX: LENOVO"
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model" className="text-xs font-bold uppercase dark:text-white">Modelo *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleFormChange('model', e.target.value)}
                  placeholder="EX: CHROMEBOOK 14E"
                  required
                  className="h-10 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 uppercase placeholder:normal-case font-bold"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Localização e Provisionamento (Campos adicionais) */}
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

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full sm:w-auto h-12 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-black hover:bg-gray-800 text-white font-black uppercase tracking-wide transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Re-Cadastrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Confirmar Re-Cadastro
                </span>
              )}
            </Button>
          </div>
        </form>
      )}

      <QRCodeReader
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScanSuccess}
      />
    </div>
  );
}