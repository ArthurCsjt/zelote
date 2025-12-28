import { useState, useMemo, useEffect } from "react";
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
import { useUserSearch } from '@/hooks/useUserSearch';
import type { UserSearchResult } from '@/hooks/useUserSearch';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardTitle, CardHeader } from "./ui/card";
import { GlassCard } from "./ui/GlassCard";
import { DeviceListInput } from "./DeviceListInput";
import { LoanStepsHeader } from "./LoanStepsHeader";
import { Textarea } from "./ui/textarea";
import { ConfirmLoanDialog } from "./ConfirmLoanDialog"; // NOVO IMPORT

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
    reservationId?: string;
}

// Define a interface das props do componente
interface LoanFormProps {
    onBack?: () => void;
    initialReservationData?: any;
}

/**
 * Componente de formulário para realizar novos empréstimos de Chromebooks
 */
export function LoanForm({ onBack, initialReservationData }: LoanFormProps) {
    // === ESTADOS (STATES) ===

    const { createLoan, bulkCreateLoans, loading } = useDatabase();
    const queryClient = useQueryClient();
    const { users } = useUserSearch();

    const [formData, setFormData] = useState<LoanFormData>({
        studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'lote', notes: '', reservationId: undefined
    });

    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

    // --- PRE-FILL LOGIC FROM RESERVATION ---
    useEffect(() => {
        if (initialReservationData && users.length > 0) {
            const reservation = initialReservationData;

            // Tenta encontrar o usuário pelo e-mail
            const foundUser = users.find(u => u.email === reservation.prof_email);

            if (foundUser) {
                setSelectedUser(foundUser);
                setFormData(prev => ({
                    ...prev,
                    studentName: foundUser.name,
                    ra: foundUser.ra || '',
                    email: foundUser.email,
                    userType: foundUser.type,
                    purpose: reservation.justification,
                    notes: `Reserva do dia ${format(new Date(reservation.date), 'dd/MM/yyyy')} às ${reservation.time_slot}. Quantidade solicitada: ${reservation.quantity_requested} Chromebooks.`,
                    reservationId: reservation.id,
                }));
                // Confirma automaticamente a finalidade se houver uma justificativa
                if (reservation.justification) {
                    setIsPurposeConfirmed(true);
                }
            } else {
                // Caso não encontre no autocomplete (improvável para professores ativos), preenche o máximo possível
                setFormData(prev => ({
                    ...prev,
                    studentName: reservation.prof_name || '',
                    email: reservation.prof_email || '',
                    purpose: reservation.justification || '',
                    userType: 'professor',
                    notes: `Reserva do dia ${format(new Date(reservation.date), 'dd/MM/yyyy')} às ${reservation.time_slot}. Quantidade solicitada: ${reservation.quantity_requested} Chromebooks.`,
                    reservationId: reservation.id,
                }));
            }
        }
    }, [initialReservationData, users]);
    const [hasReturnDeadline, setHasReturnDeadline] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [deviceIds, setDeviceIds] = useState<string[]>([]); // Lista de IDs de dispositivos

    // NOVO ESTADO: Confirmação manual da finalidade
    const [isPurposeConfirmed, setIsPurposeConfirmed] = useState(false);

    // NOVO ESTADO: Modal de confirmação
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

    const handlePurposeConfirm = (value: string) => {
        if (value.trim()) {
            setFormData(prev => ({ ...prev, purpose: value.trim() }));
            setIsPurposeConfirmed(true);
        } else {
            toast({ title: "Atenção", description: "O campo de finalidade não pode estar vazio.", variant: "destructive" });
        }
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
        if (!selectedUser) {
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

        // 4. Abrir modal de confirmação ao invés de enviar direto
        setShowConfirmDialog(true);
    };

    // NOVA FUNÇÃO: Confirmar e enviar após revisão
    const handleConfirmLoan = async () => {
        setShowConfirmDialog(false);

        // Determinar o tipo de empréstimo
        const loanType: 'individual' | 'lote' = deviceIds.length === 1 ? 'individual' : 'lote';

        // Preparar dados para Empréstimo em Lote (Bulk)
        const loanDataList: LoanFormData[] = deviceIds.map(deviceId => ({
            studentName: formData.studentName,
            ra: formData.ra || '',
            email: formData.email,
            chromebookId: deviceId,
            purpose: formData.purpose,
            userType: formData.userType,
            loanType: loanType,
            expectedReturnDate: hasReturnDeadline && formData.expectedReturnDate ? formData.expectedReturnDate : undefined,
            notes: formData.notes,
            reservationId: formData.reservationId,
        }));

        const { successCount, errorCount } = await bulkCreateLoans(loanDataList);

        if (successCount > 0) {
            resetForm();
            toast({
                title: "Sucesso",
                description: `${successCount} Chromebooks emprestados com sucesso. ${errorCount > 0 ? `(${errorCount} falha(s))` : ''}`,
                variant: "success",
            });
            // Invalida as queries de reserva para atualizar o agendamento
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
        } else if (errorCount > 0) {
            // Erros já são toastados dentro do useDatabase
        }
    };

    // Determina o placeholder do campo de finalidade baseado no tipo de usuário
    const purposePlaceholder = !selectedUser
        ? '📝 Ex: Professor Silva, Matemática'
        : selectedUser.type === 'professor'
            ? '🎓 Ex: Professor Silva, Matemática - 3º ano'
            : selectedUser.type === 'funcionario'
                ? '💼 Ex: João Silva, Suporte Técnico'
                : '📚 Ex: Maria Santos, Atividade em Sala';

    // Lógica para exibir o cartão de confirmação da finalidade
    const renderPurposeInput = () => {
        if (isPurposeConfirmed) {
            // Tenta identificar se o valor é um usuário formatado (ex: Professor: Nome)
            const isUserSelection = formData.purpose.includes(': ');
            const displayValue = isUserSelection ? formData.purpose.split(': ')[1] : formData.purpose;
            const displayType = isUserSelection ? formData.purpose.split(': ')[0] : 'Finalidade Livre';

            return (
                <div
                    className={cn(
                        "p-3 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(34,197,94,0.3)] cursor-pointer transition-all",
                        "bg-green-100 dark:bg-green-950/20"
                    )}
                    onClick={handlePurposeClear}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_0_#000]">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-sm uppercase truncate text-black dark:text-white leading-tight">{displayValue}</p>
                                <p className="text-[10px] font-bold uppercase text-green-700 dark:text-green-400">{displayType}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePurposeClear();
                            }}
                            disabled={loading}
                            className="bg-white border-2 border-black rounded-none h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            );
        }

        // Se não estiver definido, mostra o campo de busca/input
        return (
            <div className="flex gap-2 items-start">
                <div className="flex-1">
                    <PurposeAutocomplete
                        value={formData.purpose}
                        onChange={(value) => setFormData({ ...formData, purpose: value })}
                        disabled={loading}
                        placeholder={purposePlaceholder}
                        userType={formData.userType}
                        onConfirm={handlePurposeConfirm} // Passa a função de confirmação
                    />
                </div>
            </div>
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

            <form onSubmit={handleSubmit} className="space-y-3 relative z-10">

                <div className="grid md:grid-cols-2 gap-3">

                    {/* ═══ COLUNA ESQUERDA ═══ */}
                    <div className="space-y-3">

                        {/* ═══ SEÇÃO 1: SOLICITANTE ═══ */}
                        <div className={cn(
                            "neo-card border-l-[12px] border-4 border-violet-500 bg-violet-100 dark:bg-violet-950/20 transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(139,92,246,0.3)]",
                            currentStep === 1 && "ring-4 ring-violet-500 ring-offset-2 animate-gentle-pulse"
                        )}>
                            <CardHeader className="p-3 pb-2 border-b-3 border-violet-500/30 bg-gradient-to-r from-violet-400 to-purple-500">
                                <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-white">
                                    <User className="h-5 w-5" />
                                    Solicitante
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-3 space-y-2">
                                {/* Busca de Usuário */}
                                <div className="space-y-1">
                                    {/* REMOVIDA A LABEL REDUNDANTE */}
                                    <Label className="text-sm font-bold uppercase text-foreground flex items-center gap-1 sr-only">
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
                                        <div className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 uppercase">
                                            <AlertTriangle className="h-4 w-4" />
                                            Selecione um solicitante
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </div>

                        {/* ═══ SEÇÃO 2: FINALIDADE ═══ */}
                        <div className={cn(
                            "neo-card border-l-[12px] border-4 border-blue-500 bg-blue-100 dark:bg-blue-950/20 transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)]",
                            currentStep === 2 && isUserSelected && "ring-4 ring-blue-500 ring-offset-2 animate-gentle-pulse"
                        )}>
                            <CardHeader className="p-3 pb-2 border-b-3 border-blue-500/30 bg-gradient-to-r from-blue-400 to-cyan-500">
                                <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-white">
                                    <BookOpen className="h-5 w-5" />
                                    Finalidade
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 space-y-2">
                                <div className="space-y-1">
                                    <Label className="text-sm font-bold uppercase text-foreground flex items-center gap-1">
                                        Finalidade do Empréstimo
                                        <span className="text-red-600">*</span>
                                    </Label>

                                    {renderPurposeInput()}

                                    {/* Validação em tempo real para Finalidade */}
                                    {!isPurposeDefined && (
                                        <div className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 uppercase">
                                            <AlertTriangle className="h-4 w-4" />
                                            Defina e confirme a finalidade
                                        </div>
                                    )}
                                </div>

                                {/* NOVO CAMPO: Observações Adicionais */}
                                <div className="space-y-1 pt-2 border-t border-black/5 dark:border-white/5">
                                    <Label className="text-sm font-bold uppercase text-foreground flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        Observações (Opcional)
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Ex: Devolver antes das 15h."
                                        className="neo-input min-h-[60px]"
                                        disabled={loading}
                                    />
                                </div>
                            </CardContent>
                        </div>
                    </div>

                    {/* ═══ COLUNA DIREITA ═══ */}
                    <div className="space-y-3">

                        {/* ═══ SEÇÃO 3: DISPOSITIVOS ═══ */}
                        <div className={cn(
                            "neo-card border-l-[12px] border-4 border-amber-500 bg-amber-100 dark:bg-amber-950/20 transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(245,158,11,0.3)]",
                            currentStep === 3 && isUserSelected && isPurposeDefined && "ring-4 ring-amber-500 ring-offset-2 animate-gentle-pulse"
                        )}>
                            <CardHeader className="p-3 pb-2 border-b-3 border-amber-500/30 bg-gradient-to-r from-amber-400 to-orange-500">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-white">
                                        <Computer className="h-5 w-5" />
                                        Equipamento
                                    </CardTitle>
                                    <Badge variant="outline" className={cn(
                                        "rounded-none border-3 border-white text-white font-bold transition-colors text-xs shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]",
                                        deviceIds.length === 0
                                            ? "bg-white/20"
                                            : "bg-white/30"
                                    )}>
                                        {deviceIds.length === 0
                                            ? 'Nenhum'
                                            : `${deviceIds.length} ${deviceIds.length === 1 ? 'PC' : 'PCs'}`
                                        }
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-3">
                                <DeviceListInput
                                    deviceIds={deviceIds}
                                    setDeviceIds={setDeviceIds}
                                    disabled={loading}
                                    filterStatus="disponivel"
                                    actionLabel="Empréstimo"
                                />

                                {/* Validação em tempo real para Dispositivos */}
                                {deviceIds.length === 0 && (
                                    <div className="text-xs font-bold text-red-600 flex items-center gap-1 mt-2 uppercase">
                                        <AlertTriangle className="h-4 w-4" />
                                        Adicione pelo menos um dispositivo
                                    </div>
                                )}
                            </CardContent>
                        </div>

                        {/* ═══ SEÇÃO 4: PRAZO E CONFIRMAÇÃO ═══ */}
                        <div className={cn(
                            "neo-card border-l-[12px] border-4 border-green-500 bg-green-100 dark:bg-green-950/20 transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(34,197,94,0.3)]",
                            currentStep === 4 && isUserSelected && isPurposeDefined && isDevicesAdded && "ring-4 ring-green-500 ring-offset-2 animate-gentle-pulse"
                        )}>
                            <CardHeader className="p-3 pb-2 border-b-3 border-green-500/30 bg-gradient-to-r from-green-400 to-emerald-500">
                                <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-white">
                                    <Clock className="h-5 w-5" />
                                    Prazo (Opcional)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3">
                                <div className="space-y-2">
                                    {/* Checkbox de prazo */}
                                    <div className="flex items-start space-x-2">
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
                                            className="mt-0.5 w-5 h-5 border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white rounded-none"
                                            disabled={loading}
                                        />
                                        <div className="flex-1">
                                            <Label
                                                htmlFor="returnDeadline"
                                                className="text-sm font-bold uppercase text-foreground cursor-pointer flex items-center gap-2"
                                            >
                                                Definir prazo de devolução
                                            </Label>
                                            <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                                Adicione uma data limite
                                            </p>
                                        </div>
                                    </div>

                                    {/* Seletor de data/hora (aparece quando checkbox marcado) */}
                                    {hasReturnDeadline && (
                                        <div className="pl-7 space-y-3 animate-in slide-in-from-left-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {/* Data */}
                                                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "justify-start text-left font-mono neo-input w-full",
                                                                !formData.expectedReturnDate && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            {formData.expectedReturnDate ? (
                                                                format(formData.expectedReturnDate, "dd/MM/yyyy")
                                                            ) : (
                                                                <span>SELECIONAR DATA</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-auto p-0 bg-card border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000]"
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
                                                        className="text-center w-16 neo-input"
                                                    />
                                                    <span className="font-black">:</span>
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
                                                        className="text-center w-16 neo-input"
                                                    />
                                                </div>
                                            </div>

                                            {/* Preview da data/hora */}
                                            {formData.expectedReturnDate && (
                                                <div className="flex items-center gap-2 text-xs text-foreground neo-card p-2 bg-white dark:bg-black border-l-4 border-l-green-500 shadow-none">
                                                    <Clock className="h-4 w-4 text-green-600" />
                                                    <span className="font-bold uppercase">
                                                        Prazo Final: {format(formData.expectedReturnDate, "dd/MM/yyyy 'às' HH:mm")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </div>
                    </div>
                </div>

                {/* ═══ BOTÃO DE SUBMISSÃO ═══ */}
                <Button
                    type="submit"
                    size="lg"
                    className={cn(
                        "w-full h-16 text-xl font-black uppercase tracking-wide",
                        "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
                        "text-white border-4 border-black dark:border-white",
                        "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)]",
                        "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
                        "active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px]",
                        "transition-all duration-150",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-[8px] disabled:translate-y-[8px]"
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
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            PROCESSANDO...
                        </>
                    ) : !isUserSelected ? (
                        <>
                            <User className="mr-2 h-6 w-6" />
                            ❌ Solicitante Pendente
                        </>
                    ) : !isPurposeDefined ? (
                        <>
                            <BookOpen className="mr-2 h-6 w-6" />
                            ❌ Finalidade Pendente
                        </>
                    ) : !isDevicesAdded ? (
                        <>
                            <Computer className="mr-2 h-6 w-6" />
                            ❌ Equipamento Pendente
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-6 w-6" />
                            ✅ Registrar Empréstimo ({deviceIds.length})
                        </>
                    )}
                </Button>
            </form>

            {/* Modal de Confirmação */}
            <ConfirmLoanDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                formData={formData}
                deviceIds={deviceIds}
                hasReturnDeadline={hasReturnDeadline}
                onConfirm={handleConfirmLoan}
                loading={loading}
            />
        </div>
    );
}