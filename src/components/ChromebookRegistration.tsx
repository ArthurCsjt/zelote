import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";
import { Laptop } from "lucide-react";
import { useDatabase } from '@/contexts/DatabaseContext';
import { Card, CardContent } from "./ui/card"; // Removido CardHeader, CardTitle
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
  series: string;
  manufacturingYear: string;
  patrimonyNumber: string;
  isFixedInClassroom: boolean;
  classroomLocation: string;
  observations: string;
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
      model: formData.model, serialNumber: formData.series,
      patrimonyNumber: formData.patrimonyNumber || null,
      manufacturer: formData.manufacturer,
      manufacturingYear: formData.manufacturingYear || null,
      observations: formData.observations || null,
      isProvisioned: formData.provisioning_status === 'provisioned',
      is_deprovisioned: formData.provisioning_status === 'deprovisioned',
      condition: 'novo' as const, location: formData.isFixedInClassroom ? formData.classroomLocation : null,
      status: 'disponivel' as const,
    };
    const result = await createChromebook(chromebookData);
    if (result.error) {
      toast({ title: "Erro no Banco de Dados", description: result.error.message, variant: "destructive" });
      return;
    }
    if (result.data) {
      toast({ title: "Sucesso!", description: `Chromebook ${result.data.chromebook_id} cadastrado.` });
      resetForm();
      onRegistrationSuccess(result.data);
    }
  };

  return (
    <GlassCard>
      {/* CardHeader removido */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante *</Label>
                <Select
                  value={formData.manufacturer}
                  onValueChange={(value) => handleFormChange('manufacturer', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acer">Acer</SelectItem>
                    <SelectItem value="Samsung">Samsung</SelectItem>
                    <SelectItem value="Lenovo">Lenovo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="model">Modelo *</Label><Input id="model" value={formData.model} onChange={(e) => handleFormChange('model', e.target.value)} required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="series">Série *</Label><Input id="series" value={formData.series} onChange={(e) => handleFormChange('series', e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="manufacturingYear">Ano de Fabricação</Label><Input id="manufacturingYear" value={formData.manufacturingYear} onChange={(e) => handleFormChange('manufacturingYear', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="patrimonyNumber">Patrimônio</Label><Input id="patrimonyNumber" value={formData.patrimonyNumber} onChange={(e) => handleFormChange('patrimonyNumber', e.target.value)} /></div>
            </div>
            <div className="space-y-4">
              <RadioGroup
                value={formData.provisioning_status}
                onValueChange={(value) => handleFormChange('provisioning_status', value)}
                className="space-y-2"
              >
                <Label>Status de Provisionamento</Label>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="provisioned" id="provisioned" />
                  <Label htmlFor="provisioned">Equipamento Provisionado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="deprovisioned" id="deprovisioned" />
                  <Label htmlFor="deprovisioned">Equipamento Desprovisionado</Label>
                </div>
              </RadioGroup>

              <div className="flex items-center space-x-2"><Checkbox id="isFixedInClassroom" checked={formData.isFixedInClassroom} onCheckedChange={(checked) => handleFormChange('isFixedInClassroom', !!checked)} /><label htmlFor="isFixedInClassroom" className="text-sm font-medium">Equipamento Fixo em Sala de Aula</label></div>
              {formData.isFixedInClassroom && (
                <div className="space-y-2"><Label htmlFor="classroomLocation">Localização da Sala *</Label><Input id="classroomLocation" value={formData.classroomLocation} onChange={(e) => handleFormChange('classroomLocation', e.target.value)} required={formData.isFixedInClassroom} /></div>
              )}
            </div>
            <div className="space-y-2"><Label htmlFor="observations">Observações</Label><Textarea id="observations" value={formData.observations} onChange={(e) => handleFormChange('observations', e.target.value)} /></div>
            <Button type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar Chromebook'}</Button>
        </form>
      </CardContent>
    </GlassCard>
  );
}