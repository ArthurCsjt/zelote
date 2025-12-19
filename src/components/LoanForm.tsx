import { useState, useMemo, useCallback } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Computer, Calendar, Clock, Loader2, CheckCircle, User, BookOpen, AlertTriangle, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { useDatabase } from '@/hooks/useDatabase';
import UserAutocomplete from "./UserAutocomplete";
import PurposeAutocomplete from "./PurposeAutocomplete";
import type { UserSearchResult } from '@/hooks/useUserSearch';
import { DeviceListInput } from "./DeviceListInput";
import { Textarea } from "./ui/textarea";
import { ConfirmLoanDialog } from "./ConfirmLoanDialog";
import { LoanAccordionStep } from "./loan/LoanAccordionStep";
import { LoanProgressIndicator } from "./loan/LoanProgressIndicator";

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
    notes?: string;
}

interface LoanFormProps {
    onBack?: () => void;
}

export function LoanForm({ onBack }: LoanFormProps) {
    const { createLoan, bulkCreateLoans, loading } = useDatabase();

    const [formData, setFormData] = useState<LoanFormData>({
        studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'lote', notes: ''
    });

    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [hasReturnDeadline, setHasReturnDeadline] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [deviceIds, setDeviceIds] = useState<string[]>([]);
    const [isPurposeConfirmed, setIsPurposeConfirmed] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

    // Step validation
    const isUserSelected = !!selectedUser;
    const isPurposeDefined = !!formData.purpose.trim() && isPurposeConfirmed;
    const isDevicesAdded = deviceIds.length > 0;

    // Auto-advance logic
    const handleStepClick = useCallback((step: number) => {
        // Allow navigation to any step (non-linear)
        setActiveStep(step as 1 | 2 | 3 | 4);
    }, []);

    // Handlers
    const handleUserSelect = (user: UserSearchResult) => {
        setSelectedUser(user);
        setIsPurposeConfirmed(false);
        setFormData(prev => ({
            ...prev,
            studentName: user.name,
            ra: user.ra || '',
            email: user.email,
            userType: user.type,
            purpose: '',
            notes: '',
        }));
        // Auto advance to next step
        setTimeout(() => setActiveStep(2), 300);
    };

    const handleUserClear = () => {
        setSelectedUser(null);
        setIsPurposeConfirmed(false);
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
        setFormData(prev => ({ ...prev, purpose: '' }));
        setIsPurposeConfirmed(false);
    };

    const handlePurposeConfirm = (value: string) => {
        if (value.trim()) {
            setFormData(prev => ({ ...prev, purpose: value.trim() }));
            setIsPurposeConfirmed(true);
            // Auto advance to next step
            setTimeout(() => setActiveStep(3), 300);
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
        setIsPurposeConfirmed(false);
        setActiveStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            toast({ title: "Erro de Validação", description: "Selecione o solicitante.", variant: "destructive" });
            setActiveStep(1);
            return;
        }
        if (!isPurposeDefined) {
            toast({ title: "Erro", description: "Confirme a finalidade.", variant: "destructive" });
            setActiveStep(2);
            return;
        }
        if (deviceIds.length === 0) {
            toast({ title: "Erro", description: "Adicione pelo menos um dispositivo.", variant: "destructive" });
            setActiveStep(3);
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleConfirmLoan = async () => {
        setShowConfirmDialog(false);
        const loanType: 'individual' | 'lote' = deviceIds.length === 1 ? 'individual' : 'lote';
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
        }));

        const { successCount, errorCount } = await bulkCreateLoans(loanDataList);
        if (successCount > 0) {
            resetForm();
            toast({
                title: "Sucesso",
                description: `${successCount} Chromebooks emprestados. ${errorCount > 0 ? `(${errorCount} falha(s))` : ''}`,
                variant: "success",
            });
        }
    };

    const purposePlaceholder = selectedUser?.type === 'professor'
        ? '🎓 Ex: Aula de Matemática (3º ano)'
        : selectedUser?.type === 'funcionario'
            ? '💼 Ex: Suporte Técnico, Secretaria'
            : '📚 Ex: Atividade em Sala, Pesquisa';

    // Render purpose input
    const renderPurposeInput = () => {
        if (isPurposeConfirmed) {
            const isUserSelection = formData.purpose.includes(': ');
            const displayValue = isUserSelection ? formData.purpose.split(': ')[1] : formData.purpose;
            const displayType = isUserSelection ? formData.purpose.split(': ')[0] : 'Finalidade Livre';

            return (
                <div
                    className={cn(
                        "p-4 border-2 border-green-600 bg-green-50 dark:bg-green-950/50 cursor-pointer rounded-lg",
                        "hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                    )}
                    onClick={handlePurposeClear}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="font-bold text-sm text-foreground">{displayValue}</p>
                                <p className="text-xs text-muted-foreground">{displayType}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handlePurposeClear} disabled={loading}>
                            <X className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <PurposeAutocomplete
                value={formData.purpose}
                onChange={(value) => setFormData({ ...formData, purpose: value })}
                disabled={loading || !isUserSelected}
                placeholder={purposePlaceholder}
                userType={formData.userType}
                onConfirm={handlePurposeConfirm}
            />
        );
    };

    return (
        <div className="loan-accordion-container animate-fade-in">
            {/* Floating Progress Indicator */}
            <LoanProgressIndicator
                currentStep={activeStep}
                isUserSelected={isUserSelected}
                isPurposeDefined={isPurposeDefined}
                isDevicesAdded={isDevicesAdded}
                onStepClick={handleStepClick}
            />

            <form onSubmit={handleSubmit} className="loan-accordion-stack">
                {/* Step 1: Solicitante */}
                <LoanAccordionStep
                    stepNumber={1}
                    title="Solicitante"
                    subtitle={isUserSelected ? selectedUser?.name || '' : "Quem está solicitando?"}
                    icon={User}
                    accentColor="violet"
                    isActive={activeStep === 1}
                    isCompleted={isUserSelected}
                    isDisabled={false}
                    onClick={() => handleStepClick(1)}
                >
                    <div className="space-y-4">
                        <UserAutocomplete
                            selectedUser={selectedUser}
                            onSelect={handleUserSelect}
                            onClear={handleUserClear}
                            disabled={loading}
                        />
                        {!selectedUser && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>Selecione um solicitante para continuar</span>
                            </div>
                        )}
                    </div>
                </LoanAccordionStep>

                {/* Step 2: Finalidade */}
                <LoanAccordionStep
                    stepNumber={2}
                    title="Finalidade"
                    subtitle={isPurposeDefined ? formData.purpose : "Para que será usado?"}
                    icon={BookOpen}
                    accentColor="blue"
                    isActive={activeStep === 2}
                    isCompleted={isPurposeDefined}
                    isDisabled={!isUserSelected}
                    onClick={() => handleStepClick(2)}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase flex items-center gap-1">
                                Finalidade do Empréstimo
                                <span className="text-red-600">*</span>
                            </Label>
                            {renderPurposeInput()}
                        </div>

                        <div className="space-y-2 pt-4 border-t border-border">
                            <Label className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                                <MessageSquare className="h-4 w-4" />
                                Observações (Opcional)
                            </Label>
                            <Textarea
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Ex: Devolver antes das 15h."
                                className="min-h-[60px] resize-none"
                                disabled={loading || !isUserSelected}
                            />
                        </div>
                    </div>
                </LoanAccordionStep>

                {/* Step 3: Equipamento */}
                <LoanAccordionStep
                    stepNumber={3}
                    title="Equipamento"
                    subtitle={isDevicesAdded ? `${deviceIds.length} dispositivo(s)` : "Selecione os dispositivos"}
                    icon={Computer}
                    accentColor="amber"
                    isActive={activeStep === 3}
                    isCompleted={isDevicesAdded}
                    isDisabled={!isUserSelected || !isPurposeDefined}
                    onClick={() => handleStepClick(3)}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold uppercase">Adicionar Dispositivos</Label>
                            <Badge variant="outline" className={cn(
                                "font-bold",
                                deviceIds.length === 0
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300"
                            )}>
                                {deviceIds.length === 0 ? 'Nenhum' : `${deviceIds.length} selecionado(s)`}
                            </Badge>
                        </div>
                        <DeviceListInput
                            deviceIds={deviceIds}
                            setDeviceIds={setDeviceIds}
                            disabled={loading || !isUserSelected || !isPurposeDefined}
                            filterStatus="disponivel"
                            actionLabel="Empréstimo"
                        />
                    </div>
                </LoanAccordionStep>

                {/* Step 4: Confirmar */}
                <LoanAccordionStep
                    stepNumber={4}
                    title="Confirmar"
                    subtitle="Revise e finalize"
                    icon={CheckCircle}
                    accentColor="green"
                    isActive={activeStep === 4}
                    isCompleted={isUserSelected && isPurposeDefined && isDevicesAdded}
                    isDisabled={!isUserSelected || !isPurposeDefined || !isDevicesAdded}
                    onClick={() => handleStepClick(4)}
                >
                    <div className="space-y-5">
                        {/* Deadline Section */}
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <Checkbox
                                    id="returnDeadline"
                                    checked={hasReturnDeadline}
                                    onCheckedChange={(checked) => {
                                        const isChecked = !!checked;
                                        setHasReturnDeadline(isChecked);
                                        if (isChecked && !formData.expectedReturnDate) {
                                            setFormData(prev => ({ ...prev, expectedReturnDate: new Date() }));
                                        } else if (!isChecked) {
                                            setFormData({ ...formData, expectedReturnDate: undefined });
                                        }
                                    }}
                                    className="mt-0.5"
                                    disabled={!isUserSelected || !isPurposeDefined || !isDevicesAdded}
                                />
                                <div>
                                    <Label htmlFor="returnDeadline" className="text-sm font-bold cursor-pointer">
                                        Definir prazo de devolução
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Opcional - adicione uma data limite</p>
                                </div>
                            </div>

                            {hasReturnDeadline && (
                                <div className="pl-7 space-y-3 animate-in slide-in-from-top-2">
                                    <div className="flex flex-wrap gap-2">
                                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="justify-start text-left">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    {formData.expectedReturnDate ? format(formData.expectedReturnDate, "dd/MM/yyyy") : "Data"}
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
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex gap-1 items-center">
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
                                                className="text-center w-14"
                                            />
                                            <span className="font-bold">:</span>
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
                                                className="text-center w-14"
                                            />
                                        </div>
                                    </div>
                                    {formData.expectedReturnDate && (
                                        <div className="flex items-center gap-2 text-xs p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                            <Clock className="h-4 w-4 text-green-600" />
                                            <span className="font-medium text-green-700 dark:text-green-300">
                                                Prazo: {format(formData.expectedReturnDate, "dd/MM/yyyy 'às' HH:mm")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Summary Card */}
                        <div className="p-4 bg-muted/50 rounded-xl border border-border">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Resumo</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Solicitante:</span>
                                    <span className="font-semibold">{formData.studentName || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Finalidade:</span>
                                    <span className="font-semibold truncate max-w-[150px]">{formData.purpose || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dispositivos:</span>
                                    <span className="font-semibold">{deviceIds.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            size="lg"
                            className={cn(
                                "w-full h-14 text-base font-bold",
                                "bg-green-600 hover:bg-green-700 text-white",
                                "transition-all duration-300",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                isDevicesAdded && isUserSelected && isPurposeDefined && "animate-pulse"
                            )}
                            disabled={loading || !isDevicesAdded || !isUserSelected || !isPurposeDefined}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    Confirmar Empréstimo ({deviceIds.length})
                                </>
                            )}
                        </Button>
                    </div>
                </LoanAccordionStep>
            </form>

            {/* Confirm Dialog */}
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
