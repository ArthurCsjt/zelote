import { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";
import { Laptop, Factory, Tag, Hash, MapPin, AlertTriangle, Loader2, QrCode, CheckCircle } from "lucide-react";
import { useDatabase } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { GlassCard } from "./ui/GlassCard";
import { QRCodeReader } from "./QRCodeReader";

interface FormData {
  chromebookId: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  patrimonyNumber: string;
  mobilityStatus: 'movel' | 'fixo'; // NOVO CAMPO
  classroomLocation: string;
  observations: string;
  provisioning_status: string;
}

// Mapeamento de Modelos para Fabricante (Case Insensitive para chaves)
const MODEL_MAPPING: Record<string, { manufacturer: string; model: string }> = {
  'XE500C13': { manufacturer: 'Samsung', model: 'XE500C13' }, // Adicionado o modelo com C maiúsculo
  'XE500c13': { manufacturer: 'Samsung', model: 'XE500c13' },
  'N18Q5': { manufacturer: 'Acer', model: 'N18Q5' },
  'N24P1': { manufacturer: 'Acer', model: 'N24P1' },
  '100e Chromebook Gen 3': { manufacturer: 'Lenovo', model: '100e Chromebook Gen 3' },
  'XE310XBA': { manufacturer: 'Samsung', model: 'XE310XBA' },
  'XE501C13': { manufacturer: 'Samsung', model: 'XE501C13' },
};

// Função auxiliar para tentar extrair dados do QR Code
const parseQRCodeData = (data: string): Partial<FormData> => {
  try {
    const json = JSON.parse(data);
    if (json && typeof json === 'object') {
      return {
        chromebookId: json.id || '',
        model: json.model || '',
        serialNumber: json.serial || '',
        patrimonyNumber: json.pat || '',
        // Tentativa de inferir fabricante se não estiver no QR
        manufacturer: json.manufacturer || (json.model?.split(' ')[1] || 'Outro'),
      };
    }
  } catch {
    // Se não for JSON, tenta usar a string como ID
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
    mobilityStatus: 'movel', // PADRÃO: MÓVEL
    classroomLocation: "", observations: "Re-cadastrado via QR Code", provisioning_status: 'provisioned',
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const resetForm = () => {
    setFormData({
      chromebookId: "", manufacturer: "", model: "", serialNumber: "",
      patrimonyNumber: "", 
      mobilityStatus: 'movel', // PADRÃO: MÓVEL
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

    // Tenta inferir Fabricante e Modelo a partir do mapeamento (usando o modelo em maiúsculas para a busca)
    const modelKey = inferredModel.toUpperCase();
    if (MODEL_MAPPING[modelKey]) {
        const mapped = MODEL_MAPPING[modelKey];
        inferredManufacturer = mapped.manufacturer;
        inferredModel = mapped.model;
    } else if (parsedData.chromebookId && MODEL_MAPPING[parsedData.chromebookId.toUpperCase()]) {
        // Caso o ID do chromebook seja o modelo (menos comum, mas como fallback)
        const mapped = MODEL_MAPPING[parsedData.chromebookId.toUpperCase()];
        inferredManufacturer = mapped.manufacturer;
        inferredModel = mapped.model;
    }


    setFormData(prev => ({
      ...prev,
      chromebookId: parsedData.chromebookId || prev.chromebookId,
      model: inferredModel || parsedData.model || prev.model, // Usa o modelo inferido ou o modelo do QR
      serialNumber: parsedData.serialNumber || prev.serialNumber,
      patrimonyNumber: parsedData.patrimonyNumber || prev.patrimonyNumber,
      manufacturer: inferredManufacturer || parsedData.manufacturer || prev.manufacturer, // Usa o fabricante inferido ou o do QR
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
      patrimonyNumber: formData.patrimonyNumber || null,
      manufacturer: formData.manufacturer,
      condition: formData.observations || 'novo', 
      location: isFixed ? formData.classroomLocation : null,
      // O status é definido pela mobilidade, e não pelo provisionamento
      status: isFixed ? 'fixo' as const : 'disponivel' as const,
      is_deprovisioned: formData.provisioning_status === 'deprovisioned', // PASSANDO O VALOR
    };
    
    const result = await createChromebook(chromebookData);
    
    if (result) {
      toast({ title: "Sucesso!", description: `Chromebook ${result.chromebook_id} re-cadastrado.` });
      onRegistrationSuccess(result);
      resetForm();
    }
  };

  const isFormValid = formData.chromebookId && formData.model && formData.serialNumber;
  const isFixed = formData.mobilityStatus === 'fixo';

  return (
    <GlassCard className="p-6 space-y-6">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <QrCode className="h-6 w-6 text-menu-teal" />
          Cadastro Inteligente (QR Code)
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code do equipamento para preencher automaticamente os dados e re-cadastrá-lo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Button 
          onClick={() => setIsScannerOpen(true)} 
          size="lg" 
          className="w-full mb-6 bg-menu-teal hover:bg-menu-teal-hover"
          disabled={loading}
        >
          <QrCode className="mr-2 h-5 w-5" />
          Escanear QR Code do Equipamento
        </Button>

        {isDataLoaded && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seção 1: Identificação e Modelo */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                Dados do QR Code (Revise)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chromebookId" className="flex items-center gap-1">
                    ID do Chromebook *
                  </Label>
                  <Input 
                    id="chromebookId" 
                    value={formData.chromebookId} 
                    onChange={(e) => handleFormChange('chromebookId', e.target.value)} 
                    placeholder="ID (Ex: CHR001)"
                    required 
                    className="bg-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patrimonyNumber" className="flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Patrimônio
                  </Label>
                  <Input 
                    id="patrimonyNumber" 
                    value={formData.patrimonyNumber} 
                    onChange={(e) => handleFormChange('patrimonyNumber', e.target.value)} 
                    placeholder="Número de Patrimônio"
                    className="bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serialNumber" className="flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Número de Série *
                  </Label>
                  <Input 
                    id="serialNumber" 
                    value={formData.serialNumber} 
                    onChange={(e) => handleFormChange('serialNumber', e.target.value)} 
                    placeholder="Número de Série"
                    required 
                    className="bg-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Fabricante</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleFormChange('manufacturer', e.target.value)}
                    placeholder="Ex: Lenovo"
                    className="bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input 
                    id="model" 
                    value={formData.model} 
                    onChange={(e) => handleFormChange('model', e.target.value)} 
                    placeholder="Ex: Chromebook 14e"
                    required 
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Localização e Provisionamento (Campos adicionais) */}
            <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
              <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                Localização e Status
              </h4>
              
              <div className="space-y-4">
                <Label className="text-sm font-medium">Status de Mobilidade</Label>
                <RadioGroup
                  value={formData.mobilityStatus}
                  onValueChange={(value: 'movel' | 'fixo') => {
                    handleFormChange('mobilityStatus', value);
                    if (value === 'movel') {
                      handleFormChange('classroomLocation', ''); // Limpa localização se for móvel
                    }
                  }}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="movel" id="movel" />
                    <Label htmlFor="movel">Móvel (Disponível para Empréstimo)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixo" id="fixo" />
                    <Label htmlFor="fixo">Fixo em Sala de Aula</Label>
                  </div>
                </RadioGroup>
                
                {isFixed && (
                  <div className="space-y-2 pl-6 border-l-2 border-purple-200">
                    <Label htmlFor="classroomLocation">Localização da Sala *</Label>
                    <Input 
                      id="classroomLocation" 
                      value={formData.classroomLocation} 
                      onChange={(e) => handleFormChange('classroomLocation', e.target.value)} 
                      placeholder="Ex: Sala 101"
                      required={isFixed} 
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-100">
                <Label className="text-sm font-medium">Status de Provisionamento</Label>
                <RadioGroup
                  value={formData.provisioning_status}
                  onValueChange={(value) => handleFormChange('provisioning_status', value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="provisioned" id="provisioned" />
                    <Label htmlFor="provisioned">Provisionado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deprovisioned" id="deprovisioned" />
                    <Label htmlFor="deprovisioned">Desprovisionado</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Seção 3: Observações */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Condição e Observações
              </h4>
              <div className="space-y-2">
                <Label htmlFor="observations">Observações (Condição)</Label>
                <Textarea 
                  id="observations" 
                  value={formData.observations} 
                  onChange={(e) => handleFormChange('observations', e.target.value)} 
                  placeholder="Ex: Tela trincada, bateria viciada, etc."
                  className="resize-none min-h-[100px] bg-white"
                />
              </div>
            </div>
            
            {/* Botão de Submissão */}
            <Button 
              type="submit" 
              disabled={loading || !isFormValid}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Re-Cadastrando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Re-Cadastro
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
      
      <QRCodeReader
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScanSuccess}
      />
    </GlassCard>
  );
}