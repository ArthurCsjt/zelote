import { useState, useMemo } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Computer, Plus, QrCode, Calendar, Clock, Loader2, CheckCircle, User, BookOpen, AlertTriangle, MessageSquare, X } from "lucide-react";
import { QRCodeReader } from "./QRCodeReader";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { validateLoanFormData, sanitizeQRCodeData, normalizeChromebookId } from "@/utils/security";
import { useDatabase } from '@/hooks/useDatabase';
import UserAutocomplete from "./UserAutocomplete";
import PurposeAutocomplete from "./PurposeAutocomplete";
import type { UserSearchResult } from '@/hooks/useUserSearch';
import { Card, CardContent, CardTitle, CardHeader } from "./ui/card";
import { GlassCard } from "./ui/GlassCard";
import { DeviceListInput } from "./DeviceListInput";
import { LoanStepsHeader } from "./LoanStepsHeader";
import { Textarea } from "./ui/textarea"; // NOVO IMPORT

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
  // NOVO CAMPO: Observações
  notes?: string; 
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
    studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'lote', notes: ''
  });

  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [hasReturnDeadline, setHasReturnDeadline] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [deviceIds, setDeviceIds] = useState<string[]>([]); // Lista de IDs de dispositivos
  
  // NOVO ESTADO: Confirmação manual da finalidade
  const [isPurposeConfirmed, setIsPurposeConfirmed] = useState(false);

  // === LÓGICA DE PASSOS E VALIDAÇÃO ===
  const isUserSelected = !!selectedUser;
  // A finalidade só é definida se o campo não estiver vazio E o usuário tiver confirmado
  const isPurposeDefined = !!formData.purpose.trim() && isPurposeConfirmed; 
  const isDevicesAdded = deviceIds.length > 0;
  
  // NOVO CÁLCULO DE PASSO ATUAL (4 PASSOS)
  const currentStep: 1 | 2 | 3 | 4 = useMemo(() => {
    if (!isUserSelected) return 1;
    if (!isPurposeDefined) return 2;
    if (!isDevicesAdded) return 3;
    return 4;
  }, [isUserSelected, isPurposeDefined, isDevicesAdded]);

  // === FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ===

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    // Reseta a confirmação da finalidade ao mudar o usuário
    setIsPurposeConfirmed(false); 
    setFormData(prev => ({
      ...prev,
      studentName: user.name,
      ra: user.ra || '',
      email: user.email,
      userType: user.type,
      purpose: '', // Limpa a finalidade ao mudar o usuário
      notes: '', // Limpa as notas
    }));
  };

  const handleUserClear = () => {
    setSelectedUser(null);
    setIsPurposeConfirmed(false); // Reseta a confirmação
    setFormData(prev => ({
      ...prev,
      studentName: "",
      ra: "",
      email: "",
      userType: 'aluno',
      purpose: '',
      notes: '',
    }));
  };
  
  const handlePurposeClear = () => {
    setFormData(prev => ({
      ...prev,
      purpose: '',
    }));
    setIsPurposeConfirmed(false); // Permite re-edição
  };
  
  const resetForm = () => {
    setDeviceIds([]);
    setFormData({ 
      studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'lote', notes: ''
    });
    setSelectedUser(null);
    setHasReturnDeadline(false);
    setIsPurposeConfirmed(false); // Reseta a confirmação
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validação de Usuário
    if (!isUserSelected) {
        toast({
            title: "Erro de Validação",
            description: "Selecione o solicitante usando a busca automática.",
            variant: "destructive",
        });
        return;
    }
    
    // 2. Validação de Finalidade (Agora depende de isPurposeDefined)
    if (!isPurposeDefined) {
      toast({
        title: "Erro",
        description: "Confirme a finalidade do empréstimo no Passo 2.",
        variant: "destructive",
      });
      return;
    }
    
    // 3. Validação de Dispositivos
    if (deviceIds.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um dispositivo para empréstimo.",
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
      loanType: loanType,
      expectedReturnDate: hasReturnDeadline && formData.expectedReturnDate ? formData.expectedReturnDate : undefined,
      notes: formData.notes, // Incluindo notas no payload (embora o schema 'loans' não tenha 'notes', o useDatabase precisa ser atualizado para lidar com isso se necessário, mas por enquanto passamos)
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
      // Erros já são toastados dentro do useDatabase
    }
  };

  // Determina o placeholder do campo de finalidade baseado no tipo de usuário
  const purposePlaceholder = selectedUser?.type === 'professor' 
    ? '🎓 Ex: Aula de Matemática (3º ano)' 
    : selectedUser?.type === 'funcionario' 
      ? '💼 Ex: Suporte Técnico, Secretaria' 
      : '📚 Ex: Atividade em Sala, Pesquisa';
      
  // Lógica para exibir o cartão de confirmação da finalidade
  const renderPurposeConfirmation = () => {
    // Tenta identificar se o valor é um usuário formatado (ex: Professor: Nome)
    const isUserSelection = formData.purpose.includes(': ');
    const displayValue = isUserSelection ? formData.purpose.split(': ')[1] : formData.purpose;
    const displayType = isUserSelection ? formData.purpose.split(': ')[0] : 'Finalidade Livre';
    
    return (
        <GlassCard 
            className={cn(
                "p-3 border-2 shadow-md cursor-pointer",
                "border-green-600/50 bg-green-50/80 dark:bg-green-950/50 dark:border-green-900"
            )}
            onClick={handlePurposeClear} // Permite clicar para limpar e editar
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                        <p className="font-semibold text-sm text-foreground">{displayValue}</p>
                        <p className="text-xs text-muted-foreground">{displayType}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handlePurposeClear} disabled={loading}>
                    <X className="h-4 w-4 text-red-500" />
                </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-green-200 dark:border-green-900">
                <Badge variant="secondary" className="capitalize">{displayType}</Badge>
            </div>
        </GlassCard>
    );
  };


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
        
        <div className="grid md:grid-cols-2 gap-5">
            
            {/* ═══ COLUNA ESQUERDA ═══ */}
            <div className="space-y-5">
                
                {/* ═══ SEÇÃO 1: SOLICITANTE ═══ */}
                <GlassCard className={cn(
                    "bg-gradient-to-br from-violet-500/5 via-violet-500/3 to-transparent",
                    "border border-violet-500/20",
                    "shadow-xl shadow-violet-500/5",
                    "border-border-strong"
                )}>
                    <CardHeader className="p-5 pb-3 border-b border-violet-500/10 dark:border-violet-500/30">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <User className="h-5 w-5 text-violet-500" />
                            Passo 1: Solicitante
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-5 space-y-4">
                        {/* Busca de Usuário */}
                        <div className="space-y-2">
                            {/* REMOVIDA A LABEL REDUNDANTE */}
                            <Label className="text-sm font-medium text-foreground flex items-center gap-1 sr-only">
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
                    </CardContent>
                </GlassCard>
                
                {/* ═══ SEÇÃO 2: FINALIDADE ═══ */}
                <GlassCard className={cn(
                    "bg-gradient-to-br from-blue-500/5 via-blue-500/3 to-transparent",
                    "border border-blue-500/20",
                    "shadow-xl shadow-blue-500/5",
                    "border-border-strong",
                    !isUserSelected && "opacity-30 pointer-events-none" // ALTERADO PARA OPACITY-30
                )}>
                    <CardHeader className="p-5 pb-3 border-b border-blue-500/10 dark:border-blue-500/30">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <BookOpen className="h-5 w-5 text-blue-500" />
                            Passo 2: Finalidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                                Finalidade do Empréstimo
                                <span className="text-destructive">*</span>
                            </Label>
                            
                            {isPurposeConfirmed ? (
                                renderPurposeConfirmation()
                            ) : (
                                <div className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <PurposeAutocomplete
                                            value={formData.purpose}
                                            onChange={(value) => setFormData({ ...formData, purpose: value })}
                                            disabled={loading || !isUserSelected}
                                            placeholder={purposePlaceholder}
                                            userType={formData.userType}
                                        />
                                    </div>
                                    <Button 
                                        type="button" 
                                        size="icon" 
                                        onClick={() => {
                                            if (formData.purpose.trim()) {
                                                setIsPurposeConfirmed(true);
                                            } else {
                                                toast({ title: "Atenção", description: "O campo de finalidade não pode estar vazio.", variant: "destructive" });
                                            }
                                        }}
                                        disabled={loading || !formData.purpose.trim()}
                                        className="h-10 w-10 shrink-0 bg-green-600 hover:bg-green-700"
                                        title="Confirmar Finalidade"
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                            
                            {/* Validação em tempo real para Finalidade */}
                            {!isPurposeDefined && isUserSelected && (
                                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {isPurposeConfirmed ? "Finalidade confirmada, mas o campo está vazio." : "Defina e confirme a finalidade do empréstimo."}
                                </p>
                            )}
                        </div>
                        
                        {/* NOVO CAMPO: Observações Adicionais */}
                        <div className="space-y-2 pt-4 border-t border-border/50">
                            <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                Observações Adicionais (Opcional)
                            </Label>
                            <Textarea
                                id="notes"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Ex: Necessário para o projeto X, devolver antes das 15h."
                                className="bg-input border-gray-200 min-h-[80px] dark:bg-card dark:border-border"
                                disabled={loading || !isUserSelected}
                            />
                        </div>
                    </CardContent>
                </GlassCard>
            </div>

            {/* ═══ COLUNA DIREITA ═══ */}
            <div className="space-y-5">
                
                {/* ═══ SEÇÃO 3: DISPOSITIVOS ═══ */}
                <GlassCard className={cn(
                    "bg-gradient-to-br from-amber-500/5 via-amber-500/3 to-transparent",
                    "border border-amber-500/20",
                    "shadow-xl shadow-amber-500/5",
                    "border-border-strong",
                    (!isUserSelected || !isPurposeDefined) && "opacity-30 pointer-events-none" // ALTERADO PARA OPACITY-30
                )}>
                    <CardHeader className="p-5 pb-3 border-b border-amber-500/10 dark:border-amber-500/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                <Computer className="h-5 w-5 text-menu-amber" />
                                Passo 3: Equipamento
                            </CardTitle>
                            <Badge variant="outline" className={cn(
                                "text-xs font-medium transition-colors",
                                deviceIds.length === 0 ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800"
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

                {/* ═══ SEÇÃO 4: PRAZO E CONFIRMAÇÃO ═══ */}
                <GlassCard className={cn(
                    "bg-muted/30 border border-border/50",
                    "shadow-xl",
                    "border-border-strong",
                    (!isUserSelected || !isPurposeDefined || !isDevicesAdded) && "opacity-30 pointer-events-none" // ALTERADO PARA OPACITY-30
                )}>
                    <CardHeader className="p-5 pb-3 border-b border-border/50">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <Clock className="h-5 w-5 text-green-500" />
                            Passo 4: Prazo de Devolução (Opcional)
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
            </div>
        </div>

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
            !isDevicesAdded ||
            !isUserSelected ||
            !isPurposeDefined
          }
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando empréstimo...
            </>
          ) : !isUserSelected ? (
            <>
              <User className="mr-2 h-5 w-5" />
              Passo 1 Pendente: Selecione o Solicitante
            </>
          ) : !isPurposeDefined ? (
            <>
              <BookOpen className="mr-2 h-5 w-5" />
              Passo 2 Pendente: Defina a Finalidade
            </>
          ) : !isDevicesAdded ? (
            <>
              <Computer className="mr-2 h-5 w-5" />
              Passo 3 Pendente: Adicione os Equipamentos
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