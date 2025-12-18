import { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Computer, Calendar, Clock, Loader2, CheckCircle, User, BookOpen, AlertTriangle, MessageSquare, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { useDatabase } from '@/hooks/useDatabase';
import UserAutocomplete from "./UserAutocomplete";
import PurposeAutocomplete from "./PurposeAutocomplete";
import type { UserSearchResult } from '@/hooks/useUserSearch';
import { DeviceListInput } from "./DeviceListInput";
import { LoanStepsHeader } from "./LoanStepsHeader";
import { Textarea } from "./ui/textarea";
import { ConfirmLoanDialog } from "./ConfirmLoanDialog";
import { LoanStepSlide } from "./loan/LoanStepSlide";
import { LoanStatusBar } from "./loan/LoanStatusBar";
import useEmblaCarousel from 'embla-carousel-react';

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

    // Embla Carousel
    const [emblaRef, emblaApi] = useEmblaCarousel({ 
        loop: false,
        dragFree: false,
        containScroll: 'trimSnaps',
        watchDrag: true,
    });

    const [formData, setFormData] = useState<LoanFormData>({
        studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno', loanType: 'lote', notes: ''
    });

    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [hasReturnDeadline, setHasReturnDeadline] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [deviceIds, setDeviceIds] = useState<string[]>([]);
    const [isPurposeConfirmed, setIsPurposeConfirmed] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Step validation
    const isUserSelected = !!selectedUser;
    const isPurposeDefined = !!formData.purpose.trim() && isPurposeConfirmed;
    const isDevicesAdded = deviceIds.length > 0;

    const currentStep: 1 | 2 | 3 | 4 = useMemo(() => {
        if (!isUserSelected) return 1;
        if (!isPurposeDefined) return 2;
        if (!isDevicesAdded) return 3;
        return 4;
    }, [isUserSelected, isPurposeDefined, isDevicesAdded]);

    // Navigate carousel to step
    const scrollToStep = useCallback((step: number) => {
        if (emblaApi) {
            emblaApi.scrollTo(step - 1);
        }
    }, [emblaApi]);

    // Auto-advance to next step when step completes
    useEffect(() => {
        if (emblaApi) {
            // Small delay to allow animation
            const timer = setTimeout(() => {
                scrollToStep(currentStep);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [currentStep, emblaApi, scrollToStep]);

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
        scrollToStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            toast({ title: "Erro de Validação", description: "Selecione o solicitante.", variant: "destructive" });
            scrollToStep(1);
            return;
        }
        if (!isPurposeDefined) {
            toast({ title: "Erro", description: "Confirme a finalidade.", variant: "destructive" });
            scrollToStep(2);
            return;
        }
        if (deviceIds.length === 0) {
            toast({ title: "Erro", description: "Adicione pelo menos um dispositivo.", variant: "destructive" });
            scrollToStep(3);
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
                        "p-4 border-2 border-green-600 bg-green-50 dark:bg-green-950/50 cursor-pointer",
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
        <div className="animate-fade-in loan-form-with-status-bar">
            {/* Desktop Header */}
            <div className="hidden md:block">
                <LoanStepsHeader
                    currentStep={currentStep}
                    isUserSelected={isUserSelected}
                    isDevicesAdded={isDevicesAdded}
                    isPurposeDefined={isPurposeDefined}
                    onStepClick={scrollToStep}
                />
            </div>

            {/* Mobile Step Indicator */}
            <div className="md:hidden mb-4 px-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Passo {currentStep} de 4
                    </span>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                            <div
                                key={step}
                                className={cn(
                                    "h-2 w-8 border border-black dark:border-white transition-all",
                                    step < currentStep && "bg-green-500",
                                    step === currentStep && "bg-yellow-400",
                                    step > currentStep && "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Carousel Container */}
                <div className="loan-slider-container">
                    <div className="loan-slider-viewport" ref={emblaRef}>
                        <div className="loan-slider-content">
                            
                            {/* SLIDE 1: Solicitante */}
                            <LoanStepSlide
                                stepNumber={1}
                                title="Solicitante"
                                icon={User}
                                accentColor="violet"
                                isActive={currentStep === 1}
                                isCompleted={isUserSelected}
                                isDisabled={false}
                            >
                                <div className="space-y-4">
                                    <UserAutocomplete
                                        selectedUser={selectedUser}
                                        onSelect={handleUserSelect}
                                        onClear={handleUserClear}
                                        disabled={loading}
                                    />
                                    {!selectedUser && (
                                        <div className="neo-validation-warning">
                                            <AlertTriangle className="h-4 w-4" />
                                            Selecione um solicitante para continuar
                                        </div>
                                    )}
                                    {selectedUser && (
                                        <div className="mt-4 p-3 border-2 border-green-500 bg-green-50 dark:bg-green-950/30">
                                            <p className="text-xs font-black uppercase text-green-600 mb-1">Solicitante Selecionado</p>
                                            <p className="font-bold">{selectedUser.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                        </div>
                                    )}
                                </div>
                            </LoanStepSlide>

                            {/* SLIDE 2: Finalidade */}
                            <LoanStepSlide
                                stepNumber={2}
                                title="Finalidade"
                                icon={BookOpen}
                                accentColor="blue"
                                isActive={currentStep === 2}
                                isCompleted={isPurposeDefined}
                                isDisabled={!isUserSelected}
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold uppercase flex items-center gap-1">
                                            Finalidade do Empréstimo
                                            <span className="text-red-600">*</span>
                                        </Label>
                                        {renderPurposeInput()}
                                        {!isPurposeDefined && isUserSelected && (
                                            <div className="neo-validation-warning">
                                                <AlertTriangle className="h-4 w-4" />
                                                Defina e confirme a finalidade
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-4 border-t-2 border-black/10 dark:border-white/10">
                                        <Label className="text-sm font-bold uppercase flex items-center gap-1">
                                            <MessageSquare className="h-4 w-4" />
                                            Observações (Opcional)
                                        </Label>
                                        <Textarea
                                            value={formData.notes || ''}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Ex: Devolver antes das 15h."
                                            className="neo-input min-h-[80px]"
                                            disabled={loading || !isUserSelected}
                                        />
                                    </div>
                                </div>
                            </LoanStepSlide>

                            {/* SLIDE 3: Equipamento */}
                            <LoanStepSlide
                                stepNumber={3}
                                title="Equipamento"
                                icon={Computer}
                                accentColor="amber"
                                isActive={currentStep === 3}
                                isCompleted={isDevicesAdded}
                                isDisabled={!isUserSelected || !isPurposeDefined}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-bold uppercase">Adicionar Dispositivos</Label>
                                        <Badge variant="outline" className={cn(
                                            "rounded-none border-2 font-bold",
                                            deviceIds.length === 0
                                                ? "bg-muted text-muted-foreground"
                                                : "bg-amber-300 text-black border-black"
                                        )}>
                                            {deviceIds.length === 0 ? 'Nenhum' : `${deviceIds.length} PC${deviceIds.length > 1 ? 's' : ''}`}
                                        </Badge>
                                    </div>
                                    <DeviceListInput
                                        deviceIds={deviceIds}
                                        setDeviceIds={setDeviceIds}
                                        disabled={loading || !isUserSelected || !isPurposeDefined}
                                        filterStatus="disponivel"
                                        actionLabel="Empréstimo"
                                    />
                                    {isUserSelected && isPurposeDefined && deviceIds.length === 0 && (
                                        <div className="neo-validation-warning">
                                            <AlertTriangle className="h-4 w-4" />
                                            Adicione pelo menos um dispositivo
                                        </div>
                                    )}
                                </div>
                            </LoanStepSlide>

                            {/* SLIDE 4: Prazo e Confirmação */}
                            <LoanStepSlide
                                stepNumber={4}
                                title="Confirmar"
                                icon={CheckCircle}
                                accentColor="green"
                                isActive={currentStep === 4}
                                isCompleted={isUserSelected && isPurposeDefined && isDevicesAdded}
                                isDisabled={!isUserSelected || !isPurposeDefined || !isDevicesAdded}
                            >
                                <div className="space-y-4">
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
                                                className="mt-1 w-6 h-6 border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white rounded-none"
                                                disabled={!isUserSelected || !isPurposeDefined || !isDevicesAdded}
                                            />
                                            <div>
                                                <Label htmlFor="returnDeadline" className="text-base font-bold uppercase cursor-pointer">
                                                    Definir prazo de devolução
                                                </Label>
                                                <p className="text-xs text-muted-foreground">Opcional - adicione uma data limite</p>
                                            </div>
                                        </div>

                                        {hasReturnDeadline && (
                                            <div className="pl-9 space-y-3 animate-in slide-in-from-left-5">
                                                <div className="flex flex-wrap gap-2">
                                                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className="neo-input justify-start text-left">
                                                                <Calendar className="mr-2 h-4 w-4" />
                                                                {formData.expectedReturnDate ? format(formData.expectedReturnDate, "dd/MM/yyyy") : "Data"}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 neo-card" align="start">
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
                                                            className="text-center w-14 neo-input"
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
                                                            className="text-center w-14 neo-input"
                                                        />
                                                    </div>
                                                </div>
                                                {formData.expectedReturnDate && (
                                                    <div className="flex items-center gap-2 text-xs p-2 border-2 border-green-500 bg-green-50 dark:bg-green-950/30">
                                                        <Clock className="h-4 w-4 text-green-600" />
                                                        <span className="font-bold">Prazo: {format(formData.expectedReturnDate, "dd/MM/yyyy 'às' HH:mm")}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary */}
                                    <div className="pt-4 border-t-2 border-black/10 dark:border-white/10">
                                        <p className="text-xs font-black uppercase text-muted-foreground mb-3">Resumo do Empréstimo</p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Solicitante:</span>
                                                <span className="font-bold">{formData.studentName || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Finalidade:</span>
                                                <span className="font-bold truncate max-w-[150px]">{formData.purpose || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Dispositivos:</span>
                                                <span className="font-bold">{deviceIds.length}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className={cn(
                                            "w-full h-14 text-lg neo-btn mt-4",
                                            "bg-green-600 hover:bg-green-700 text-white border-black dark:border-white",
                                            "disabled:opacity-50 disabled:cursor-not-allowed"
                                        )}
                                        disabled={loading || !isDevicesAdded || !isUserSelected || !isPurposeDefined}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                                PROCESSANDO...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-6 w-6" />
                                                CONFIRMAR ({deviceIds.length})
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </LoanStepSlide>
                        </div>
                    </div>
                </div>

                {/* Desktop Navigation Arrows */}
                <div className="hidden md:flex justify-between items-center mt-4 px-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => emblaApi?.scrollPrev()}
                        disabled={currentStep === 1}
                        className="neo-btn"
                    >
                        <ChevronLeft className="h-5 w-5 mr-2" />
                        Anterior
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => emblaApi?.scrollNext()}
                        disabled={currentStep === 4}
                        className="neo-btn"
                    >
                        Próximo
                        <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                </div>
            </form>

            {/* Mobile Status Bar */}
            <LoanStatusBar
                currentStep={currentStep}
                isUserSelected={isUserSelected}
                isPurposeDefined={isPurposeDefined}
                isDevicesAdded={isDevicesAdded}
                onStepClick={scrollToStep}
            />

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
