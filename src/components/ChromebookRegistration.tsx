import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "@/hooks/use-toast";
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
export function ChromebookRegistration() {
  const {
    createChromebook,
    loading
  } = useDatabase();
  const [formData, setFormData] = useState<ChromebookData>({
    id: "",
    manufacturer: "",
    model: "",
    series: "",
    manufacturingYear: "",
    patrimonyNumber: "",
    observations: "",
    isProvisioned: false,
    isFixedInClassroom: false,
    classroomLocation: ""
  });
  const [showQRCode, setShowQRCode] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.manufacturer || !formData.model || !formData.series) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    if (formData.isFixedInClassroom && !formData.classroomLocation?.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, especifique a localização da sala para equipamentos fixos",
        variant: "destructive"
      });
      return;
    }
    const chromebookData = {
      chromebookId: formData.id,
      model: formData.model,
      serialNumber: formData.series,
      patrimonyNumber: formData.patrimonyNumber || null,
      condition: 'novo',
      location: formData.isFixedInClassroom ? formData.classroomLocation : null,
      status: 'disponivel' as const
    };
    const newChromebook = await createChromebook(chromebookData);
    if (newChromebook) {
      setShowQRCode(true);
      toast({
        title: "Sucesso",
        description: "Chromebook cadastrado com sucesso"
      });
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Laptop className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold">Cadastro de Chromebooks</h2>
      </div>

      <Card>
        <CardHeader>
          
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo: ID do Chromebook */}
              <div className="space-y-2">
                <Label htmlFor="chromebookId">ID do Chromebook *</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm pointer-events-none">
                    CHR
                  </div>
                  <Input id="chromebookId" value={formData.id.replace(/^CHR/, '')} onChange={e => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setFormData({
                    ...formData,
                    id: `CHR${value}`
                  });
                }} placeholder="001" className="pl-12 font-mono" required />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite apenas o código após CHR (ex: 001, A01, etc.)
                </p>
              </div>

              {/* Campo: Fabricante */}
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante *</Label>
                <Input id="manufacturer" value={formData.manufacturer} onChange={e => setFormData({
                ...formData,
                manufacturer: e.target.value
              })} placeholder="Ex: Lenovo, HP, Dell" required />
              </div>

              {/* Campo: Modelo */}
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input id="model" value={formData.model} onChange={e => setFormData({
                ...formData,
                model: e.target.value
              })} placeholder="Ex: Chromebook 14e" required />
              </div>

              {/* Campo: Série */}
              <div className="space-y-2">
                <Label htmlFor="series">Série *</Label>
                <Input id="series" value={formData.series} onChange={e => setFormData({
                ...formData,
                series: e.target.value
              })} placeholder="Digite o número de série" required />
              </div>

              {/* Campo: Ano de Fabricação */}
              <div className="space-y-2">
                <Label htmlFor="manufacturingYear">Ano de Fabricação</Label>
                <Input id="manufacturingYear" value={formData.manufacturingYear} onChange={e => setFormData({
                ...formData,
                manufacturingYear: e.target.value
              })} placeholder="Ex: 2023" />
              </div>

              {/* Campo: Número do Patrimônio */}
              <div className="space-y-2">
                <Label htmlFor="patrimonyNumber">Patrimônio</Label>
                <Input id="patrimonyNumber" value={formData.patrimonyNumber} onChange={e => setFormData({
                ...formData,
                patrimonyNumber: e.target.value
              })} placeholder="Digite o número do patrimônio" />
              </div>
            </div>

            {/* Campo: Status de Provisionamento */}
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox id="isProvisioned" checked={formData.isProvisioned} onCheckedChange={checked => setFormData({
              ...formData,
              isProvisioned: checked === true
            })} />
              <div className="space-y-1 leading-none">
                <Label htmlFor="isProvisioned" className="font-medium text-sm cursor-pointer">
                  Equipamento Provisionado
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marque se o Chromebook já está provisionado no console de administração
                </p>
              </div>
            </div>

            {/* Campo: Equipamento Fixo em Sala de Aula */}
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox id="isFixedInClassroom" checked={formData.isFixedInClassroom} onCheckedChange={checked => setFormData({
              ...formData,
              isFixedInClassroom: checked === true
            })} />
              <div className="space-y-1 leading-none">
                <Label htmlFor="isFixedInClassroom" className="font-medium text-sm cursor-pointer">
                  Equipamento Fixo em Sala de Aula
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marque se o Chromebook é reservado para uso fixo em uma sala específica
                </p>
              </div>
            </div>

            {/* Campo: Localização da Sala (condicional) */}
            {formData.isFixedInClassroom && <div className="space-y-2 ml-7">
                <Label htmlFor="classroomLocation">Localização da Sala *</Label>
                <Input id="classroomLocation" value={formData.classroomLocation} onChange={e => setFormData({
              ...formData,
              classroomLocation: e.target.value
            })} placeholder="Ex: Sala 101, Laboratório de Informática A" required={formData.isFixedInClassroom} />
              </div>}

            {/* Campo: Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea id="observations" value={formData.observations} onChange={e => setFormData({
              ...formData,
              observations: e.target.value
            })} placeholder="Digite observações relevantes sobre o equipamento" className="min-h-[100px]" />
            </div>

            {/* Botão de envio */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="min-w-32">
                {loading ? "Cadastrando..." : "Cadastrar Chromebook"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <QRCodeModal open={showQRCode} onOpenChange={setShowQRCode} chromebookId={formData.id} chromebookData={{
      id: formData.id,
      chromebook_id: formData.id,
      model: formData.model,
      serial_number: formData.series,
      patrimony_number: formData.patrimonyNumber
    }} showSuccess={true} />
    </div>;
}