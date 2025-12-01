import { useState, useMemo } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Computer, Plus, QrCode, Calendar, Clock, Loader2, CheckCircle, User, BookOpen, AlertTriangle } from "lucide-react";
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
import { LoanStepsHeader } from "./LoanStepsHeader"; // NOVO IMPORT

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

  // === LÓGICA DE PASSOS E VALIDAÇÃO ===
  const isUserSelected = !!selectedUser;
  const isPurposeDefined = !!formData.purpose;
  const isDevicesAdded = deviceIds.length > 0;
  
  const currentStep: 1 | 2 | 3 = useMemo(() => {
    if (!isUserSelected || !isPurposeDefined) return 1;
    if (!isDevicesAdded) return 2;
    return 3;
  }, [isUserSelected, isPurposeDefined, isDevicesAdded]);

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
    
    // 3. Validação de Finalidade
    if (!formData.purpose) {
      toast({
        title: "Erro",
        description: "Defina a finalidade do empréstimo.",
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
      // O bulkCreateLoans já toastou os erros individuais
    }
  };

  // Determina o placeholder do campo de finalidade baseado no tipo de usuário
  const purposePlaceholder = selectedUser?.type === 'professor' 
    ? '🎓 Ex: Aula de Matemática (3º ano)' 
    : selectedUser?.type === 'funcionario' 
      ? '💼 Ex: Suporte Técnico, Secretaria' 
      : '📚 Ex: Atividade em Sala, Pesquisa';

  // === RENDERIZAÇÃO DA INTERFACE (UI) ===
  return (
    <div className="animate-fade-in">
      
      {/* NOVO: Cabeçalho de Passos */}
      <LoanStepsHeader 
        currentStep={currentStep}
        isUserSelected={isUserSelected}
        isDevicesAdded={isDevicesAdded}
        isPurposeDefined={isPurposeDefined}
      />
      
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        
        {/* ═══ SEÇÃO 1: SOLICITANTE (PRIORIDADE MÁXIMA) ═══ */}
        <GlassCard className={cn(
          "bg-gradient-to-br from-violet-500/5 via-violet-500/3 to-transparent",
          "border border-violet-500/20",
          "shadow-xl shadow-violet-500/5",
          "border-border-strong" // ADICIONANDO BORDA DISCRETA
        )}>
          <CardHeader className="p-5 pb-3 border-b border-violet-500/10 dark:border-violet-500/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-violet-500" />
                Passo 1: Solicitante e Finalidade
              </CardTitle>
              {selectedUser && (
                <Badge variant="outline" className={cn(
                  "text-xs font-medium capitalize",
                  selectedUser.type === 'aluno' && "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800",
                  selectedUser.type === 'professor' && "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800",
                  selectedUser.type === 'funcionario' && "bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800"
                )}>
                  {selectedUser.type === 'aluno' ? 'Aluno' : 
                   selectedUser.type === 'professor' ? 'Professor' : 
                   'Funcionário'}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-5 space-y-4">
            {/* Busca de Usuário */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                Buscar por Nome, RA ou Email
                <span className="text-destructive">*</span>
              </Label>
              <UserAutocomplete
                selectedUser={selectedUser}
                onSelect={handleUserSelect}
                onClear={handleUserClear}
                disabled={loading}
              />
              {/* Validação em tempo real para Solicitante */}
              {!selectedUser && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Selecione um solicitante para continuar
                </p>
              )}
            </div>
            
            {/* Finalidade - MOVIDA PARA DENTRO DO MESMO CARD */}
            {selectedUser && (
              <div className="space-y-2 pt-3 border-t border-border/50">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  Finalidade do Empréstimo
                  <span className="text-destructive">*</span>
                </Label>
                <PurposeAutocomplete
                  value={formData.purpose}
                  onChange={(value) => setFormData({ ...formData, purpose: value })}
                  disabled={loading}
                  placeholder={purposePlaceholder}
                  userType={formData.userType}
                />
                {/* Validação em tempo real para Finalidade */}
                {!formData.purpose && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Defina a finalidade do empréstimo
                  </p>
                )}
                {formData.purpose && (
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3" />
                    Finalidade definida
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* ═══ SEÇÃO 2: DISPOSITIVOS ═══ */}
        <GlassCard className={cn(
          "bg-gradient-to-br from-blue-500/5 via-blue-500/3 to-transparent",
          "border border-blue-500/20",
          "shadow-xl shadow-blue-500/5", // ADICIONANDO shadow-xl
          "border-border-strong", // ADICIONANDO BORDA DISCRETA
          (!isUserSelected || !isPurposeDefined) && "opacity-50 pointer-events-none" // DESABILITADO SE NÃO TIVER USUÁRIO/FINALIDADE
        )}>
          <CardHeader className="p-5 pb-3 border-b border-blue-500/10 dark:border-blue-500/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Computer className="h-5 w-5 text-blue-500" />
                Passo 2: Dispositivos para Empréstimo
              </CardTitle>
              <Badge variant="outline" className={cn(
                "text-xs font-medium transition-colors",
                deviceIds.length === 0 ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800"
              )}>
                {deviceIds.length === 0 
                  ? 'Nenhum dispositivo' 
                  : `${deviceIds.length} ${deviceIds.length === 1 ? 'dispositivo' : 'dispositivos'}`
                }
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-5">
            <DeviceListInput
              deviceIds={deviceIds}
              setDeviceIds={setDeviceIds}
              disabled={loading || !isUserSelected || !isPurposeDefined}
              filterStatus="disponivel"
              actionLabel="Empréstimo"
            />
            
            {/* Validação em tempo real para Dispositivos */}
            {isUserSelected && isPurposeDefined && deviceIds.length === 0 && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-3">
                <AlertTriangle className="h-3 w-3" />
                Adicione pelo menos um dispositivo
              </p>
            )}
          </CardContent>
        </GlassCard>

        {/* ═══ SEÇÃO 3: OPÇÕES ADICIONAIS (PRAZO) ═══ */}
        <GlassCard className={cn(
          "bg-muted/30 border border-border/50",
          "shadow-xl", // ADICIONANDO shadow-xl
          "border-border-strong", // ADICIONANDO BORDA DISCRETA
          (!isUserSelected || !isPurposeDefined || !isDevicesAdded) && "opacity-50 pointer-events-none"
        )}>
          <CardHeader className="p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Clock className="h-5 w-5 text-violet-500" />
                Passo 3: Prazo de Devolução (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {/* Checkbox de prazo */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="returnDeadline"
                  checked={hasReturnDeadline}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setHasReturnDeadline(isChecked);
                    if (isChecked) {
                      // Pré-define a data e hora atuais se o prazo for ativado
                      if (!formData.expectedReturnDate) {
                        setFormData(prev => ({ ...prev, expectedReturnDate: new Date() }));
                      }
                    } else {
                      setFormData({ ...formData, expectedReturnDate: undefined });
                    }
                  }}
                  className="mt-1"
                  disabled={!isUserSelected || !isPurposeDefined || !isDevicesAdded}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="returnDeadline" 
                    className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-violet-500" />
                    Definir prazo de devolução
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione uma data e hora limite para devolução
                  </p>
                </div>
              </div>

              {/* Seletor de data/hora (aparece quando checkbox marcado) */}
              {hasReturnDeadline && (
                <div className="pl-7 space-y-3 border-l-2 border-violet-500/30 animate-in slide-in-from-left-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Data */}
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal w-full",
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
                      <PopoverContent 
                        className="w-auto p-0 bg-card border-border"
                        align="start"
                      >
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
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Hora */}
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="HH"
                        min="0"
                        max="23"
                        value={formData.expectedReturnDate ? String(formData.expectedReturnDate.getHours()).padStart(2, '0') : ''}
                        onChange={(e) => {
                          const hours = parseInt(e.target.value) || 0;
                          if (hours >= 0 && hours <= 23) {
                            const newDate = formData.expectedReturnDate || new Date();
                            newDate.setHours(hours);
                            setFormData({ ...formData, expectedReturnDate: newDate });
                          }
                        }}
                        className="text-center w-16"
                      />
                      <span className="text-muted-foreground">:</span>
                      <Input
                        type="number"
                        placeholder="MM"
                        min="0"
                        max="59"
                        value={formData.expectedReturnDate ? String(formData.expectedReturnDate.getMinutes()).padStart(2, '0') : ''}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value) || 0;
                          if (minutes >= 0 && minutes <= 59) {
                            const newDate = formData.expectedReturnDate || new Date();
                            newDate.setMinutes(minutes);
                            setFormData({ ...formData, expectedReturnDate: newDate });
                          }
                        }}
                        className="text-center w-16"
                      />
                    </div>
                  </div>
                  
                  {/* Preview da data/hora */}
                  {formData.expectedReturnDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <Clock className="h-4 w-4 text-violet-500" />
                      <span className="font-medium">
                        Prazo: {format(formData.expectedReturnDate, "dd/MM/yyyy 'às' HH:mm")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </GlassCard>
        
        {/* ═══ BOTÃO DE SUBMISSÃO ═══ */}
        <Button 
          type="submit" 
          size="lg"
          className={cn(
            "w-full h-12 text-base font-semibold",
            "bg-gradient-to-r from-violet-600 to-violet-500",
            "hover:from-violet-700 hover:to-violet-600",
            "shadow-lg shadow-violet-500/25",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          disabled={
            loading || 
            deviceIds.length === 0 ||
            !selectedUser ||
            !formData.purpose
          }
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando empréstimo...
            </>
          ) : deviceIds.length === 0 ? (
            <>
              <Computer className="mr-2 h-5 w-5" />
              Passo 2 Pendente: Selecione os dispositivos
            </>
          ) : !selectedUser || !formData.purpose ? (
            <>
              <User className="mr-2 h-5 w-5" />
              Passo 1 Pendente: Solicitante/Finalidade
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Emprestar {deviceIds.length} {deviceIds.length === 1 ? 'Chromebook' : 'Chromebooks'}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}