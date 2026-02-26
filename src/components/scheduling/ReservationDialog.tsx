import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Monitor, Info, Save, Tv, Volume2, Mic, User, ListFilter, CalendarDays, X as CloseIcon, ArrowRight, Plus, Minus, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatabase, ReservationData, Reservation } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Calendar as CalendarUI } from '@/components/ui/calendar';

interface ReservationDialogProps {
  children: ReactNode;
  date: Date;
  timeSlot: string;
  totalAvailableChromebooks: number;
  currentReservations: Reservation[];
  onReservationSuccess: () => void;
  maxQuantity: number;
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  children,
  date,
  timeSlot,
  totalAvailableChromebooks,
  currentReservations,
  onReservationSuccess,
  maxQuantity,
}) => {
  useEffect(() => {
    // Add custom animation for room buttons
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes alternate-texts {
        0%, 35% { transform: translateY(0); }
        45%, 85% { transform: translateY(-100%); }
        95%, 100% { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [open, setOpen] = useState(false);
  const { createReservation, bulkCreateReservations, loading: isSaving } = useDatabase();
  const { user } = useAuth();
  const { isAdmin } = useProfileRole();

  const [justification, setJustification] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [needsTv, setNeedsTv] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);
  const [needsMic, setNeedsMic] = useState(false);
  const [micQuantity, setMicQuantity] = useState(1);
  const [isMinecraft, setIsMinecraft] = useState(false);
  const [classroom, setClassroom] = useState<string>('');
  const [extraDates, setExtraDates] = useState<Date[]>([]);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCustomClassroom, setShowCustomClassroom] = useState(false);

  useEffect(() => {
    if (open) {
      setJustification('');
      setQuantity(0);
      setNeedsTv(false);
      setNeedsSound(false);
      setNeedsMic(false);
      setMicQuantity(1);
      setIsMinecraft(false);
      setClassroom('');
      setExtraDates([]);
      setIsMultiMode(false);
      setShowCalendar(false);
      setShowCustomClassroom(false);
    }
  }, [open, maxQuantity]);

  // Reset extra resources when the room is not "Sala Google"
  useEffect(() => {
    if (classroom !== 'Sala Google') {
      setNeedsTv(false);
      setNeedsSound(false);
      setNeedsMic(false);
      setMicQuantity(1);
      setIsMinecraft(false);
    }
  }, [classroom]);

  const isExpired = date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isRoomOccupied = currentReservations.some(res => res.classroom?.toLowerCase() === classroom.trim().toLowerCase());
    if (isRoomOccupied) {
      toast({
        title: "Conflito de Sala",
        description: `A sala "${classroom}" já está reservada para este horário.`,
        variant: "destructive"
      });
      return;
    }

    if (!classroom.trim() || quantity < 0 || quantity > maxQuantity) {
      toast({
        title: "Erro de Validação",
        description: "Preencha a sala.",
        variant: "destructive"
      });
      return;
    }

    const allDates = [date, ...extraDates].map(d => format(d, 'yyyy-MM-dd'));
    const baseData = {
      time_slot: timeSlot,
      justification: justification.trim(),
      quantity_requested: quantity,
      needs_tv: needsTv,
      needs_sound: needsSound,
      needs_mic: needsMic,
      mic_quantity: needsMic ? micQuantity : 0,
      is_minecraft: isMinecraft,
      classroom: classroom.trim(),
    };

    if (isMultiMode && extraDates.length > 0) {
      const result = await bulkCreateReservations(allDates, baseData);
      if (result.success) {
        setOpen(false);
        onReservationSuccess();
      }
    } else {
      const result = await createReservation({
        ...baseData,
        date: format(date, 'yyyy-MM-dd')
      });
      if (result) {
        setOpen(false);
        onReservationSuccess();
      }
    }
  };

  const totalReserved = currentReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
  const available = totalAvailableChromebooks - totalReserved;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => !isExpired && setOpen(true)} className={cn("cursor-pointer", isExpired && "opacity-50 cursor-not-allowed grayscale")}>
        {children}
      </div>

      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto border-[4px] border-black dark:border-zinc-800 rounded-none shadow-[10px_10px_0px_0px_#000] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)] p-0 outline-none bg-white dark:bg-zinc-950 text-black dark:text-zinc-100 selection:bg-yellow-300 selection:text-black">

        {/* HEADER */}
        <DialogHeader className="p-5 sm:p-6 border-b-[5px] border-black bg-[#3b82f6] text-white relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5 border-[3px] border-black shadow-[4px_4px_0_0_#000]">
              <CalendarDays className="h-6 w-6 text-black stroke-[3]" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-2xl sm:text-3xl font-[1000] uppercase tracking-tighter leading-none">AGENDAMENTO</DialogTitle>
              <p className="text-[10px] sm:text-xs font-black uppercase opacity-90 tracking-[0.1em] flex items-center gap-2">
                <span className="bg-black/20 px-1.5 py-0.5 border border-white/30">
                  {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
                <span className="text-yellow-300">•</span>
                <span className="font-black">{timeSlot}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all z-20 group"
          >
            <CloseIcon className="w-6 h-6 text-black stroke-[4] group-hover:rotate-90 transition-transform" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="p-4 sm:p-5 space-y-5">

            {/* STATUS GRID */}
            <div className="grid grid-cols-2 gap-5 pt-2">
              <div className="flex flex-col items-center justify-center p-6 border-[4px] border-black bg-[#00FF00]/10 dark:bg-green-950/20 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] transition-all group">
                <div className="mb-2">
                  <span className="text-[10px] sm:text-[11px] font-[1000] uppercase text-black dark:text-white tracking-widest">Disponíveis</span>
                </div>
                <div className="flex items-center gap-3">
                  <Monitor className="h-6 w-6 text-green-600 dark:text-[#4ADE80] stroke-[3]" />
                  <span className="text-4xl sm:text-5xl font-[1000] text-black dark:text-white leading-none tracking-tighter">{available}</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border-[4px] border-black bg-[#8B5CF6]/10 dark:bg-purple-950/20 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] transition-all group">
                <div className="mb-2">
                  <span className="text-[10px] sm:text-[11px] font-[1000] uppercase text-black dark:text-white tracking-widest">Reservados</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-purple-600 dark:text-[#8B5CF6] stroke-[3]" />
                  <span className="text-4xl sm:text-5xl font-[1000] text-black dark:text-white leading-none tracking-tighter">{totalReserved}</span>
                </div>
              </div>
            </div>


            {/* RESERVAS EXISTENTES */}
            {currentReservations.length > 0 && (
              <div className="pt-5 border-t-[5px] border-black space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="inline-block px-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ListFilter className="h-5 w-5 text-black dark:text-white stroke-[3]" />
                    <span className="text-xs sm:text-sm font-[1000] uppercase text-black dark:text-white tracking-widest">Reservas Existentes ({currentReservations.length})</span>
                  </div>
                  <div className="h-1.5 bg-black dark:bg-white w-full" />
                </div>

                <div className="space-y-4 pt-1">
                  {currentReservations.map((res) => (
                    <div
                      key={res.id}
                      className="border-[3px] border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000]"
                    >
                      <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b-[3px] border-black dark:border-zinc-700">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 flex items-center justify-center bg-white border-[3px] border-black rounded-full shrink-0 shadow-[3px_3px_0_0_#000]">
                            <User className="h-5 w-5 text-black stroke-[3]" />
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-[12px] sm:text-sm font-[1000] uppercase text-black dark:text-white truncate leading-tight">
                              {res.prof_name || 'Professor'}
                            </span>
                            <span className="text-[9px] sm:text-[11px] font-[900] text-zinc-500 dark:text-zinc-400 lowercase truncate opacity-80 tracking-tight">
                              {res.prof_email}
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-[#8B5CF6] text-white border-[3px] border-black rounded-none h-8 text-[10px] font-[1000] uppercase px-3 shadow-[4px_4px_0px_0px_#000] shrink-0 hover:scale-105 active:scale-95 transition-all cursor-default">
                          {res.quantity_requested} Chromebooks
                        </Badge>
                      </div>

                      <div className="p-4 flex flex-col gap-3.5">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#3B82F6] px-2.5 py-1 border-[2px] border-black shadow-[3px_3px_0_0_#000] -rotate-1">
                            <span className="text-[10px] sm:text-[11px] font-[1000] uppercase text-white tracking-widest">Sala / Turma</span>
                          </div>
                          <span className="text-sm sm:text-base font-[1000] text-black dark:text-zinc-100 uppercase tracking-tight">
                            {res.classroom || 'Não informada'}
                          </span>
                        </div>

                        {res.justification && (
                          <div className="flex items-start gap-3 pt-1">
                            <div className="bg-[#FBBF24] px-2.5 py-1 border-[2px] border-black shadow-[3px_3px_0_0_#000] rotate-1 shrink-0">
                              <span className="text-[10px] sm:text-[11px] font-[1000] uppercase text-black tracking-widest">Motivo</span>
                            </div>
                            <p className="text-[12px] sm:text-[13px] font-black italic text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2 mt-0.5">
                              "{res.justification}"
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-1.5">
                          {res.needs_tv && (
                            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 border-2 border-dashed border-black/30 dark:border-white/20">
                              <Tv className="h-4 w-4 text-black dark:text-zinc-300 stroke-[3]" />
                              <span className="text-[9px] font-[1000] uppercase tracking-wider text-black dark:text-zinc-300">TV</span>
                            </div>
                          )}
                          {res.needs_sound && (
                            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 border-2 border-dashed border-black/30 dark:border-white/20">
                              <Volume2 className="h-4 w-4 text-black dark:text-zinc-300 stroke-[3]" />
                              <span className="text-[9px] font-[1000] uppercase tracking-wider text-black dark:text-zinc-300">SOM</span>
                            </div>
                          )}
                          {res.needs_mic && (
                            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 border-2 border-dashed border-black/30 dark:border-white/20">
                              <Mic className="h-4 w-4 text-black dark:text-zinc-300 stroke-[3]" />
                              <span className="text-[9px] font-[1000] uppercase tracking-wider text-black dark:text-zinc-300">MIC ({res.mic_quantity})</span>
                            </div>
                          )}
                          {res.is_minecraft && (
                            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-2 py-1 border-2 border-black">
                              <Monitor className="h-4 w-4 text-green-700 dark:text-[#4ADE80] stroke-[3]" />
                              <span className="text-[9px] font-[1000] uppercase tracking-wider text-green-700 dark:text-[#4ADE80]">MINECRAFT</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOVO AGENDAMENTO DIVIDER */}
            <div className="relative flex items-center py-1">
              <div className="absolute inset-x-0 h-[3px] bg-black" />
              <div className="relative bg-[#a855f7] text-white px-3 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] -rotate-1">
                <span className="text-[11px] sm:text-sm font-black uppercase tracking-wide">+ Novo Agendamento</span>
              </div>
            </div>

            {/* RECORRÊNCIA */}
            <div className="border-2 border-[#1e3a8a] bg-blue-50/30 overflow-hidden shadow-[4px_4px_0_0_rgba(30,58,138,0.15)] relative">
              <div className="bg-[#1e3a8a] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-white" />
                  <span className="text-[11px] sm:text-[13px] font-black uppercase text-white tracking-wider">Múltiplas Datas</span>
                </div>
                <span className="bg-white/20 border border-white/50 px-2 py-0.5 text-white text-[8px] sm:text-[9px] font-black uppercase">Recorrência</span>
              </div>

              <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-[11px] sm:text-[13px] font-bold text-zinc-700 dark:text-zinc-300 leading-snug max-w-[280px]">
                    Economize tempo reservando o mesmo horário para outros dias.
                  </p>

                  <div className="flex border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.1)] self-start sm:self-center overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsMultiMode(false)}
                      className={cn(
                        "px-4 sm:px-6 py-2 text-[11px] sm:text-[13px] font-black uppercase transition-all",
                        !isMultiMode ? "bg-zinc-800 text-white dark:bg-zinc-700" : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white"
                      )}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMultiMode(true)}
                      className={cn(
                        "px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-black uppercase transition-all border-l-2 border-black dark:border-zinc-700",
                        isMultiMode ? "bg-[#1e3a8a] text-white" : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white"
                      )}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {isMultiMode && (
                  <div className="mt-4 pt-4 border-t-2 border-blue-200 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#1e3a8a] mb-2.5 block">Selecione os dias:</Label>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-950 text-white text-[12px] sm:text-[13px] font-black uppercase border-2 border-black shadow-[3px_3px_0_0_#000]">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(date, 'dd/MM')}
                        <span className="text-blue-300 text-[10px] sm:text-[11px] font-bold">(atual)</span>
                      </div>
                      {extraDates.map((d, i) => (
                        <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1e40af] text-white text-[12px] sm:text-[13px] font-black uppercase border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(d, 'dd/MM')}
                          <CloseIcon className="h-3.5 w-3.5 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity" onClick={() => setExtraDates(extraDates.filter((_, idx) => idx !== i))} />
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="h-auto py-1.5 px-3 bg-white dark:bg-zinc-900 text-[#1e3a8a] dark:text-blue-400 border-2 border-dashed border-[#1e3a8a] dark:border-blue-700 text-[11px] sm:text-[12px] font-black uppercase hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-solid rounded-none flex items-center gap-1.5 transition-all shadow-[2px_2px_0_0_rgba(30,58,138,0.1)]"
                      >
                        <CalendarDays className="h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                    {showCalendar && (
                      <div className="mt-3 border-2 border-black dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.05)]">
                        <CalendarUI
                          mode="multiple"
                          selected={extraDates}
                          onSelect={(dates) => setExtraDates(dates || [])}
                          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')}
                          className="rounded-none w-full"
                          locale={ptBR}
                          classNames={{
                            day_selected: "bg-[#1e3a8a] text-white hover:bg-[#1e40af] hover:text-white focus:bg-[#1e3a8a] focus:text-white rounded-none border-2 border-black shadow-[3px_3px_0_0_#000]",
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => setShowCalendar(false)}
                          className="w-full mt-6 bg-[#1e3a8a] text-white h-12 text-xs font-black uppercase rounded-none border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                        >
                          Confirmar Datas
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* DADOS DA RESERVA */}
            <div className="border-2 border-[#a855f7] bg-purple-50/30 dark:bg-purple-950/10 overflow-hidden shadow-[4px_4px_0_0_rgba(168,85,247,0.15)]">
              <div className="bg-[#a855f7] px-3 py-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-white" />
                <span className="text-[11px] sm:text-[13px] font-black uppercase text-white tracking-wider">Dados da Reserva</span>
              </div>
              <div className="p-3 sm:p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-[11px] sm:text-xs font-black uppercase text-[#a855f7] dark:text-purple-400 tracking-wider">Sala / Turma <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Sala Google', 'Sala Maker', 'Sala de Estudos', 'Sala de Artes'].map((s) => {
                      const isOccupied = currentReservations.some(res => res.classroom === s);
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => { setClassroom(s); setShowCustomClassroom(false); }}
                          className={cn(
                            "px-2 sm:px-2.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-black border-2 border-black uppercase transition-all relative overflow-hidden min-h-[36px] min-w-[90px] flex items-center justify-center bg-white dark:bg-zinc-900",
                            classroom === s && !showCustomClassroom
                              ? "bg-[#1e3a8a] text-white shadow-[2px_2px_0_0_#000] translate-x-[1px] translate-y-[1px] shadow-none"
                              : isOccupied
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-300 dark:border-zinc-700 cursor-not-allowed"
                                : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.1)]"
                          )}
                        >
                          {isOccupied ? (
                            <div className="h-5 overflow-hidden w-full relative">
                              <div className="flex flex-col h-full animate-[alternate-texts_4s_infinite_cubic-bezier(0.7,0,0.3,1)]">
                                <span className="h-5 flex items-center justify-center shrink-0 text-zinc-400 dark:text-zinc-600">
                                  {s}
                                </span>
                                <div className="h-5 flex items-center justify-center shrink-0">
                                  <span className="bg-[#EF4444] text-white border border-black text-[8px] font-black uppercase shadow-[1px_1px_0_0_#000] px-1.5 py-0.5">
                                    Ocupada
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span>{s}</span>
                          )}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => { setShowCustomClassroom(true); setClassroom(''); }}
                      className={cn(
                        "px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black border-2 border-black dark:border-zinc-800 uppercase transition-all shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.1)]",
                        showCustomClassroom ? "bg-[#1e3a8a] text-white" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                    >
                      +
                    </button>
                  </div>
                  {showCustomClassroom && (
                    <Input
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      placeholder="Nome da sala ou turma..."
                      className="border-2 border-black rounded-none h-8 mt-2 text-xs font-bold focus-visible:ring-0 focus-visible:border-[#a855f7]"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] sm:text-xs font-black uppercase text-[#a855f7] dark:text-purple-400 tracking-wider">Justificativa / Motivo (Opcional)</Label>
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Ex: Aula sobre Segunda Guerra Mundial"
                    className="border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none min-h-[70px] text-xs sm:text-sm resize-none focus-visible:ring-0 focus-visible:border-[#a855f7] dark:focus-visible:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* QUANTIDADE / RESERVA DE ESPAÇO */}
            <div className="border-2 border-[#1e3a8a] bg-blue-50/30 dark:bg-blue-950/10 overflow-hidden shadow-[4px_4px_0_0_rgba(30,58,138,0.15)]">
              <div className="bg-[#1e3a8a] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className={cn("h-4 w-5 text-white", quantity === 0 && "opacity-50")} />
                  <span className="text-[13px] sm:text-[15px] font-black uppercase text-white tracking-wider">
                    Quantidade de Chromebooks
                  </span>
                </div>
                {quantity > 0 && (
                  <div className="bg-white/20 border-2 border-white/50 px-3 py-1 text-white text-sm sm:text-base font-black leading-none">
                    {quantity}
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5">
                <Slider value={[quantity]} onValueChange={(v) => setQuantity(v[0])} min={0} max={maxQuantity} step={1} className="py-2" />
                <div className="flex justify-between mt-2 text-[12px] sm:text-[13px] font-black uppercase text-[#1e3a8a] dark:text-blue-400">
                  <span>Mín: 0</span>
                  <span>Máx: {maxQuantity}</span>
                </div>
                {quantity === 0 ? (
                  <div className="mt-4 p-3 bg-[#1e3a8a] border-2 border-black flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-white p-1 rounded-sm">
                      <CheckCircle className="h-4 w-4 text-[#1e3a8a]" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] font-black uppercase text-white tracking-widest leading-none">Apenas reserva do espaço físico</span>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-[#a855f7] border-2 border-black flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-white p-1 rounded-sm">
                      <Monitor className="h-4 w-4 text-[#a855f7]" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] font-black uppercase text-white tracking-widest leading-none">Espaço + {quantity} Chromebooks</span>
                  </div>
                )}
              </div>
            </div>

            {/* RECURSOS EXTRAS - Apenas para Sala Google */}
            {classroom === 'Sala Google' && (
              <div className="border-2 border-[#3b82f6] bg-blue-50/30 dark:bg-blue-950/20 overflow-hidden shadow-[4px_4px_0_0_rgba(59,130,246,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-[#3b82f6] px-3 py-2 flex items-center gap-2">
                  <Tv className="h-4 w-4 text-white" />
                  <span className="text-[11px] sm:text-[13px] font-black uppercase text-white tracking-wider">Recursos Extras</span>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* TV */}
                    <div
                      onClick={() => setNeedsTv(!needsTv)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 border-2 border-black dark:border-zinc-800 cursor-pointer transition-all",
                        needsTv ? "bg-black dark:bg-blue-600 text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)]"
                      )}
                    >
                      <Tv className={cn("h-4 w-4", needsTv ? "text-white" : "text-black dark:text-zinc-400")} />
                      <span className="text-[11px] sm:text-[13px] font-black uppercase">TV</span>
                    </div>

                    {/* SOM */}
                    <div
                      onClick={() => setNeedsSound(!needsSound)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 border-2 border-black dark:border-zinc-800 cursor-pointer transition-all",
                        needsSound ? "bg-black dark:bg-blue-600 text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)]"
                      )}
                    >
                      <Volume2 className={cn("h-4 w-4", needsSound ? "text-white" : "text-black dark:text-zinc-400")} />
                      <span className="text-[11px] sm:text-[13px] font-black uppercase">Som</span>
                    </div>

                    {/* MIC */}
                    <div
                      onClick={() => setNeedsMic(!needsMic)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 border-2 border-black dark:border-zinc-800 cursor-pointer transition-all min-h-[50px]",
                        needsMic ? "bg-black dark:bg-blue-600 text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)]"
                      )}
                    >
                      <Mic className={cn("h-4 w-4", needsMic ? "text-white" : "text-black dark:text-zinc-400")} />
                      <span className="text-[11px] sm:text-[13px] font-black uppercase">Mic</span>

                      {needsMic && (
                        <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setMicQuantity(Math.max(1, micQuantity - 1))}
                            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-800 text-black dark:text-white border-2 border-black dark:border-white/20 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-[2px_2px_0_0_#000] dark:shadow-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center text-xs sm:text-sm font-black text-white">{micQuantity}</span>
                          <button
                            type="button"
                            onClick={() => setMicQuantity(micQuantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-800 text-black dark:text-white border-2 border-black dark:border-white/20 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-[2px_2px_0_0_#000] dark:shadow-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* MINECRAFT */}
                    <div
                      onClick={() => setIsMinecraft(!isMinecraft)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 border-2 border-green-600 dark:border-green-500 cursor-pointer transition-all",
                        isMinecraft ? "bg-[#22c55e] text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)]"
                      )}
                    >
                      <Monitor className={cn("h-4 w-4", isMinecraft ? "text-white" : "text-black dark:text-zinc-400")} />
                      <div className="flex flex-col">
                        <span className="text-[11px] sm:text-[13px] font-black uppercase leading-none">Minecraft</span>
                        <span className="text-[9px] font-black uppercase opacity-60 dark:opacity-80">TI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </form>

        {/* FOOTER */}
        <DialogFooter className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-900/50 border-t-4 border-black dark:border-zinc-800 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto sm:flex-1 h-10 sm:h-11 font-black uppercase border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-black dark:text-zinc-100 rounded-none shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)] text-xs sm:text-sm order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !classroom.trim() || quantity < 0}
            onClick={handleSubmit}
            className="w-full sm:w-auto sm:flex-[2] h-10 sm:h-11 font-black uppercase bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-2 border-black rounded-none shadow-[3px_3px_0_0_#000] text-xs sm:text-sm disabled:opacity-50 order-1 sm:order-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Reserva"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
