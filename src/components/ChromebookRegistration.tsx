
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/use-toast";

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

    // TODO: Implement save functionality
    toast({
      title: "Sucesso",
      description: "Chromebook cadastrado com sucesso",
    });

    // Clear form
    setFormData({
      id: "",
      manufacturer: "",
      model: "",
      series: "",
      manufacturingYear: "",
      patrimonyNumber: "",
      observations: "",
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Cadastro de Chromebook
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID do Chromebook - Primeiro campo pois é o identificador principal */}
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

        {/* Fabricante - Informação básica do equipamento */}
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

        {/* Modelo - Complementa a informação do fabricante */}
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

        {/* Série - Número de série do equipamento */}
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

        {/* Ano de Fabricação */}
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

        {/* Patrimônio - Número de controle interno */}
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

        {/* Observações - Campo opcional para informações adicionais */}
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
      </form>
    </div>
  );
}
