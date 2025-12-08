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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] p-0 gap-0 bg-white dark:bg-zinc-900 sm:rounded-none">
                <DialogHeader className="p-6 border-b-4 border-black dark:border-white bg-amber-300 dark:bg-amber-600">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight text-black dark:text-white">
                        <RotateCcw className="h-8 w-8" />
                        Confirmar Devolução
                    </DialogTitle>
                    <DialogDescription className="text-black/80 dark:text-white/80 font-bold uppercase">
                        Revise os dados antes de finalizar
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 p-6">
                    {/* Solicitante da Devolução */}
                    <div className="flex items-start gap-3 p-3 neo-card border-none shadow-none bg-amber-100 dark:bg-amber-900/30 border-l-4 border-l-amber-600">
                        <User className="h-6 w-6 text-black dark:text-white mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase text-muted-foreground">Devolvido por</p>
                            <p className="font-black text-sm uppercase truncate">{returnData.name}</p>
                            <p className="text-xs font-mono truncate">{returnData.email}</p>
                        </div>
                    </div>

                    {/* Resumo dos Dispositivos */}
                    <div className="p-3 neo-card border-none shadow-none bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-600">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Computer className="h-6 w-6 text-black dark:text-white" />
                                <p className="font-black text-sm uppercase">
                                    {deviceIds.length} Dispositivo{deviceIds.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {overdueCount > 0 && (
                                <Badge variant="destructive" className="animate-pulse rounded-none border-2 border-black font-bold uppercase">
                                    {overdueCount} atrasado{overdueCount !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>

                        {/* Lista de dispositivos com detalhes */}
                        <div className="space-y-2 mt-3">
                            {deviceIds.map(id => {
                                const loan = loanDetails.get(id);
                                if (!loan) return null;

                                const overdue = isOverdue(loan.expected_return_date);
                                const overdueDays = overdue ? calculateOverdueDays(loan.expected_return_date!) : 0;

                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            "p-2 border-2 border-black dark:border-white text-xs bg-white dark:bg-zinc-800",
                                            overdue && "bg-red-50 dark:bg-red-900/20"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black uppercase">{id}</p>
                                                <p className="text-muted-foreground truncate font-bold uppercase text-[10px]">
                                                    {loan.student_name}
                                                </p>
                                                <p className="text-muted-foreground mt-1 font-mono text-[10px]">
                                                    <BookOpen className="h-3 w-3 inline mr-1" />
                                                    {loan.purpose}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-black uppercase text-[10px]">
                                                    {formatDetailedDuration(loan.loan_date)}
                                                </p>
                                                {overdue && (
                                                    <p className="text-red-600 dark:text-red-400 font-bold mt-1 text-[10px] uppercase">
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
                        <div className="mt-3 pt-3 border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-muted-foreground font-bold uppercase">
                            <span>Média: {avgDuration} {avgDuration === 1 ? 'dia' : 'dias'}</span>
                            {overdueCount > 0 && (
                                <span className="text-red-600 dark:text-red-400 font-bold">
                                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                                    {overdueCount} com atraso
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Observações (se houver) */}
                    {returnData.notes && returnData.notes.trim() && (
                        <div className="p-3 neo-card border-none shadow-none bg-gray-100 border-l-4 border-l-gray-600">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Observações</p>
                            <p className="text-sm break-words font-mono">{returnData.notes}</p>
                        </div>
                    )}

                    {/* Alerta de Verificação */}
                    <div className="flex items-start gap-2 p-3 neo-card border-none shadow-none bg-green-100 dark:bg-green-900/30 border-l-4 border-l-green-600">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-xs font-bold uppercase text-muted-foreground">
                            Estado físico do{deviceIds.length > 1 ? 's' : ''} equipamento{deviceIds.length > 1 ? 's' : ''} verificado
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-0 p-6 pt-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="neo-btn bg-white hover:bg-gray-100 text-black border-2 border-black h-12 flex-1"
                    >
                        CANCELAR
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "neo-btn h-12 flex-1",
                            "bg-amber-400 hover:bg-amber-500 text-black border-2 border-black"
                        )}
                    >
                        {loading ? (
                            <>PROCS...</>
                        ) : (
                            <>
                                <RotateCcw className="mr-2 h-5 w-5" />
                                CONFIRMAR
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
