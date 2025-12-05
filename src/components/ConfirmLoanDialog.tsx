import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, BookOpen, Computer, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConfirmLoanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: {
        studentName: string;
        email: string;
        purpose: string;
        notes?: string;
        expectedReturnDate?: Date;
    };
    deviceIds: string[];
    hasReturnDeadline: boolean;
    onConfirm: () => void;
    loading?: boolean;
}

export function ConfirmLoanDialog({
    open,
    onOpenChange,
    formData,
    deviceIds,
    hasReturnDeadline,
    onConfirm,
    loading = false
}: ConfirmLoanDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CheckCircle className="h-5 w-5 text-violet-500" />
                        Confirmar Empréstimo
                    </DialogTitle>
                    <DialogDescription>
                        Revise os dados antes de confirmar o empréstimo
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {/* Solicitante */}
                    <div className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
                        <User className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{formData.studentName}</p>
                            <p className="text-xs text-muted-foreground truncate">{formData.email}</p>
                        </div>
                    </div>

                    {/* Finalidade */}
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Finalidade</p>
                            <p className="text-sm break-words">{formData.purpose}</p>
                        </div>
                    </div>

                    {/* Dispositivos */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Computer className="h-5 w-5 text-amber-500" />
                            <p className="font-medium text-sm">
                                {deviceIds.length} Chromebook{deviceIds.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {deviceIds.map(id => (
                                <Badge key={id} variant="secondary" className="text-xs">
                                    {id}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Prazo (se definido) */}
                    {hasReturnDeadline && formData.expectedReturnDate && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                            <Clock className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground">Prazo de Devolução</p>
                                <p className="text-sm font-medium">
                                    {format(formData.expectedReturnDate, "dd/MM/yyyy 'às' HH:mm")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Observações (se houver) */}
                    {formData.notes && formData.notes.trim() && (
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground">Observações</p>
                                <p className="text-sm break-words">{formData.notes}</p>
                            </div>
                        </div>
                    )}
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
                        className={cn(
                            "bg-gradient-to-r from-violet-600 to-violet-500",
                            "hover:from-violet-700 hover:to-violet-600"
                        )}
                    >
                        {loading ? (
                            <>Processando...</>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmar Empréstimo
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
