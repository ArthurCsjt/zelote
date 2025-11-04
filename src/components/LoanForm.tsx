import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Computer, Plus, QrCode, Calendar, Clock, Loader2, CheckCircle, User, BookOpen } from "lucide-react";
import { QRCodeReader } from "./QRCodeReader";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { validateLoanFormData, sanitizeQRCodeData, normalizeChromebookId } from "@/utils/security";
import { useDatabase } from '@/hooks/useDatabase';
import UserAutocomplete from "./UserAutocomplete";
import PurposeAutocomplete from "./PurposeAutocomplete"; // NOVO IMPORT
import type { UserSearchResult } from '@/hooks/useUserSearch';
import { Card, CardContent, CardTitle, CardHeader } from "./ui/card"; // Adicionado CardHeader
import { GlassCard } from "./ui/GlassCard";
import { DeviceListInput } from "./DeviceListInput"; // NOVO IMPORT

// Define a interface dos dados do formulário de empréstimo
interface LoanFormData {
  studentName: string;
  ra?: string;
  email: string;
  chromebookId: string; // Mantido para validação, mas não usado diretamente no payload
  purpose: string;
  userType: 'aluno' | 'professor' | 'funcionario';
  loanType: 'individual' | 'lote'; // Mantido para tipagem
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
    studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'lote' // PADRÃO: LOTE
  });

  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [hasReturnDeadline, setHasReturnDeadline] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [deviceIds, setDeviceIds] = useState<string[]>([]); // Lista de IDs de dispositivos

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setFormData(prev => ({
      ...prev,
      studentName: user.name,
      ra: user.ra || '',
      email: user.email,
      userType: user.type,
      // Limpa a finalidade ao mudar o usuário, pois a finalidade pode mudar
      purpose: '', 
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
      purpose: '', // Limpa a finalidade
    }));
  };
  
  const resetForm = () => {
    setDeviceIds([]);
    setFormData({ 
      studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'lote'
    });
    setSelectedUser(null);
    setHasReturnDeadline(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validação de Usuário
    if (!selectedUser) {
        toast({
            title: "Erro de Validação",
            description: "Selecione o solicitante usando a busca automática.",
            variant: "destructive",
        });
        return;
    }
    
    // 2. Validação de Dispositivos
    if (deviceIds.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um dispositivo para empréstimo.",
        variant: "destructive",
      });
      return;
    }
    
    // 3. Validação de Campos (usando o primeiro dispositivo para validação de formato)
    const dataToValidate = {
      ...formData,
      chromebookId: deviceIds[0], // Usamos o primeiro ID para validar o formato do ID
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
    
    // 4. Determinar o tipo de empréstimo
    const loanType: 'individual' | 'lote' = deviceIds.length === 1 ? 'individual' : 'lote';
    
    // 5. Preparar dados para Empréstimo em Lote (Bulk)
    const loanDataList: LoanFormData[] = deviceIds.map(deviceId => ({
      studentName: formData.studentName,
      ra: formData.ra || '',
      email: formData.email,
      chromebookId: deviceId,
      purpose: formData.purpose,
      userType: formData.userType,
      loanType: loanType, // USANDO O TIPO CORRETO
      expectedReturnDate: hasReturnDeadline && formData.expectedReturnDate ? formData.expectedReturnDate : undefined,
    }));
    
    const { successCount, errorCount } = await bulkCreateLoans(loanDataList);
    
    if (successCount > 0) {
      resetForm();
      toast({
        title: "Sucesso",
        description: `${successCount} Chromebooks emprestados com sucesso. ${errorCount > 0 ? `(${errorCount} falha(s))` : ''}`,
        variant: "success",
      });
    } else if (errorCount > 0) {
      toast({
        title: "Erro no Empréstimo",
        description: "Nenhum empréstimo foi criado. Verifique os erros acima.",
        variant: "destructive",
      });
    }
  };

  // Determina o placeholder do campo de finalidade baseado no tipo de usuário
  const purposePlaceholder = selectedUser?.type === 'professor' 
    ? 'Buscar professor ou digitar aula (Ex: Aula de História)' 
    : selectedUser?.type === 'funcionario' 
      ? 'Buscar funcionário ou digitar departamento (Ex: Suporte Técnico)' 
      : 'Ex: Aula de Matemática, Uso Pessoal';

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <div className="animate-fade-in relative">
      {/* Gradiente de fundo sutil para a área do formulário */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-50/30 via-blue-50/20 to-violet-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        
        <div className="grid md:grid-cols-2 gap-6">
            
          {/* Coluna Esquerda - Detalhes do Equipamento/Lote (VIOLETA CLARO) */}
          <GlassCard className="bg-menu-violet/10 border-menu-violet/30 shadow-inner dark:bg-card/50 dark:border-menu-violet/50">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-lg flex items-center gap-2 text-menu-violet dark:text-violet-400">
                <Computer className="h-5 w-5" /> Dispositivos para Empréstimo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              {/* Entrada de Dispositivos Unificada */}
              <DeviceListInput
                deviceIds={deviceIds}
                setDeviceIds={setDeviceIds}
                disabled={loading}
                filterStatus="disponivel"
                actionLabel="Empréstimo"
              />
            </CardContent>
          </GlassCard>

          {/* Coluna Direita - Informações do Solicitante e Finalidade */}
          <div className="space-y-6">
            
            {/* Card 1: Informações do Solicitante */}
            <GlassCard className="bg-menu-violet/10 border-menu-violet/30 shadow-inner dark:bg-card/50 dark:border-menu-violet/50">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg flex items-center gap-2 text-menu-violet dark:text-violet-400">
                  <User className="h-5 w-5" /> Informações do Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                
                {/* Seletor de Usuário com Autocompletar */}
                <div className="space-y-2">
                  <Label htmlFor="userSearch" className="text-foreground">
                    Buscar Solicitante (Nome, RA ou Email) *
                  </Label>
                  <UserAutocomplete
                    selectedUser={selectedUser}
                    onSelect={handleUserSelect}
                    onClear={handleUserClear}
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </GlassCard>
            
            {/* Card 2: Finalidade (NOVO CARD SEPARADO) */}
            <GlassCard className="bg-menu-violet/10 border-menu-violet/30 shadow-inner dark:bg-card/50 dark:border-menu-violet/50">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg flex items-center gap-2 text-menu-violet dark:text-violet-400">
                  <BookOpen className="h-5 w-5" /> Finalidade do Empréstimo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-foreground">
                    Finalidade (Aula/Professor/Departamento) *
                  </Label>
                  <PurposeAutocomplete
                    value={formData.purpose}
                    onChange={(value) => setFormData({ ...formData, purpose: value })}
                    disabled={loading || !selectedUser}
                    placeholder={purposePlaceholder}
                    userType={formData.userType}
                  />
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </div>

        {/* Opção para definir prazo de devolução (abaixo das colunas) */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-xl border border-border dark:bg-card/50">
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
            <Label htmlFor="returnDeadline" className="text-foreground font-medium cursor-pointer">
              Definir prazo de devolução
            </Label>
          </div>

          {hasReturnDeadline && (
            <div className="space-y-3 pl-6 border-l-2 border-menu-violet/50">
              <div className="space-y-2">
                <Label className="text-foreground text-sm font-medium">
                  Data e Hora de Devolução
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal border-gray-200 bg-input dark:bg-card dark:border-border",
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
                          className="border-gray-200 text-center bg-input dark:bg-card dark:border-border"
                        />
                      </div>
                      <span className="flex items-center text-muted-foreground">:</span>
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
                          className="border-gray-200 text-center bg-input dark:bg-card dark:border-border"
                        />
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
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
          className="w-full bg-menu-violet hover:bg-menu-violet-hover text-white border-0 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02]"
          disabled={
            loading || 
            deviceIds.length === 0 ||
            !selectedUser ||
            !formData.purpose // Adicionando validação para purpose
          }
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : `Emprestar ${deviceIds.length} Chromebook${deviceIds.length !== 1 ? 's' : ''}`}
        </Button>
      </form>
    </div>
  );
}