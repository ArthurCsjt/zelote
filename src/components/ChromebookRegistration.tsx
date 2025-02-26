import { useState } from "react"; // Hook do React para gerenciar estado
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/use-toast";
import { QRCodeSVG } from 'qrcode.react'; // Biblioteca para gerar QR Codes
import { jsPDF } from 'jspdf'; // Biblioteca para gerar PDFs
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Interface que define a estrutura dos dados do Chromebook
interface ChromebookData {
  id: string;              // Identificador único
  manufacturer: string;    // Fabricante
  model: string;          // Modelo
  series: string;         // Número de série
  manufacturingYear: string; // Ano de fabricação
  patrimonyNumber: string;   // Número do patrimônio
  observations?: string;     // Observações (opcional)
}

// Tipos possíveis de tamanho para o QR Code
type QRSize = "small" | "medium" | "large";

// Configurações de tamanho do QR Code com suas respectivas medidas
const QR_SIZES = {
  small: { size: 128, label: "Pequeno (3cm)" },
  medium: { size: 200, label: "Médio (5cm) - Recomendado" },
  large: { size: 300, label: "Grande (7cm)" },
};

export function ChromebookRegistration() {
  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState<ChromebookData>({
    id: "",
    manufacturer: "",
    model: "",
    series: "",
    manufacturingYear: "",
    patrimonyNumber: "",
    observations: "",
  });

  // Estados para controlar a exibição do QR Code e seu tamanho
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrSize, setQRSize] = useState<QRSize>("medium");

  // Função chamada quando o formulário é enviado
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário

    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!formData.id || !formData.manufacturer || !formData.model || !formData.series || !formData.manufacturingYear || !formData.patrimonyNumber) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Se tudo estiver ok, mostra o QR Code e exibe mensagem de sucesso
    setShowQRCode(true);
    toast({
      title: "Sucesso",
      description: "Chromebook cadastrado com sucesso",
    });
  };

  // Função para gerar e baixar o PDF com o QR Code
  const handleDownloadPDF = () => {
    // Obtém o elemento SVG do QR Code
    const svgElement = document.getElementById("qr-code-svg") as SVGElement;
    if (!svgElement) return;

    try {
      // Cria um canvas temporário
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Cria uma imagem a partir do SVG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      
      img.onload = () => {
        // Configura o tamanho do canvas
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Desenha a imagem no canvas
        ctx.drawImage(img, 0, 0);
        
        // Cria o PDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Obtém as dimensões da página
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Converte o canvas para imagem
        const imgData = canvas.toDataURL("image/png");
        
        // Define o tamanho do QR Code no PDF (50mm = 5cm)
        const qrSize = 50;
        const x = (pageWidth - qrSize) / 2;
        const y = 20;

        // Adiciona o QR Code ao PDF
        pdf.addImage(imgData, "PNG", x, y, qrSize, qrSize);

        // Adiciona o ID do Chromebook abaixo do QR Code
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        const text = `ID: ${formData.id}`;
        const textWidth = pdf.getTextWidth(text);
        pdf.text(text, (pageWidth - textWidth) / 2, y + qrSize + 10);

        // Adiciona informações adicionais
        pdf.setFontSize(10);
        const infoY = y + qrSize + 20;
        pdf.text(`Modelo: ${formData.model}`, 20, infoY);
        pdf.text(`Patrimônio: ${formData.patrimonyNumber}`, 20, infoY + 7);

        // Salva o PDF
        pdf.save(`qrcode-chromebook-${formData.id}.pdf`);

        toast({
          title: "Sucesso",
          description: "PDF gerado com sucesso!",
        });
      };

      // Configura a fonte da imagem como o SVG
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o PDF",
        variant: "destructive",
      });
    }
  };

  // Renderização do componente
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Cadastro de Chromebook
      </h2>
      {/* Formulário de cadastro */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo: ID do Chromebook */}
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

        {/* Campo: Fabricante */}
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

        {/* Campo: Modelo */}
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

        {/* Campo: Série */}
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

        {/* Campo: Ano de Fabricação */}
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

        {/* Campo: Número do Patrimônio */}
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

        {/* Campo: Observações (opcional) */}
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

        {/* Botão de envio do formulário */}
        <Button type="submit" className="w-full">
          Cadastrar Chromebook
        </Button>

        {/* Seção do QR Code (aparece após o cadastro) */}
        {showQRCode && (
          <div className="mt-6 p-6 border border-gray-200 rounded-lg space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">QR Code do Equipamento</h3>
              
              {/* Seletor de tamanho do QR Code */}
              <div className="space-y-2">
                <Label htmlFor="qrSize">Tamanho do QR Code</Label>
                <Select
                  value={qrSize}
                  onValueChange={(value: QRSize) => setQRSize(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QR_SIZES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exibição do QR Code */}
            <div className="flex flex-col items-center gap-4 p-4 bg-white">
              <div className="relative">
                <QRCodeSVG 
                  id="qr-code-svg"
                  value={JSON.stringify(formData)}
                  size={QR_SIZES[qrSize].size}
                  level="H"
                  includeMargin
                />
                <div className="mt-2 text-center text-sm font-medium text-gray-600">
                  ID: {formData.id}
                </div>
              </div>
            </div>

            {/* Botão para baixar o PDF */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700"
              >
                Baixar QR Code (PDF)
              </Button>
            </div>

            {/* Texto explicativo sobre os tamanhos */}
            <p className="text-sm text-gray-500 text-center">
              O tamanho médio é recomendado para a maioria dos casos de uso.
              Escolha o tamanho grande para melhor visibilidade em distância ou o pequeno para economizar espaço.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
