import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";
import { Laptop } from "lucide-react";
import { QRCodeModal } from "./QRCodeModal";
import { useDatabase } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ChromebookData {
  id: string;
  manufacturer: string;
  model: string;
  series: string;
  manufacturingYear?: string;
  patrimonyNumber?: string;
  observations?: string;
  isProvisioned: boolean;
  isFixedInClassroom: boolean;
  classroomLocation?: string;
}

export function ChromebookRegistration({ onRegistrationSuccess }: { onRegistrationSuccess?: () => void }) {
  const { createChromebook, loading } = useDatabase();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ChromebookData>({
    id: "",
    manufacturer: "",
    model: "",
    series: "",
    patrimonyNumber: "",
    isProvisioned: false,
    isFixedInClassroom: false,
    classroomLocation: ""
  });
  
  const [showQRCode, setShowQRCode] = useState(false);
  const [newChromebookData, setNewChromebookData] = useState<any>(null);

  const resetForm = () => {
    setFormData({
      id: "",
      manufacturer: "",
      model: "",
      series: "",
      patrimonyNumber: "",
      isProvisioned: false,
      isFixedInClassroom: false,
      classroomLocation: ""
    });
  };

  const handleFormChange = (field: keyof ChromebookData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.manufacturer || !formData.model || !formData.series) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha os campos Fabricante, Modelo e Série.",
        variant: "destructive",
      });
      return;
    }

    if (formData.isFixedInClassroom && !formData.classroomLocation?.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Para equipamentos fixos, a localização da sala é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    const chromebookData = {
      model: formData.model,
      serialNumber: formData.series,
      patrimonyNumber: formData.patrimonyNumber || null,
      manufacturer: formData.manufacturer,
      condition: 'novo' as const,
      location: formData.isFixedInClassroom ? formData.classroomLocation : null,
      status: 'disponivel' as const
    };

    const { data: createdChromebook, error } = await createChromebook(chromebookData);

    if (error) {
      toast({
        title: "Erro no Banco de Dados",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (createdChromebook) {
      toast({
        title: "Sucesso!",
        description: `Chromebook ${createdChromebook.chromebookId} cadastrado.`,
      });
      
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo: Fabricante */}
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante *</Label>
                <Input id="manufacturer" value={formData.manufacturer} onChange={(e) => handleFormChange('manufacturer', e.target.value)} placeholder="Ex: Lenovo, HP, Dell" required />
              </div>

              {/* Campo: Modelo */}
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input id="model" value={formData.model} onChange={(e) => handleFormChange('model', e.target.value)} placeholder="Ex: Chromebook 14e" required />
              </div>

              {/* Campo: Série */}
              <div className="space-y-2">
                <Label htmlFor="series">Série *</Label>
                <Input id="series" value={formData.series} onChange={(e) => handleFormChange('series', e.target.value)} placeholder="Digite o número de série" required />
              </div>

              {/* Campo: Patrimônio */}
              <div className="space-y-2">
                <Label htmlFor="patrimonyNumber">Patrimônio</Label>
                <Input id="patrimonyNumber" value={formData.patrimonyNumber} onChange={(e) => handleFormChange('patrimonyNumber', e.target.value)} placeholder="Digite o número do patrimônio" />
              </div>
            </div>

            {/* Checkboxes e Localização */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="isFixedInClassroom" checked={formData.isFixedInClassroom} onCheckedChange={(checked) => handleFormChange('isFixedInClassroom', !!checked)} />
                <label htmlFor="isFixedInClassroom" className="text-sm font-medium leading-none">Equipamento fixo em sala de aula</label>
              </div>
              {formData.isFixedInClassroom && (
                <div className="space-y-2">
                  <Label htmlFor="classroomLocation">Localização da Sala *</Label>
                  <Input id="classroomLocation" value={formData.classroomLocation} onChange={(e) => handleFormChange('classroomLocation', e.target.value)} placeholder="Ex: Sala 21, Laboratório de Robótica" />
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar Chromebook'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        chromebookId={newChromebookData?.chromebookId}
      />
    </div>
  );
}