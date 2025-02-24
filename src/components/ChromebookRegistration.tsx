
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/use-toast";
import { QRCodeSVG } from 'qrcode.react';

interface ChromebookData {
  id: string;
  manufacturer: string;
  model: string;
  series: string;
  manufacturingYear: string;
  patrimonyNumber: string;
  observations?: string;
}

export function ChromebookRegistration() {
  const [formData, setFormData] = useState<ChromebookData>({
    id: "",
    manufacturer: "",
    model: "",
    series: "",
    manufacturingYear: "",
    patrimonyNumber: "",
    observations: "",
  });
  const [showQRCode, setShowQRCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id || !formData.manufacturer || !formData.model || !formData.series || !formData.manufacturingYear || !formData.patrimonyNumber) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setShowQRCode(true);
    toast({
      title: "Sucesso",
      description: "Chromebook cadastrado com sucesso",
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Cadastro de Chromebook
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chromebookId">ID do Chromebook *</Label>
          <Input
            id="chromebookId"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="Digite o ID único do Chromebook"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Fabricante *</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            placeholder="Ex: Lenovo, HP, Dell"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Modelo *</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="Ex: Chromebook 14e"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="series">Série *</Label>
          <Input
            id="series"
            value={formData.series}
            onChange={(e) => setFormData({ ...formData, series: e.target.value })}
            placeholder="Digite o número de série"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturingYear">Ano de Fabricação *</Label>
          <Input
            id="manufacturingYear"
            value={formData.manufacturingYear}
            onChange={(e) => setFormData({ ...formData, manufacturingYear: e.target.value })}
            placeholder="Ex: 2023"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="patrimonyNumber">Patrimônio *</Label>
          <Input
            id="patrimonyNumber"
            value={formData.patrimonyNumber}
            onChange={(e) => setFormData({ ...formData, patrimonyNumber: e.target.value })}
            placeholder="Digite o número do patrimônio"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            placeholder="Digite observações relevantes sobre o equipamento"
            className="min-h-[100px]"
          />
        </div>

        <Button type="submit" className="w-full">
          Cadastrar Chromebook
        </Button>

        {showQRCode && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">QR Code do Equipamento</h3>
            <div className="flex justify-center">
              <QRCodeSVG 
                value={JSON.stringify(formData)}
                size={200}
                level="H"
              />
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">
              Salve este QR Code para identificar o equipamento
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
