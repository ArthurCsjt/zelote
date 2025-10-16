import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Computer, Plus, QrCode, Calendar, Clock, Loader2, CheckCircle, User } from "lucide-react";
import { QRCodeReader } from "./QRCodeReader";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { validateLoanFormData, sanitizeQRCodeData, normalizeChromebookId } from "@/utils/security";
import { useDatabase } from '@/hooks/useDatabase';
import UserAutocomplete from "./UserAutocomplete";
import type { UserSearchResult } from '@/hooks/useUserSearch';
import { Card, CardContent, CardTitle } from "./ui/card";
import { BatchDeviceInput } from "./BatchDeviceInput"; // Importando o novo componente
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard para consistência

// Define a interface dos dados do formulário de empréstimo
interface LoanFormData {
  studentName: string;
  ra?: string;
  email: string;
  chromebookId: string;
  purpose: string;
  userType: 'aluno' | 'professor' | 'funcionario';
  loanType: 'individual' | 'lote';
  expectedReturnDate?: Date;
}

// Define a interface das props do componente
interface LoanFormProps {
  onBack?: () => void;
}

/**
 * Componente de formulário para realizar novos empréstimos de Chromebooks
 */
export function LoanForm({ onBack }: LoanFormProps) {
  // === ESTADOS (STATES) ===
  
  const { createLoan, bulkCreateLoans, loading } = useDatabase();
  
  const [formData, setFormData] = useState<LoanFormData>({
    studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'individual'
  });

  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [hasReturnDeadline, setHasReturnDeadline] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [batchDevices, setBatchDevices] = useState<string[]>([]);
  const [isQRReaderOpen, setIsQRReaderOpen] = useState(false);

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setFormData(prev => ({
      ...prev,
      studentName: user.name,
      ra: user.ra || '',
      email: user.email,
      userType: user.type,
    }));
  };

  const handleUserClear = () => {
    setSelectedUser(null);
    setFormData(prev => ({
      ...prev,
      studentName: "",
      ra: "",
      email: "",
      userType: 'aluno',
    }));
  };

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
        // Lógica de lote movida para BatchDeviceInput, mas mantemos a compatibilidade aqui
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
  
  const handleChromebookIdChange = (value: string) => {
    setFormData({ ...formData, chromebookId: value });
  };

  const handleValidateIndividualId = () => {
    const normalizedId = normalizeChromebookId(formData.chromebookId);
    
    if (!normalizedId) {
      toast({
        title: "Erro",
        description: "O ID do Chromebook não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({ ...prev, chromebookId: normalizedId }));

    toast({
      title: "ID Verificado",
      description: `ID normalizado: ${normalizedId}. Pronto para empréstimo.`,
    });
  };

  const resetForm = () => {
    setBatchDevices([]);
    setFormData({ 
      studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'individual'
    });
    setSelectedUser(null);
    setHasReturnDeadline(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normaliza o ID do Chromebook antes da validação e uso
    const normalizedChromebookId = normalizeChromebookId(formData.chromebookId);

    const dataToValidate = {
      ...formData,
      chromebookId: normalizedChromebookId,
    };
    
    const validation = validateLoanFormData(dataToValidate);
    
    if (!validation.isValid) {
      toast({
        title: "Erro de Validação",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }
    
    if (formData.loanType === 'lote') {
      if (batchDevices.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um dispositivo para empréstimo em lote",
          variant: "destructive",
        });
        return;
      }
      
      const loanDataList: LoanFormData[] = batchDevices.map(deviceId => ({
        studentName: formData.studentName,
        ra: formData.ra || '',
        email: formData.email,
        chromebookId: deviceId, // IDs em batchDevices já estão normalizados pelo BatchDeviceInput
        purpose: formData.purpose,
        userType: formData.userType,
        loanType: formData.loanType,
        expectedReturnDate: hasReturnDeadline && formData.expectedReturnDate ? formData.expectedReturnDate : undefined,
      }));
      
      const { successCount, errorCount } = await bulkCreateLoans(loanDataList);
      
      if (successCount > 0) {
        resetForm();
        toast({
          title: "Sucesso",
          description: `${successCount} Chromebooks emprestados com sucesso. ${errorCount > 0 ? `(${errorCount} falha(s))` : ''}`,
        });
      } else if (errorCount > 0) {
        toast({
          title: "Erro no Lote",
          description: "Nenhum empréstimo foi criado. Verifique os erros acima.",
          variant: "destructive",
        });
      }
      
    } else {
      if (!dataToValidate.studentName || !dataToValidate.email || !dataToValidate.chromebookId || !dataToValidate.purpose) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
      
      const loanData = {
        studentName: dataToValidate.studentName,
        ra: dataToValidate.ra || '',
        email: dataToValidate.email,
        chromebookId: normalizedChromebookId, // Usando o ID normalizado
        purpose: dataToValidate.purpose,
        userType: dataToValidate.userType,
        loanType: dataToValidate.loanType,
        expectedReturnDate: hasReturnDeadline && formData.expectedReturnDate ? formData.expectedReturnDate : undefined,
      };
      
      const result = await createLoan(loanData as any);
      
      if (result) {
        resetForm();
        toast({
          title: "Sucesso",
          description: "Chromebook emprestado com sucesso",
        });
      }
    }
  };

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <div className="animate-fade-in relative">
      {/* Removido o glass-morphism e o p-6 daqui */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 relative z-10">
        Novo Empréstimo
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        
        <div className="grid md:grid-cols-2 gap-6">
            
          {/* Coluna Esquerda - Detalhes do Equipamento/Lote */}
          <GlassCard className="p-4 space-y-4 bg-green-50/50 border-green-100 shadow-inner">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Computer className="h-5 w-5" /> Detalhes do Equipamento
            </CardTitle>
            
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
                <SelectTrigger className="border-gray-200 bg-white">
                  <SelectValue placeholder="Selecione o tipo de empréstimo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="lote">Em Lote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.loanType === 'individual' ? (
              /* Campo de ID para empréstimo individual */
              <div className="space-y-2">
                <Label htmlFor="chromebookId" className="text-gray-700">
                  ID do Chromebook
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="chromebookId"
                      placeholder="Digite o ID do Chromebook (ex: 12 ou CHR012)"
                      value={formData.chromebookId}
                      onChange={(e) => handleChromebookIdChange(e.target.value)}
                      className="border-gray-200 w-full pr-10 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleValidateIndividualId();
                        }
                      }}
                      required // Adicionado required
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleValidateIndividualId}
                      className="absolute right-1 top-1 h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-100"
                      title="Validar ID"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-gray-200 bg-white hover:bg-gray-50 px-3"
                    onClick={() => setIsQRReaderOpen(true)}
                    title="Escanear QR Code"
                  >
                    <QrCode className="h-5 w-5 text-gray-600" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Interface de empréstimo em lote (usando o novo componente) */
              <BatchDeviceInput
                batchDevices={batchDevices}
                setBatchDevices={setBatchDevices}
                onScan={handleQRCodeScan}
                disabled={loading}
              />
            )}
          </GlassCard>

          {/* Coluna Direita - Informações do Solicitante */}
          <GlassCard className="p-4 space-y-4 bg-purple-50/50 border-purple-100 shadow-inner">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <User className="h-5 w-5" /> Informações do Solicitante
            </CardTitle>
            
            {/* Seletor de Usuário com Autocompletar */}
            <div className="space-y-2">
              <Label htmlFor="userSearch" className="text-gray-700">
                Buscar Solicitante (Nome, RA ou Email)
              </Label>
              <UserAutocomplete
                selectedUser={selectedUser}
                onSelect={handleUserSelect}
                onClear={handleUserClear}
                disabled={loading}
              />
            </div>

            {/* Campo de finalidade do empréstimo (sempre visível) */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="purpose" className="text-gray-700">
                Finalidade *
              </Label>
              <Input
                id="purpose"
                placeholder="Ex: Aula de Matemática"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                className="border-gray-200 bg-white"
                required // Adicionado required
              />
            </div>
          </GlassCard>
        </div>

        {/* Opção para definir prazo de devolução (abaixo das colunas) */}
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
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal border-gray-200 bg-white",
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
                          className="border-gray-200 text-center bg-white"
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
                          className="border-gray-200 text-center bg-white"
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
          disabled={loading || (formData.loanType === 'lote' && batchDevices.length === 0)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : formData.loanType === 'lote' 
            ? `Emprestar ${batchDevices.length} Chromebooks` 
            : "Emprestar Chromebook"}
        </Button>
      </form>

      {/* Componente de leitura de QR Code (apenas para empréstimo individual) */}
      {formData.loanType === 'individual' && (
        <QRCodeReader
          open={isQRReaderOpen}
          onOpenChange={setIsQRReaderOpen}
          onScan={handleQRCodeScan}
        />
      )}
      {/* O BatchDeviceInput gerencia seu próprio QRCodeReader */}
    </div>
  );
}