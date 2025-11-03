import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";
import { Laptop, Factory, Tag, Hash, MapPin, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
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
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard

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
      patrimonyNumber: formData.patrimonyNumber || null,
      manufacturer: formData.manufacturer,
      // manufacturingYear não é mapeado diretamente para o DB, mas pode ser incluído em 'condition' se necessário
      condition: formData.observations || 'novo', 
      location: isFixed ? formData.classroomLocation : null,
      // O status é definido pela mobilidade, e não pelo provisionamento
      status: isFixed ? 'fixo' as const : 'disponivel' as const,
      is_deprovisioned: formData.provisioning_status === 'deprovisioned', // PASSANDO O VALOR
    };
    
    const result = await createChromebook(chromebookData);
    
    if (result) {
      toast({ title: "Sucesso!", description: `Chromebook ${result.chromebook_id} cadastrado.` });
      onRegistrationSuccess(result);
      resetForm();
    }
    // O erro é tratado dentro do useDatabase
  };

  const isFormValid = formData.manufacturer && formData.model && formData.series;
  const currentModels = formData.manufacturer ? MANUFACTURER_MODELS[formData.manufacturer] || [] : [];
  const isFixed = formData.mobilityStatus === 'fixo';

  return (
    <GlassCard className="p-6 space-y-6">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-bold text-gray-800 dark:text-foreground flex items-center gap-2">
          <Laptop className="h-6 w-6 text-green-600" />
          Cadastro Manual
        </CardTitle>
        <CardDescription>
          Preencha os detalhes para registrar um novo Chromebook no inventário.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seção 1: Identificação e Modelo */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50 dark:bg-card/50">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              Identificação e Modelo
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante *</Label>
                <Select
                  value={formData.manufacturer}
                  onValueChange={handleManufacturerChange}
                  required
                >
                  <SelectTrigger className="bg-input dark:bg-card">
                    <SelectValue placeholder="Selecione um fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MANUFACTURERS.map(manufacturer => (
                      <SelectItem key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => handleFormChange('model', value)}
                  required
                  disabled={!formData.manufacturer || currentModels.length === 0}
                >
                  <SelectTrigger className="bg-input dark:bg-card">
                    <SelectValue placeholder={formData.manufacturer ? "Selecione o modelo" : "Selecione um fabricante primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="series">
                  Série *
                </Label>
                <Input 
                  id="series" 
                  value={formData.series} 
                  onChange={(e) => handleFormChange('series', e.target.value)} 
                  placeholder="Número de Série"
                  required 
                  className="bg-input dark:bg-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patrimonyNumber">
                  Patrimônio
                </Label>
                <Input 
                  id="patrimonyNumber" 
                  value={formData.patrimonyNumber} 
                  onChange={(e) => handleFormChange('patrimonyNumber', e.target.value)} 
                  placeholder="Número de Patrimônio"
                  className="bg-input dark:bg-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manufacturingYear">Ano de Fabricação</Label>
                <Input 
                  id="manufacturingYear" 
                  value={formData.manufacturingYear} 
                  onChange={(e) => handleFormChange('manufacturingYear', e.target.value)} 
                  placeholder="Ex: 2022"
                  className="bg-input dark:bg-card"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Localização e Provisionamento */}
          <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm dark:bg-card">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-foreground flex items-center gap-2">
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
                    className="bg-input dark:bg-card"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-border">
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
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50 dark:bg-card/50">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-foreground flex items-center gap-2">
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
                className="resize-none min-h-[100px] bg-input dark:bg-card"
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
                Cadastrando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Cadastrar Chromebook
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </GlassCard>
  );
}