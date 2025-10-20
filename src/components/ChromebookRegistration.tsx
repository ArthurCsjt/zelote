import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";
import { Laptop, Factory, Tag, Hash, MapPin, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { useDatabase } from '@/contexts/DatabaseContext';
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
  isFixedInClassroom: boolean;
  classroomLocation: string; // Usado como location
  observations: string; // Usado como condition
  provisioning_status: string;
}

export function ChromebookRegistration({ onRegistrationSuccess }: { onRegistrationSuccess: (newChromebook: any) => void }) {
  const { createChromebook, loading } = useDatabase();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    manufacturer: "", model: "", series: "",
    manufacturingYear: "",
    patrimonyNumber: "", isFixedInClassroom: false,
    classroomLocation: "", observations: "", provisioning_status: 'provisioned',
  });

  const resetForm = () => {
    setFormData({
      manufacturer: "", model: "", series: "",
      manufacturingYear: "",
      patrimonyNumber: "", isFixedInClassroom: false,
      classroomLocation: "", observations: "", provisioning_status: 'provisioned',
    });
  };

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.manufacturer || !formData.model || !formData.series) {
      toast({ title: "Erro de Validação", description: "Preencha os campos Fabricante, Modelo e Série.", variant: "destructive" });
      return;
    }
    
    const chromebookData = {
      model: formData.model, 
      serialNumber: formData.series,
      patrimonyNumber: formData.patrimonyNumber || null,
      manufacturer: formData.manufacturer,
      // manufacturingYear não é mapeado diretamente para o DB, mas pode ser incluído em 'condition' se necessário
      condition: formData.observations || 'novo', 
      location: formData.isFixedInClassroom ? formData.classroomLocation : null,
      status: formData.isFixedInClassroom ? 'fixo' as const : 'disponivel' as const,
      is_deprovisioned: formData.provisioning_status === 'deprovisioned',
    };
    
    const result = await createChromebook(chromebookData);
    
    if (result) {
      toast({ title: "Sucesso!", description: `Chromebook ${result.chromebook_id} cadastrado.` });
      resetForm();
      onRegistrationSuccess(result);
    }
    // O erro é tratado dentro do useDatabase
  };

  const isFormValid = formData.manufacturer && formData.model && formData.series;

  return (
    <GlassCard className="p-6 space-y-6">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Laptop className="h-6 w-6 text-green-600" />
          Novo Equipamento
        </CardTitle>
        <CardDescription>
          Preencha os detalhes para registrar um novo Chromebook no inventário.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seção 1: Identificação e Modelo */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
            <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              Identificação e Modelo
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante *</Label>
                <Select
                  value={formData.manufacturer}
                  onValueChange={(value) => handleFormChange('manufacturer', value)}
                  required
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione um fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acer">Acer</SelectItem>
                    <SelectItem value="Samsung">Samsung</SelectItem>
                    <SelectItem value="Lenovo">Lenovo</SelectItem>
                    <SelectItem value="Dell">Dell</SelectItem>
                    <SelectItem value="HP">HP</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="series" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Série *
                </Label>
                <Input 
                  id="series" 
                  value={formData.series} 
                  onChange={(e) => handleFormChange('series', e.target.value)} 
                  placeholder="Número de Série"
                  required 
                  className="bg-white"
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
                <Label htmlFor="manufacturingYear">Ano de Fabricação</Label>
                <Input 
                  id="manufacturingYear" 
                  value={formData.manufacturingYear} 
                  onChange={(e) => handleFormChange('manufacturingYear', e.target.value)} 
                  placeholder="Ex: 2022"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Localização e Provisionamento */}
          <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              Localização e Status
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isFixedInClassroom" 
                  checked={formData.isFixedInClassroom} 
                  onCheckedChange={(checked) => handleFormChange('isFixedInClassroom', !!checked)} 
                />
                <label htmlFor="isFixedInClassroom" className="text-sm font-medium cursor-pointer">
                  Equipamento Fixo em Sala de Aula (Status inicial: Fixo)
                </label>
              </div>
              
              {formData.isFixedInClassroom && (
                <div className="space-y-2 pl-6 border-l-2 border-purple-200">
                  <Label htmlFor="classroomLocation">Localização da Sala *</Label>
                  <Input 
                    id="classroomLocation" 
                    value={formData.classroomLocation} 
                    onChange={(e) => handleFormChange('classroomLocation', e.target.value)} 
                    placeholder="Ex: Sala 101"
                    required={formData.isFixedInClassroom} 
                    className="bg-white"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100">
              <Label>Status de Provisionamento</Label>
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
                  <Label htmlFor="deprovisioned">Desprovisionado (Inativo)</Label>
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