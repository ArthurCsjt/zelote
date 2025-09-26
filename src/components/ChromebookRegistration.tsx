import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";
import { Laptop } from "lucide-react";
import { useDatabase } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Interface para o estado do formulário, sem o campo de ID
interface FormData {
  manufacturer: string;
  model: string;
  series: string;
  manufacturingYear: string;
  patrimonyNumber: string;
  isProvisioned: boolean;
  isFixedInClassroom: boolean;
  classroomLocation: string;
  observations: string;
}

// O componente agora recebe a instrução onRegistrationSuccess
export function ChromebookRegistration({ onRegistrationSuccess }: { onRegistrationSuccess: (newChromebook: any) => void }) {
  const { createChromebook, loading } = useDatabase();
  const [formData, setFormData] = useState<FormData>({
    manufacturer: "", model: "", series: "",
    manufacturingYear: new Date().getFullYear().toString(),
    patrimonyNumber: "", observations: "", isProvisioned: false,
    isFixedInClassroom: false, classroomLocation: ""
  });

  const resetForm = () => { /* Sua função de reset original */ };
  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.manufacturer || !formData.model || !formData.series) {
      toast({ title: "Erro de Validação", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }
    
    // Prepara os dados para o banco de dados (sem o ID manual)
    const chromebookData = {
      model: formData.model,
      serialNumber: formData.series,
      patrimonyNumber: formData.patrimonyNumber || null,
      manufacturer: formData.manufacturer,
      manufacturingYear: formData.manufacturingYear || null,
      observations: formData.observations || null,
      isProvisioned: formData.isProvisioned,
      condition: 'novo' as const,
      location: formData.isFixedInClassroom ? formData.classroomLocation : null,
      status: formData.isFixedInClassroom ? 'fixo' : 'disponivel' as const
    };

    const { data: createdChromebook, error } = await createChromebook(chromebookData);

    if (error) {
      toast({ title: "Erro no Banco de Dados", description: error.message, variant: "destructive" });
      return;
    }

    if (createdChromebook) {
      toast({ title: "Sucesso!", description: `Chromebook ${createdChromebook.chromebook_id} cadastrado.` });
      resetForm();
      // AVISA O "CHEFE" (INDEX.TSX) QUE O CADASTRO FOI UM SUCESSO
      onRegistrationSuccess(createdChromebook);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3"><Laptop /><CardTitle>Cadastro de Chromebook</CardTitle></div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="manufacturer">Fabricante *</Label><Input id="manufacturer" value={formData.manufacturer} onChange={(e) => handleFormChange('manufacturer', e.target.value)} required /></div>
              <div><Label htmlFor="model">Modelo *</Label><Input id="model" value={formData.model} onChange={(e) => handleFormChange('model', e.target.value)} required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="series">Série *</Label><Input id="series" value={formData.series} onChange={(e) => handleFormChange('series', e.target.value)} required /></div>
              <div><Label htmlFor="manufacturingYear">Ano de Fabricação</Label><Input id="manufacturingYear" value={formData.manufacturingYear} onChange={(e) => handleFormChange('manufacturingYear', e.target.value)} /></div>
            </div>
            <div><Label htmlFor="patrimonyNumber">Patrimônio</Label><Input id="patrimonyNumber" value={formData.patrimonyNumber} onChange={(e) => handleFormChange('patrimonyNumber', e.target.value)} /></div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2"><Checkbox id="isProvisioned" checked={formData.isProvisioned} onCheckedChange={(checked) => handleFormChange('isProvisioned', !!checked)} /><label htmlFor="isProvisioned">Equipamento Provisionado</label></div>
              <div className="flex items-center space-x-2"><Checkbox id="isFixedInClassroom" checked={formData.isFixedInClassroom} onCheckedChange={(checked) => handleFormChange('isFixedInClassroom', !!checked)} /><label htmlFor="isFixedInClassroom">Equipamento Fixo em Sala de Aula</label></div>
              {formData.isFixedInClassroom && (
                <div><Label htmlFor="classroomLocation">Localização da Sala *</Label><Input id="classroomLocation" value={formData.classroomLocation} onChange={(e) => handleFormChange('classroomLocation', e.target.value)} required={formData.isFixedInClassroom} /></div>
              )}
            </div>
            <div><Label htmlFor="observations">Observações</Label><Textarea id="observations" value={formData.observations} onChange={(e) => handleFormChange('observations', e.target.value)} /></div>
            <div className="flex justify-end pt-4"><Button type="submit" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar Chromebook"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}