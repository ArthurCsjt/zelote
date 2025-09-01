
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
  isFixedInClassroom: boolean; // Equipamento fixo em sala de aula
  classroomLocation?: string;  // Localização da sala de aula (opcional)
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
    isFixedInClassroom: false,
    classroomLocation: "",
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

    // Verifica se é equipamento fixo e se foi especificada a localização
    if (formData.isFixedInClassroom && !formData.classroomLocation?.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, especifique a localização da sala para equipamentos fixos",
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
    <div className="max-w-2xl mx-auto p-6 glass-morphism animate-fade-in relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-card/30 via-background/20 to-card/30 rounded-3xl blur-2xl transform scale-110" />
      
      
      {/* Formulário de cadastro */}
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {/* Campo: ID do Chromebook */}
        <div className="space-y-2">
          <Label htmlFor="chromebookId">ID do Chromebook *</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm pointer-events-none">
              CHR
            </div>
            <Input
              id="chromebookId"
              value={formData.id.replace(/^CHR/, '')}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setFormData({ ...formData, id: `CHR${value}` });
              }}
              placeholder="001"
              className="pl-12 font-mono"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Digite apenas o código após CHR (ex: 001, A01, etc.)
          </p>
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
          <p className="text-xs text-muted-foreground">Campo opcional</p>
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
          <p className="text-xs text-muted-foreground">Campo opcional</p>
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
            <p className="text-xs text-muted-foreground">
              Marque se o Chromebook já está provisionado no console de administração
            </p>
          </div>
        </div>

        {/* Campo: Equipamento Fixo em Sala de Aula */}
        <div className="flex items-start space-x-3 pt-2">
          <Checkbox 
            id="isFixedInClassroom"
            checked={formData.isFixedInClassroom}
            onCheckedChange={(checked) => 
              setFormData({ 
                ...formData, 
                isFixedInClassroom: checked === true
              })
            }
          />
          <div className="space-y-1 leading-none">
            <Label 
              htmlFor="isFixedInClassroom" 
              className="font-medium text-sm cursor-pointer"
            >
              Equipamento Fixo em Sala de Aula
            </Label>
            <p className="text-xs text-muted-foreground">
              Marque se o Chromebook é reservado para uso fixo em uma sala específica
            </p>
          </div>
        </div>

        {/* Campo: Localização da Sala (condicional) */}
        {formData.isFixedInClassroom && (
          <div className="space-y-2 ml-7">
            <Label htmlFor="classroomLocation">Localização da Sala *</Label>
            <Input
              id="classroomLocation"
              value={formData.classroomLocation}
              onChange={(e) => setFormData({ ...formData, classroomLocation: e.target.value })}
              placeholder="Ex: Sala 101, Laboratório de Informática A"
              required={formData.isFixedInClassroom}
            />
            <p className="text-xs text-muted-foreground">
              Especifique qual sala de aula onde o equipamento ficará fixo
            </p>
          </div>
        )}

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
          <p className="text-xs text-muted-foreground">Campo opcional</p>
        </div>

        {/* Botão de envio do formulário */}
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02]"
        >
          Cadastrar Chromebook
        </Button>

      </form>

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQRCode}
        onOpenChange={setShowQRCode}
        chromebookId={formData.id}
        chromebookData={{
          id: formData.id,
          chromebook_id: formData.id,
          model: formData.model,
          serial_number: formData.series,
          patrimony_number: formData.patrimonyNumber,
        }}
        showSuccess={true}
      />
    </div>
  );
}
