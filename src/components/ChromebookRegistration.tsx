
import { useState } from "react"; // Hook do React para gerenciar estado
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/use-toast";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { QRCodeModal } from "./QRCodeModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

/**
 * Interface que define a estrutura dos dados do Chromebook
 * Contém todos os campos necessários para o cadastro de um dispositivo
 */
interface ChromebookData {
  id: string;              // Identificador único do Chromebook
  manufacturer: string;    // Fabricante (ex: Lenovo, HP, Dell)
  model: string;           // Modelo do dispositivo
  series: string;          // Número de série do fabricante
  manufacturingYear?: string; // Ano de fabricação do dispositivo (opcional)
  patrimonyNumber?: string;   // Número de patrimônio da instituição (opcional)
  observations?: string;     // Observações adicionais (opcional)
  isProvisioned: boolean;    // Status de provisionamento do dispositivo
}

// Adicionar prop onBack para o componente
interface ChromebookRegistrationProps {
  onBack?: () => void;
}


/**
 * Componente para cadastro e registro de Chromebooks
 * Permite criar QR Codes e gerar PDFs para identificação dos dispositivos
 */
export function ChromebookRegistration({ onBack }: ChromebookRegistrationProps) {
  // === ESTADOS (STATES) ===
  
  /**
   * Estado para armazenar os dados do formulário de cadastro
   * Inicializado com valores vazios
   */
  const [formData, setFormData] = useState<ChromebookData>({
    id: "",
    manufacturer: "",
    model: "",
    series: "",
    manufacturingYear: "",
    patrimonyNumber: "",
    observations: "",
    isProvisioned: false,
  });

  /**
   * Estado para controlar a exibição do QR Code
   * Só será exibido após o cadastro bem-sucedido
   */
  const [showQRCode, setShowQRCode] = useState(false);

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  /**
   * Função para lidar com o clique no botão voltar - NOVA
   */
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  /**
   * Função chamada quando o formulário é enviado
   * Valida os dados e gera o QR Code
   * @param e - Evento do formulário
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário (recarregar a página)

    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!formData.id || !formData.manufacturer || !formData.model || !formData.series) {
      // Exibe mensagem de erro se algum campo obrigatório estiver vazio
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Salvar o Chromebook no localStorage
    try {
      // Obter Chromebooks existentes
      const existingChromebooksJSON = localStorage.getItem("chromebooks");
      const existingChromebooks: ChromebookData[] = existingChromebooksJSON 
        ? JSON.parse(existingChromebooksJSON) 
        : [];
      
      // Verificar se já existe um Chromebook com o mesmo ID
      if (existingChromebooks.some(device => device.id === formData.id)) {
        toast({
          title: "ID Duplicado",
          description: "Já existe um Chromebook cadastrado com este ID",
          variant: "destructive",
        });
        return;
      }
      
      // Adicionar o novo Chromebook
      const updatedChromebooks = [...existingChromebooks, formData];
      localStorage.setItem("chromebooks", JSON.stringify(updatedChromebooks));
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error);
    }

    // Se tudo estiver ok, mostra o QR Code e exibe mensagem de sucesso
    setShowQRCode(true);
    toast({
      title: "Sucesso",
      description: "Chromebook cadastrado com sucesso",
    });
  };


  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Cadastro de Chromebook
        </h2>
        
        {/* Botão voltar - NOVO */}
        <Button 
          variant="back"
          size="default"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Menu</span>
        </Button>
      </div>
      
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

        {/* Campo: Ano de Fabricação (Opcional) */}
        <div className="space-y-2">
          <Label htmlFor="manufacturingYear">Ano de Fabricação</Label>
          <Input
            id="manufacturingYear"
            value={formData.manufacturingYear}
            onChange={(e) => setFormData({ ...formData, manufacturingYear: e.target.value })}
            placeholder="Ex: 2023"
          />
          <p className="text-xs text-gray-500">Campo opcional</p>
        </div>

        {/* Campo: Número do Patrimônio (Opcional) */}
        <div className="space-y-2">
          <Label htmlFor="patrimonyNumber">Patrimônio</Label>
          <Input
            id="patrimonyNumber"
            value={formData.patrimonyNumber}
            onChange={(e) => setFormData({ ...formData, patrimonyNumber: e.target.value })}
            placeholder="Digite o número do patrimônio"
          />
          <p className="text-xs text-gray-500">Campo opcional</p>
        </div>

        {/* Campo: Status de Provisionamento */}
        <div className="flex items-start space-x-3 pt-2">
          <Checkbox 
            id="isProvisioned"
            checked={formData.isProvisioned}
            onCheckedChange={(checked) => 
              setFormData({ 
                ...formData, 
                isProvisioned: checked === true
              })
            }
          />
          <div className="space-y-1 leading-none">
            <Label 
              htmlFor="isProvisioned" 
              className="font-medium text-sm cursor-pointer"
            >
              Equipamento Provisionado
            </Label>
            <p className="text-xs text-gray-500">
              Marque se o Chromebook já está provisionado no console de administração
            </p>
          </div>
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
          <p className="text-xs text-gray-500">Campo opcional</p>
        </div>

        {/* Botão de envio do formulário */}
        <Button type="submit" className="w-full">
          Cadastrar Chromebook
        </Button>

      </form>

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQRCode}
        onOpenChange={setShowQRCode}
        chromebookId={formData.id}
        chromebookData={formData}
        showSuccess={true}
      />
    </div>
  );
}
