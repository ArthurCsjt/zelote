import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Computer, Plus, QrCode, Calendar, Clock } from "lucide-react";
import { QRCodeReader } from "./QRCodeReader";
import { format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { validateLoanFormData, sanitizeQRCodeData } from "@/utils/security";

// Define a interface dos dados do formulário de empréstimo
interface LoanFormData {
  studentName: string;    // Nome do solicitante
  ra?: string;            // RA (Registro Acadêmico), opcional
  email: string;          // Email do solicitante
  chromebookId: string;   // ID do Chromebook
  purpose: string;        // Finalidade do empréstimo
  userType: 'aluno' | 'professor' | 'funcionario';  // Tipo de usuário
  loanType: 'individual' | 'lote';                 // Tipo de empréstimo
  expectedReturnDate?: Date;  // Data e hora de devolução esperada
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

  // Estado para controlar se deve definir prazo de devolução
  const [hasReturnDeadline, setHasReturnDeadline] = useState(false);
  
  // Estado para o seletor de data
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
    const sanitizedId = sanitizeQRCodeData(data);
    
    if (sanitizedId) {
      if (formData.loanType === 'individual') {
        setFormData(prev => ({ ...prev, chromebookId: sanitizedId }));
        toast({
          title: "QR Code lido com sucesso",
          description: `ID do Chromebook: ${sanitizedId}`,
        });
      } else {
        if (!batchDevices.includes(sanitizedId)) {
          setBatchDevices(prev => [...prev, sanitizedId]);
          toast({
            title: "Dispositivo adicionado ao lote",
            description: `ID do Chromebook: ${sanitizedId}`,
          });
        } else {
          toast({
            title: "Dispositivo já adicionado",
            description: `O Chromebook ${sanitizedId} já está na lista`,
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar e sanitizar dados do formulário
    const validation = validateLoanFormData(formData);
    if (!validation.isValid) {
      toast({
        title: "Erro de Validação",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }
    
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
        setHasReturnDeadline(false);
        
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
      setHasReturnDeadline(false);
      
      // Exibe mensagem de sucesso
      toast({
        title: "Sucesso",
        description: "Chromebook emprestado com sucesso",
      });
    }
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <div className="glass-morphism p-6 animate-fade-in relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 relative z-10">
        Novo Empréstimo
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
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
            
            <div className="space-y-3">
              {/* Campo para adicionar dispositivos */}
              <div className="space-y-2">
                {/* Input para ID do dispositivo */}
                <div className="w-full">
                  <Input
                    id="batchInput"
                    value={currentBatchInput}
                    onChange={(e) => setCurrentBatchInput(e.target.value)}
                    placeholder="Digite o ID do dispositivo"
                    className="border-gray-200 w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDeviceToBatch();
                      }
                    }}
                  />
                </div>
                
                {/* Botões para adicionar e QR Code */}
                <div className="flex gap-2 w-full">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={addDeviceToBatch}
                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                  
                  {/* Botão de QR Code para modo lote */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-gray-200 bg-white hover:bg-gray-50 px-3"
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

        {/* Opção para definir prazo de devolução */}
        <div className="space-y-4 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="returnDeadline"
              checked={hasReturnDeadline}
              onCheckedChange={(checked) => {
                setHasReturnDeadline(checked as boolean);
                if (!checked) {
                  setFormData({ ...formData, expectedReturnDate: undefined });
                }
              }}
              className="border-gray-300"
            />
            <Label htmlFor="returnDeadline" className="text-gray-700 font-medium cursor-pointer">
              Definir prazo de devolução
            </Label>
          </div>

          {hasReturnDeadline && (
            <div className="space-y-3 pl-6 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm font-medium">
                  Data e Hora de Devolução
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Seletor de Data */}
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal border-gray-200",
                          !formData.expectedReturnDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.expectedReturnDate ? (
                          format(formData.expectedReturnDate, "dd/MM/yyyy")
                        ) : (
                          <span>Selecionar data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.expectedReturnDate}
                        onSelect={(date) => {
                          if (date) {
                            const currentTime = formData.expectedReturnDate || new Date();
                            const newDateTime = new Date(date);
                            newDateTime.setHours(currentTime.getHours());
                            newDateTime.setMinutes(currentTime.getMinutes());
                            setFormData({ ...formData, expectedReturnDate: newDateTime });
                          }
                          setIsDatePickerOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Seletor de Hora */}
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Hora"
                          min="0"
                          max="23"
                          value={formData.expectedReturnDate ? formData.expectedReturnDate.getHours() : ''}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value) || 0;
                            if (hours >= 0 && hours <= 23) {
                              const newDate = formData.expectedReturnDate ? 
                                new Date(formData.expectedReturnDate) : 
                                new Date();
                              newDate.setHours(hours);
                              setFormData({ ...formData, expectedReturnDate: newDate });
                            }
                          }}
                          className="border-gray-200 text-center"
                        />
                      </div>
                      <span className="flex items-center text-gray-500">:</span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          min="0"
                          max="59"
                          value={formData.expectedReturnDate ? formData.expectedReturnDate.getMinutes() : ''}
                          onChange={(e) => {
                            const minutes = parseInt(e.target.value) || 0;
                            if (minutes >= 0 && minutes <= 59) {
                              const newDate = formData.expectedReturnDate ? 
                                new Date(formData.expectedReturnDate) : 
                                new Date();
                              newDate.setMinutes(minutes);
                              setFormData({ ...formData, expectedReturnDate: newDate });
                            }
                          }}
                          className="border-gray-200 text-center"
                        />
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formData.expectedReturnDate && (
                        <span>
                          Prazo: {format(formData.expectedReturnDate, "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Botão de envio do formulário */}
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02]"
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
