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
            <DialogContent className="max-w-md border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] p-0 gap-0 bg-white dark:bg-zinc-900 sm:rounded-none">
                <DialogHeader className="p-6 border-b-4 border-black dark:border-white bg-yellow-300 dark:bg-yellow-600">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight text-black dark:text-white">
                        <CheckCircle className="h-8 w-8" />
                        Confirmar
                    </DialogTitle>
                    <DialogDescription className="text-black/80 dark:text-white/80 font-bold uppercase">
                        Revise os dados antes de finalizar
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 p-6">
                    {/* Solicitante */}
                    <div className="flex items-start gap-3 p-3 neo-card border-none shadow-none bg-violet-100 dark:bg-violet-900/30 border-l-4 border-l-violet-600">
                        <User className="h-6 w-6 text-black dark:text-white mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-sm uppercase truncate">{formData.studentName}</p>
                            <p className="text-xs font-mono truncate">{formData.email}</p>
                        </div>
                    </div>

                    {/* Finalidade */}
                    <div className="flex items-start gap-3 p-3 neo-card border-none shadow-none bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-600">
                        <BookOpen className="h-6 w-6 text-black dark:text-white mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase text-muted-foreground">Finalidade</p>
                            <p className="text-sm break-words font-medium">{formData.purpose}</p>
                        </div>
                    </div>

                    {/* Dispositivos */}
                    <div className="p-3 neo-card border-none shadow-none bg-amber-100 dark:bg-amber-900/30 border-l-4 border-l-amber-600">
                        <div className="flex items-center gap-2 mb-2">
                            <Computer className="h-6 w-6 text-black dark:text-white" />
                            <p className="font-black text-sm uppercase">
                                {deviceIds.length} Chromebook{deviceIds.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {deviceIds.map(id => (
                                <Badge key={id} variant="secondary" className="text-xs rounded-none border-2 border-black bg-white">
                                    {id}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Prazo (se definido) */}
                    {hasReturnDeadline && formData.expectedReturnDate && (
                        <div className="flex items-start gap-3 p-3 neo-card border-none shadow-none bg-green-100 dark:bg-green-900/30 border-l-4 border-l-green-600">
                            <Clock className="h-6 w-6 text-black dark:text-white mt-1 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase text-muted-foreground">Prazo de Devolução</p>
                                <p className="text-sm font-black text-green-700 dark:text-green-300">
                                    {format(formData.expectedReturnDate, "dd/MM/yyyy 'às' HH:mm")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Observações (se houver) */}
                    {formData.notes && formData.notes.trim() && (
                        <div className="flex items-start gap-3 p-3 neo-card border-none shadow-none bg-gray-100 border-l-4 border-l-gray-600">
                            <MessageSquare className="h-6 w-6 text-black mt-1 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase text-muted-foreground">Observações</p>
                                <p className="text-sm break-words font-mono">{formData.notes}</p>
                            </div>
                        </div>
                    )}
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
                            "bg-black hover:bg-neutral-800 text-white border-2 border-black dark:border-white"
                        )}
                    >
                        {loading ? (
                            <>PROCS...</>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                CONFIRMAR
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
