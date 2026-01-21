import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Monitor,
    User,
    Info,
    Trash2,
    ArrowRight,
    Tv,
    Volume2,
    Mic,
    Plus,
    X as CloseIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Reservation } from '@/hooks/useDatabase';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ReservationDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: Reservation;
    date: Date;
    onCancel: () => void;
    isResponsible: boolean;
    isOwner: boolean;
    isAdmin: boolean;
}

export const ReservationDetailsDialog: React.FC<ReservationDetailsDialogProps> = ({
    open,
    onOpenChange,
    reservation,
    date,
    onCancel,
    isResponsible,
    isOwner,
    isAdmin,
}) => {
    const navigate = useNavigate();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-4 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] bg-background p-0 overflow-hidden outline-none">

                <DialogHeader className="p-6 border-b-4 border-black dark:border-white bg-blue-500 space-y-0">
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 border-4 border-black bg-white flex items-center justify-center shadow-[4px_4px_0px_0px_#000] shrink-0">
                            <Info className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white drop-shadow-[2px_2px_0_#000] leading-none">
                                Detalhes da Reserva
                            </DialogTitle>
                            <div className="mt-1.5 flex items-center">
                                <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} · {reservation.time_slot}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all z-20"
                    >
                        <CloseIcon className="w-5 h-5 text-black stroke-[3]" />
                    </button>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-white dark:bg-zinc-950">
                    {/* User & Quantity Card */}
                    <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -rotate-12 translate-x-8 -translate-y-8" />

                        <div className="grid grid-cols-[1fr_auto] gap-4 items-start relative z-10">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-14 h-14 rounded-none border-4 border-black bg-blue-100 flex items-center justify-center shrink-0">
                                    <User className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="font-black text-xl uppercase leading-none tracking-tight truncate">{reservation.prof_name}</p>
                                    <p className="text-xs font-bold text-muted-foreground truncate">{reservation.prof_email}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-1 tracking-wider whitespace-nowrap">Unidades Requisitadas</span>
                                <div className="bg-black text-white px-4 py-2 border-4 border-black font-black text-2xl shadow-[4px_4px_0px_0px_#3b82f6] leading-none flex items-baseline gap-2 whitespace-nowrap">
                                    {reservation.quantity_requested}
                                    <span className="text-[10px] uppercase tracking-widest text-blue-400">CHROMEBOOKS</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4 relative z-10">
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border-l-8 border-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                                <p className={cn(
                                    "text-base font-bold leading-tight",
                                    reservation.justification ? "italic text-foreground" : "text-muted-foreground opacity-50 uppercase text-xs tracking-widest not-italic"
                                )}>
                                    {reservation.justification ? `"${reservation.justification}"` : "Sem justificativa informada"}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {reservation.classroom && (
                                    <Badge className="bg-amber-400 hover:bg-amber-400 text-black border-2 border-black rounded-none font-black uppercase text-[10px] py-1 shadow-[2px_2px_0_0_#000]">
                                        🏫 SALA: {reservation.classroom}
                                    </Badge>
                                )}
                                {reservation.is_minecraft && (
                                    <Badge className="bg-[#3c8527] hover:bg-[#3c8527] text-white border-2 border-black rounded-none font-black uppercase text-[10px] py-1 shadow-[2px_2px_0_0_#000] flex items-center gap-1">
                                        🎮 MINECRAFT
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resources & Status Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Extra Resources */}
                        {(reservation.needs_tv || reservation.needs_sound || reservation.needs_mic) ? (
                            <div className="border-4 border-black dark:border-white bg-amber-50 dark:bg-amber-900/10 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                                <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Recursos Extras
                                </p>
                                <div className="space-y-1.5">
                                    {reservation.needs_tv && (
                                        <div className="flex items-center gap-2 text-xs font-black uppercase">
                                            <Tv className="h-4 w-4 text-amber-600" /> TV
                                        </div>
                                    )}
                                    {reservation.needs_sound && (
                                        <div className="flex items-center gap-2 text-xs font-black uppercase">
                                            <Volume2 className="h-4 w-4 text-amber-600" /> SOM
                                        </div>
                                    )}
                                    {reservation.needs_mic && (
                                        <div className="flex items-center gap-2 text-xs font-black uppercase">
                                            <Mic className="h-4 w-4 text-amber-600" /> {reservation.mic_quantity} MIC
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="border-4 border-dashed border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-center opacity-40">
                                <p className="text-[10px] font-black uppercase text-zinc-400">Sem itens extras</p>
                            </div>
                        )}

                        {/* Loans Status */}
                        {reservation.associated_loans && reservation.associated_loans.length > 0 ? (
                            <div className="border-4 border-black dark:border-white bg-blue-50 dark:bg-blue-900/10 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                                <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                                    <Monitor className="h-4 w-4" /> Retirados ({reservation.associated_loans.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {reservation.associated_loans.map((loan, idx) => (
                                        <span key={idx} className="bg-blue-600 text-white border border-black font-black text-[9px] px-1.5 py-0.5 shadow-[1px_1px_0_0_#000]">
                                            {loan.chromebook_id}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="border-4 border-dashed border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-center opacity-40">
                                <p className="text-[10px] font-black uppercase text-zinc-400">Nada retirado ainda</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t-4 border-black dark:border-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(isAdmin || isOwner) ? (
                        <Button
                            variant="destructive"
                            className="h-14 w-full text-sm font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none gap-2"
                            onClick={onCancel}
                        >
                            <Trash2 className="h-5 w-5" />
                            Cancelar Reserva
                        </Button>
                    ) : (
                        <div />
                    )}

                    {isResponsible && (!reservation.associated_loans || reservation.associated_loans.length < reservation.quantity_requested) && (
                        <Button
                            className="h-14 w-full text-sm font-black uppercase bg-green-500 hover:bg-green-600 text-white border-4 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none gap-2"
                            onClick={() => {
                                navigate('/', {
                                    state: {
                                        fromScheduling: true,
                                        reservationData: {
                                            ...reservation,
                                            date: format(date, 'yyyy-MM-dd'),
                                            time_slot: reservation.time_slot
                                        }
                                    }
                                });
                                onOpenChange(false);
                            }}
                        >
                            <ArrowRight className="h-5 w-5" />
                            Iniciar Empréstimo
                        </Button>
                    )}

                    {(!isOwner && !isAdmin && !isResponsible) && (
                        <Button
                            variant="outline"
                            className="h-14 w-full sm:col-span-2 text-sm font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none bg-white"
                            onClick={() => onOpenChange(false)}
                        >
                            Fechar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
