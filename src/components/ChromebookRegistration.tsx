import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea"; // Importando Textarea
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";
import { Laptop } from "lucide-react";
import { QRCodeModal } from "./QRCodeModal";
import { useDatabase } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Interface completa com todos os campos do formulário
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

export function ChromebookRegistration({ onRegistrationSuccess }: { onRegistrationSuccess?: () => void }) {
  const { createChromebook, loading } = useDatabase();
  const { toast } = useToast();
  
  // Estado inicial com todos os campos
  const [formData, setFormData] = useState<FormData>({
    manufacturer: "",
    model: "",
    series: "",
    manufacturingYear: new Date().getFullYear().toString(), // Padrão para o ano atual
    patrimonyNumber: "",
    isProvisioned: false,
    isFixedInClassroom: false,
    classroomLocation: "",
    observations: "",
  });
  
  const [showQRCode, setShowQRCode] = useState(false);
  const [newChromebookData, setNewChromebookData] = useState<any>(null);

  const resetForm = () => {
    setFormData({
      manufacturer: "",
      model: "",
      series: "",
      manufacturingYear: new Date().getFullYear().toString(),
      patrimonyNumber: "",
      isProvisioned: false,
      isFixedInClassroom: false,
      classroomLocation: "",
      observations: "",
    });
  };

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.manufacturer || !formData.model || !formData.series) {
      toast({
        title: "Erro de Validação",
        description: "Preencha os campos Fabricante, Modelo e Série.",
        variant: "destructive",
      });
      return;
    }

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
      status: 'disponivel' as const
    };

    const { data: createdChromebook, error } = await createChromebook(chromebookData);

    if (error) {
      toast({ title: "Erro no Banco de Dados", description: error.message, variant: "destructive" });
      return;
    }

    if (createdChromebook) {
      toast({ title: "Sucesso!", description: `Chromebook ${createdChromebook.chromebookId} cadastrado.` });
      setNewChromebookData(createdChromebook);
      setShowQRCode(true);
      resetForm();
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Laptop className="h-6 w-6 text-primary" />
            <CardTitle>Cadastro de Chromebook</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Linha 1: Fabricante e Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante *</Label>
                <Input id="manufacturer" value={formData.manufacturer} onChange={(e) => handleFormChange('manufacturer', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input id="model" value={formData.model} onChange={(e) => handleFormChange('model', e.target.value)} required />
              </div>
            </div>
            
            {/* Linha 2: Série e Ano de Fabricação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="series">Série *</Label>
                <Input id="series" value={formData.series} onChange={(e) => handleFormChange('series', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturingYear">Ano de Fabricação</Label>
                <Input id="manufacturingYear" value={formData.manufacturingYear} onChange={(e) => handleFormChange('manufacturingYear', e.target.value)} />
              </div>
            </div>

            {/* Linha 3: Patrimônio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patrimonyNumber">Patrimônio</Label>
                <Input id="patrimonyNumber" value={formData.patrimonyNumber} onChange={(e) => handleFormChange('patrimonyNumber', e.target.value)} />
              </div>
            </div>
            
            {/* Linha 4: Checkboxes e Localização */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="isProvisioned" checked={formData.isProvisioned} onCheckedChange={(checked) => handleFormChange('isProvisioned', !!checked)} />
                <label htmlFor="isProvisioned" className="text-sm font-medium">Equipamento Provisionado</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isFixedInClassroom" checked={formData.isFixedInClassroom} onCheckedChange={(checked) => handleFormChange('isFixedInClassroom', !!checked)} />
                <label htmlFor="isFixedInClassroom" className="text-sm font-medium">Equipamento Fixo em Sala de Aula</label>
              </div>
              {formData.isFixedInClassroom && (
                <div className="space-y-2">
                  <Label htmlFor="classroomLocation">Localização da Sala *</Label>
                  <Input id="classroomLocation" value={formData.classroomLocation} onChange={(e) => handleFormChange('classroomLocation', e.target.value)} required={formData.isFixedInClassroom} />
                </div>
              )}
            </div>
            
            {/* Linha 5: Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea id="observations" value={formData.observations} onChange={(e) => handleFormChange('observations', e.target.value)} />
            </div>

            <Button type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar Chromebook'}</Button>
          </form>
        </CardContent>
      </Card>

      <QRCodeModal isOpen={showQRCode} onClose={() => setShowQRCode(false)} chromebookId={newChromebookData?.chromebookId} />
    </div>
  );
}