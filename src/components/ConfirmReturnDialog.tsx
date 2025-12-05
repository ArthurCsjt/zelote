import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, Computer, Clock, CheckCircle, AlertTriangle, RotateCcw, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { LoanHistoryItem } from '@/types/database';
import {
    calculateLoanDuration,
    isOverdue,
    calculateOverdueDays,
    formatDetailedDuration,
    getOverdueStatusMessage
} from '@/utils/loanCalculations';

interface ConfirmReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deviceIds: string[];
    loanDetails: Map<string, LoanHistoryItem>; // Map de chromebookId -> LoanHistoryItem
    returnData: {
        name: string;
        email: string;
        notes?: string;
    };
    onConfirm: () => void;
    loading?: boolean;
}

export function ConfirmReturnDialog({
    open,
    onOpenChange,
    deviceIds,
    loanDetails,
    returnData,
    onConfirm,
    loading = false
}: ConfirmReturnDialogProps) {
    // Calcula estatísticas gerais
    const overdueCount = deviceIds.filter(id => {
        const loan = loanDetails.get(id);
        return loan && isOverdue(loan.expected_return_date);
    }).length;

    const totalDuration = deviceIds.reduce((sum, id) => {
        const loan = loanDetails.get(id);
        if (!loan) return sum;
        return sum + calculateLoanDuration(loan.loan_date);
    }, 0);

    const avgDuration = deviceIds.length > 0 ? Math.round(totalDuration / deviceIds.length) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <RotateCcw className="h-5 w-5 text-amber-500" />
                        Confirmar Devolução
                    </DialogTitle>
                    <DialogDescription>
                        Revise os dados antes de confirmar a devolução
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {/* Solicitante da Devolução */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <User className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Devolvido por</p>
                            <p className="font-semibold text-sm truncate">{returnData.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{returnData.email}</p>
                        </div>
                    </div>

                    {/* Resumo dos Dispositivos */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Computer className="h-5 w-5 text-blue-500" />
                                <p className="font-medium text-sm">
                                    {deviceIds.length} Dispositivo{deviceIds.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {overdueCount > 0 && (
                                <Badge variant="destructive" className="animate-pulse">
                                    {overdueCount} atrasado{overdueCount !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>

                        {/* Lista de dispositivos com detalhes */}
                        <div className="space-y-2 mt-3">
                            {deviceIds.map(id => {
                                const loan = loanDetails.get(id);
                                if (!loan) return null;

                                const duration = calculateLoanDuration(loan.loan_date);
                                const overdue = isOverdue(loan.expected_return_date);
                                const overdueDays = overdue ? calculateOverdueDays(loan.expected_return_date!) : 0;

                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            "p-2 rounded-md border text-xs",
                                            overdue
                                                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                                : "bg-muted/50 border-border"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold">{id}</p>
                                                <p className="text-muted-foreground truncate">
                                                    {loan.student_name}
                                                </p>
                                                <p className="text-muted-foreground mt-1">
                                                    <BookOpen className="h-3 w-3 inline mr-1" />
                                                    {loan.purpose}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-medium">
                                                    {formatDetailedDuration(loan.loan_date)}
                                                </p>
                                                {overdue && (
                                                    <p className="text-destructive font-semibold mt-1">
                                                        +{overdueDays}d atraso
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Estatísticas */}
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Duração média: {avgDuration} {avgDuration === 1 ? 'dia' : 'dias'}</span>
                            {overdueCount > 0 && (
                                <span className="text-destructive font-medium">
                                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                                    {overdueCount} com atraso
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Observações (se houver) */}
                    {returnData.notes && returnData.notes.trim() && (
                        <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                            <p className="text-sm break-words">{returnData.notes}</p>
                        </div>
                    )}

                    {/* Alerta de Verificação */}
                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                            Estado físico do{deviceIds.length > 1 ? 's' : ''} equipamento{deviceIds.length > 1 ? 's' : ''} verificado
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-menu-amber hover:bg-menu-amber-hover"
                    >
                        {loading ? (
                            <>Processando...</>
                        ) : (
                            <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Confirmar Devolução
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
