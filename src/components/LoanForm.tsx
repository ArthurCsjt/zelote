
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Computer, Plus, QrCode } from "lucide-react";
import { QRCodeReader } from "./QRCodeReader";

// Define a interface dos dados do formulário de empréstimo
interface LoanFormData {
  studentName: string;    // Nome do solicitante
  ra?: string;            // RA (Registro Acadêmico), opcional
  email: string;          // Email do solicitante
  chromebookId: string;   // ID do Chromebook
  purpose: string;        // Finalidade do empréstimo
  userType: 'aluno' | 'professor' | 'funcionario';  // Tipo de usuário
  loanType: 'individual' | 'lote';                 // Tipo de empréstimo
}

// Define a interface das props do componente
interface LoanFormProps {
  onSubmit: (data: LoanFormData) => void;  // Função chamada ao enviar o formulário
}

/**
 * Componente de formulário para realizar novos empréstimos de Chromebooks
 * Permite empréstimos individuais ou em lote para alunos, professores ou funcionários
 */
export function LoanForm({ onSubmit }: LoanFormProps) {
  // === ESTADOS (STATES) ===
  
  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState<LoanFormData>({
    studentName: "",
    ra: "",
    email: "",
    chromebookId: "",
    purpose: "",
    userType: 'aluno',
    loanType: 'individual'
  });

  // Lista de dispositivos para empréstimo em lote
  const [batchDevices, setBatchDevices] = useState<string[]>([]);
  
  // Valor atual do campo de entrada para adicionar dispositivos ao lote
  const [currentBatchInput, setCurrentBatchInput] = useState("");

  // Estado para controlar o diálogo de leitura de QR Code
  const [isQRReaderOpen, setIsQRReaderOpen] = useState(false);

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  /**
   * Adiciona um dispositivo à lista de lote
   * Verifica se o dispositivo já existe na lista antes de adicionar
   */
  const addDeviceToBatch = () => {
    if (currentBatchInput.trim() && !batchDevices.includes(currentBatchInput.trim())) {
      setBatchDevices([...batchDevices, currentBatchInput.trim()]);
      setCurrentBatchInput(""); // Limpa o campo após adicionar
    }
  };

  /**
   * Remove um dispositivo da lista de lote
   * @param deviceId - ID do dispositivo a ser removido
   */
  const removeDeviceFromBatch = (deviceId: string) => {
    setBatchDevices(batchDevices.filter(id => id !== deviceId));
  };

  /**
   * Processa os dados do QR Code lido
   * @param data - String contendo os dados do QR Code
   */
  const handleQRCodeScan = (data: string) => {
    try {
      // Tenta interpretar como JSON
      const jsonData = JSON.parse(data);
      
      if (jsonData.id) {
        if (formData.loanType === 'individual') {
          // Para empréstimo individual, atualiza o campo chromebookId
          setFormData(prev => ({ ...prev, chromebookId: jsonData.id }));
          toast({
            title: "QR Code lido com sucesso",
            description: `ID do Chromebook: ${jsonData.id}`,
          });
        } else {
          // Para empréstimo em lote, adiciona à lista se não existir
          if (!batchDevices.includes(jsonData.id)) {
            setBatchDevices(prev => [...prev, jsonData.id]);
            toast({
              title: "Dispositivo adicionado ao lote",
              description: `ID do Chromebook: ${jsonData.id}`,
            });
          } else {
            toast({
              title: "Dispositivo já adicionado",
              description: `O Chromebook ${jsonData.id} já está na lista`,
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      // Se não for JSON, usa diretamente como ID
      const id = data.trim();
      if (id) {
        if (formData.loanType === 'individual') {
          setFormData(prev => ({ ...prev, chromebookId: id }));
        } else if (!batchDevices.includes(id)) {
          setBatchDevices(prev => [...prev, id]);
        }
        
        toast({
          title: "QR Code lido",
          description: `ID extraído: ${id}`,
        });
      }
    }
  };

  /**
   * Função chamada ao enviar o formulário
   * Valida os dados e processa o empréstimo individual ou em lote
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();  // Previne o comportamento padrão do formulário
    
    if (formData.loanType === 'lote') {
      // === EMPRÉSTIMO EM LOTE ===
      
      // Verifica se há dispositivos na lista de lote
      if (batchDevices.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um dispositivo para empréstimo em lote",
          variant: "destructive",
        });
        return;
      }
      
      // Processa cada dispositivo individualmente
      let processedCount = 0;
      
      batchDevices.forEach(deviceId => {
        // Cria um objeto de empréstimo para cada dispositivo
        const loanData = {
          ...formData,
          chromebookId: deviceId
        };
        
        // Verifica campos obrigatórios
        if (!loanData.studentName || !loanData.email || !loanData.purpose) {
          toast({
            title: "Erro",
            description: "Por favor, preencha todos os campos obrigatórios",
            variant: "destructive",
          });
          return;
        }
        
        // Chama a função de callback para processar o empréstimo
        onSubmit(loanData);
        processedCount++;
      });
      
      // Se processou algum dispositivo, limpa o formulário e exibe mensagem de sucesso
      if (processedCount > 0) {
        // Limpa o formulário e a lista de dispositivos
        setBatchDevices([]);
        setCurrentBatchInput("");
        setFormData({ 
          studentName: "", 
          ra: "", 
          email: "", 
          chromebookId: "", 
          purpose: "", 
          userType: 'aluno',
          loanType: 'individual'
        });
        
        // Exibe mensagem de sucesso
        toast({
          title: "Sucesso",
          description: `${processedCount} Chromebooks emprestados com sucesso`,
        });
      }
      
    } else {
      // === EMPRÉSTIMO INDIVIDUAL ===
      
      // Verifica campos obrigatórios
      if (!formData.studentName || !formData.email || !formData.chromebookId || !formData.purpose) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
      
      // Chama a função de callback para processar o empréstimo
      onSubmit(formData);
      
      // Limpa o formulário
      setFormData({ 
        studentName: "", 
        ra: "", 
        email: "", 
        chromebookId: "", 
        purpose: "", 
        userType: 'aluno',
        loanType: 'individual'
      });
      
      // Exibe mensagem de sucesso
      toast({
        title: "Sucesso",
        description: "Chromebook emprestado com sucesso",
      });
    }
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Novo Empréstimo
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seletor de tipo de empréstimo (individual ou lote) */}
        <div className="space-y-2">
          <Label htmlFor="loanType" className="text-gray-700">
            Tipo de Empréstimo
          </Label>
          <Select
            value={formData.loanType}
            onValueChange={(value: 'individual' | 'lote') =>
              setFormData({ ...formData, loanType: value })
            }
          >
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder="Selecione o tipo de empréstimo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="lote">Em Lote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campos específicos para cada tipo de empréstimo */}
        {formData.loanType === 'individual' ? (
          /* Campo de ID para empréstimo individual */
          <div className="space-y-2">
            <Label htmlFor="chromebookId" className="text-gray-700">
              ID do Chromebook
            </Label>
            <div className="flex gap-2">
              <Input
                id="chromebookId"
                placeholder="Digite o ID do Chromebook"
                value={formData.chromebookId}
                onChange={(e) =>
                  setFormData({ ...formData, chromebookId: e.target.value })
                }
                className="border-gray-200 flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="border-gray-200 bg-white hover:bg-gray-50"
                onClick={() => setIsQRReaderOpen(true)}
              >
                <QrCode className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        ) : (
          /* Interface de empréstimo em lote */
          <div className="space-y-2">
            {/* Cabeçalho com contador de dispositivos */}
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="batchDevices" className="text-gray-700">
                Dispositivos em Lote
              </Label>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {batchDevices.length} dispositivos
              </Badge>
            </div>
            
            <div className="space-y-2">
              {/* Campo para adicionar dispositivos */}
              <div className="flex flex-col gap-2">
                <div className="relative w-full flex gap-2">
                  <Input
                    id="batchInput"
                    value={currentBatchInput}
                    onChange={(e) => setCurrentBatchInput(e.target.value)}
                    placeholder="Digite o ID do dispositivo"
                    className="border-gray-200 pr-16 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDeviceToBatch();
                      }
                    }}
                  />
                  {/* Botão flutuante para adicionar dispositivo */}
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={addDeviceToBatch}
                    className="absolute right-1 top-1 h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="text-xs">Adicionar</span>
                  </Button>
                  
                  {/* Botão de QR Code para modo lote */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-gray-200 bg-white hover:bg-gray-50 min-w-12"
                    onClick={() => setIsQRReaderOpen(true)}
                  >
                    <QrCode className="h-5 w-5 text-gray-600" />
                  </Button>
                </div>
              </div>
              
              {/* Lista de dispositivos adicionados ao lote */}
              <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200 max-h-[150px] overflow-y-auto">
                {batchDevices.length > 0 ? (
                  <div className="space-y-2">
                    {/* Lista de dispositivos */}
                    {batchDevices.map((device, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Computer className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{device}</span>
                        </div>
                        {/* Botão para remover dispositivo */}
                        <Button 
                          type="button"
                          variant="ghost"
                          onClick={() => removeDeviceFromBatch(device)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Mensagem quando nenhum dispositivo foi adicionado */
                  <div className="text-center text-gray-500 py-4">
                    <Computer className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum dispositivo adicionado</p>
                  </div>
                )}
              </div>
              
              {/* Resumo do empréstimo em lote (visível apenas se houver dispositivos) */}
              {batchDevices.length > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-700">Resumo do Empréstimo</h4>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Em Lote
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center bg-white p-3 rounded-md mb-2 border border-green-100">
                    <span className="text-2xl font-bold text-green-700 mr-2">{batchDevices.length}</span>
                    <span className="text-green-600">dispositivos para empréstimo</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seletor de tipo de usuário */}
        <div className="space-y-2">
          <Label htmlFor="userType" className="text-gray-700">
            Tipo de Solicitante
          </Label>
          <Select
            value={formData.userType}
            onValueChange={(value: 'aluno' | 'professor' | 'funcionario') =>
              setFormData({ ...formData, userType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de solicitante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aluno">Aluno</SelectItem>
              <SelectItem value="professor">Professor</SelectItem>
              <SelectItem value="funcionario">Funcionário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campo de nome do solicitante */}
        <div className="space-y-2">
          <Label htmlFor="studentName" className="text-gray-700">
            Nome do Solicitante
          </Label>
          <Input
            id="studentName"
            placeholder="Digite o nome do solicitante"
            value={formData.studentName}
            onChange={(e) =>
              setFormData({ ...formData, studentName: e.target.value })
            }
            className="border-gray-200"
          />
        </div>

        {/* Campo de RA (apenas para alunos) */}
        {formData.userType === 'aluno' && (
          <div className="space-y-2">
            <Label htmlFor="ra" className="text-gray-700">
              RA do Aluno (opcional)
            </Label>
            <Input
              id="ra"
              placeholder="Digite o RA"
              value={formData.ra}
              onChange={(e) => setFormData({ ...formData, ra: e.target.value })}
              className="border-gray-200"
            />
          </div>
        )}

        {/* Campo de email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Digite o email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="border-gray-200"
            required
          />
        </div>

        {/* Campo de finalidade do empréstimo */}
        <div className="space-y-2">
          <Label htmlFor="purpose" className="text-gray-700">
            Finalidade
          </Label>
          <Input
            id="purpose"
            placeholder="Ex: Aula de Matemática"
            value={formData.purpose}
            onChange={(e) =>
              setFormData({ ...formData, purpose: e.target.value })
            }
            className="border-gray-200"
          />
        </div>
        
        {/* Botão de envio do formulário */}
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {formData.loanType === 'lote' 
            ? `Emprestar ${batchDevices.length} Chromebooks` 
            : "Emprestar Chromebook"}
        </Button>
      </form>

      {/* Componente de leitura de QR Code */}
      <QRCodeReader
        open={isQRReaderOpen}
        onOpenChange={setIsQRReaderOpen}
        onScan={handleQRCodeScan}
      />
    </div>
  );
}
