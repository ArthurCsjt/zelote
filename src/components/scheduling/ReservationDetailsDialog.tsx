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
import { useProfileRole } from '@/hooks/use-profile-role';

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
    const { role } = useProfileRole();
    const isManutencao = role === 'manutencao';
    const isMaintRes = reservation.prof_role === 'manutencao' || reservation.prof_email === 'paulo.geremias@colegiosaojudas.com.br' || reservation.prof_email === 'ivo@colegiosaojudas.com.br' || reservation.prof_email === 'manutencao.teste@colegiosaojudas.com.br';

    const showCancel = isAdmin || isOwner;
    const showLoan = !(isManutencao || isMaintRes) && isResponsible && (!reservation.associated_loans || reservation.associated_loans.length < reservation.quantity_requested);
    const showClose = !isOwner && !isAdmin && !isResponsible;


    // Clean up profile names if the user's name in database is recorded as an email address (avoids duplicates)
    const getFormattedProfile = () => {
        const rawName = reservation.prof_name || '';
        const email = reservation.prof_email || '';
        
        const isNameEmail = rawName.includes('@') || rawName.toLowerCase() === email.toLowerCase();
        
        if (isNameEmail) {
            const usernamePart = (rawName || email).split('@')[0];
            const cleanName = usernamePart
                .replace(/[\._-]/g, ' ')
                .toUpperCase()
                .trim();
                
            return {
                name: cleanName || rawName,
                email: email.toLowerCase(),
                showEmail: !!email && cleanName.toLowerCase() !== email.toLowerCase()
            };
        }
        
        return {
            name: rawName,
            email: email.toLowerCase(),
            showEmail: !!email && rawName.toLowerCase() !== email.toLowerCase()
        };
    };

    const profile = getFormattedProfile();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[94vw] sm:w-full sm:max-w-[500px] border-4 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_#000] sm:shadow-[8px_8px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] sm:dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] bg-background p-0 max-h-[95vh] overflow-y-auto outline-none">

                <DialogHeader className={cn(
                    "p-3 sm:p-4 border-b-4 border-black dark:border-white space-y-0 relative",
                    isMaintRes ? "bg-[#FF8C00]" : "bg-blue-500"
                )}>
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 border-4 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_0px_#000] shrink-0">
                            <Info className={cn("h-5 w-5", isMaintRes ? "text-[#FF8C00]" : "text-blue-600")} />
                        </div>
                        <div className="flex flex-col">
                            <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white drop-shadow-[2px_2px_0_#000] leading-none">
                                {isMaintRes ? "Manutenção do Espaço" : "Detalhes da Reserva"}
                            </DialogTitle>
                            <div className="mt-1 flex items-center">
                                <span className="bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} · {reservation.time_slot}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all z-20"
                    >
                        <CloseIcon className="w-5 h-5 text-black stroke-[3]" />
                    </button>
                </DialogHeader>

                <div className="p-4 space-y-4 bg-white dark:bg-zinc-950">
                    {/* User & Quantity Card */}
                    <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 -rotate-12 translate-x-8 -translate-y-8",
                            isMaintRes ? "bg-amber-500/5" : "bg-blue-500/5"
                        )} />

                        <div className="flex flex-col gap-4 relative z-10 w-full">
                            {/* User Profile Row (Centered & Balanced) */}
                            <div className="flex flex-col items-center text-center gap-2 w-full">
                                <div className={cn(
                                    "w-11 h-11 sm:w-12 sm:h-12 rounded-none border-4 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]",
                                    isMaintRes ? "bg-amber-100" : "bg-blue-100"
                                )}>
                                    <User className={cn("h-6 w-6 sm:h-7 w-7", isMaintRes ? "text-[#FF8C00]" : "text-blue-600")} />
                                </div>
                                <div className="space-y-0.5 w-full">
                                    <p className="font-black text-sm sm:text-base uppercase leading-tight tracking-tight break-words text-zinc-900 dark:text-zinc-50 px-2" title={profile.name}>
                                        {profile.name}
                                    </p>
                                    {profile.showEmail && (
                                        <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground break-all px-2" title={profile.email}>
                                            {profile.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="border-t-2 border-dashed border-black/20 dark:border-white/20 my-0.5" />

                            {/* Quantity & Location Twin Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                {/* Chromebooks Card */}
                                {!(isManutencao || isMaintRes) && (
                                    <div className="border-4 border-black dark:border-white bg-black dark:bg-zinc-950 p-3 shadow-[3px_3px_0px_0px_#3b82f6] flex flex-col justify-between min-h-[75px] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#3b82f6] transition-all duration-200">
                                        <span className="text-[8px] sm:text-[9px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1">
                                            💻 UNIDADES REQUISITADAS
                                        </span>
                                        <div className="mt-1 flex items-baseline gap-1.5 text-white">
                                            <span className="text-2xl sm:text-3xl font-[1000] leading-none tracking-tight">
                                                {reservation.quantity_requested}
                                            </span>
                                            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-blue-400 font-black">
                                                CHROMEBOOKS
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Location Card */}
                                <div className={cn(
                                    "border-4 border-black dark:border-white bg-amber-400 p-3 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] flex flex-col justify-between min-h-[75px] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.25)] transition-all duration-200",
                                    (isManutencao || isMaintRes) ? "col-span-1 sm:col-span-2" : ""
                                )}>
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-black/60 tracking-wider flex items-center gap-1">
                                        🏫 LOCAL DE AULA
                                    </span>
                                    <div className="mt-1 flex items-center justify-between gap-2 text-black">
                                        <span className="text-base sm:text-lg font-[1000] leading-none tracking-tight uppercase truncate" title={reservation.classroom || "NÃO DEFINIDA"}>
                                            {reservation.classroom || "NÃO DEFINIDA"}
                                        </span>
                                        {reservation.is_minecraft && (
                                            <span className="bg-[#3c8527] text-white border-2 border-black text-[8px] font-[1000] px-1.5 py-0.5 shadow-[1px_1px_0_0_#000] flex items-center gap-0.5 shrink-0 uppercase tracking-widest">
                                                🎮 MC
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Justification Box (at the bottom) */}
                            {reservation.justification && (
                                <div className="relative group mt-1">
                                    <div className={cn(
                                        "absolute -top-3 left-4 text-white px-2.5 py-0.5 border-2 border-black text-[8px] font-[1000] uppercase tracking-[0.2em] z-10 shadow-[2px_2px_0px_0px_#000]",
                                        isMaintRes ? "bg-[#FF8C00]" : "bg-blue-600"
                                    )}>
                                        {isMaintRes ? "Motivo do Serviço" : "Justificativa"}
                                    </div>
                                    <div className={cn(
                                        "py-2.5 px-3.5 border-[3px] transition-all duration-300",
                                        "bg-white dark:bg-zinc-900 border-black dark:border-white",
                                        isMaintRes ? "shadow-[4px_4px_0px_0px_#FF8C00]" : "shadow-[4px_4px_0px_0px_#3b82f6] dark:shadow-[4px_4px_0px_0px_rgba(59,130,246,0.3)]"
                                    )}>
                                        <p className="text-xs sm:text-sm font-black leading-relaxed text-zinc-800 dark:text-zinc-100 italic">
                                            "{reservation.justification}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resources & Status Row */}
                    {(reservation.needs_tv || reservation.needs_sound || reservation.needs_mic || (!isManutencao && reservation.associated_loans && reservation.associated_loans.length > 0)) && (
                        <div className={cn(
                            "grid gap-3",
                            (reservation.needs_tv || reservation.needs_sound || reservation.needs_mic) && (!isManutencao && reservation.associated_loans && reservation.associated_loans.length > 0) 
                                ? "grid-cols-1 sm:grid-cols-2" 
                                : "grid-cols-1"
                        )}>
                            {/* Extra Resources */}
                            {(reservation.needs_tv || reservation.needs_sound || reservation.needs_mic) && (
                                <div className="border-4 border-black dark:border-white bg-amber-50 dark:bg-amber-900/10 p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                                    <p className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                                        <Plus className="h-3 w-3" /> Recursos Extras
                                    </p>
                                    <div className="space-y-1">
                                        {reservation.needs_tv && (
                                            <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                                                <Tv className="h-3.5 w-3.5 text-amber-600" /> TV
                                            </div>
                                        )}
                                        {reservation.needs_sound && (
                                            <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                                                <Volume2 className="h-3.5 w-3.5 text-amber-600" /> SOM
                                            </div>
                                        )}
                                        {reservation.needs_mic && (
                                            <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                                                <Mic className="h-3.5 w-3.5 text-amber-600" /> {reservation.mic_quantity} MIC
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Loans Status */}
                            {!isManutencao && reservation.associated_loans && reservation.associated_loans.length > 0 && (
                                <div className="border-4 border-black dark:border-white bg-blue-50 dark:bg-blue-900/10 p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                                    <p className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                                        <Monitor className="h-3.5 w-3.5" /> Retirados ({reservation.associated_loans.length})
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {reservation.associated_loans.map((loan, idx) => (
                                            <span key={idx} className="bg-blue-600 text-white border border-black font-black text-[9px] px-1.5 py-0.5 shadow-[1px_1px_0_0_#000]">
                                                {loan.chromebook_id}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t-4 border-black dark:border-white grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {showCancel && (
                        <Button
                            variant="destructive"
                            className={cn(
                                "h-11 w-full text-xs sm:text-sm font-black uppercase border-4 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none gap-2",
                                !showLoan && "sm:col-span-2"
                            )}
                            onClick={onCancel}
                        >
                            <Trash2 className="h-4.5 w-4.5" />
                            Cancelar Reserva
                        </Button>
                    )}

                    {showLoan && (
                        <Button
                            className={cn(
                                "h-11 w-full text-xs sm:text-sm font-black uppercase bg-green-500 hover:bg-green-600 text-white border-4 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none gap-2",
                                !showCancel && "sm:col-span-2"
                            )}
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
                            <ArrowRight className="h-4.5 w-4.5" />
                            Iniciar Empréstimo
                        </Button>
                    )}

                    {showClose && (
                        <Button
                            variant="outline"
                            className="h-11 w-full sm:col-span-2 text-xs sm:text-sm font-black uppercase border-4 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none bg-white dark:bg-zinc-800 dark:text-zinc-100"
                            onClick={() => onOpenChange(false)}
                        >
                            Fechar
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
