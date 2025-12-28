import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Monitor, AlertTriangle, Info, Save, Tv, Volume2, Mic, User, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatabase, ReservationData, Reservation } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ListFilter, CalendarDays, X as CloseIcon } from 'lucide-react';
import { addDays, isSameDay } from 'date-fns';

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
  const [open, setOpen] = useState(false);
  const { createReservation, bulkCreateReservations, loading: isSaving } = useDatabase();
  const { user } = useAuth();
  const { isAdmin } = useProfileRole();

  const [justification, setJustification] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [needsTv, setNeedsTv] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);
  const [needsMic, setNeedsMic] = useState(false);
  const [micQuantity, setMicQuantity] = useState(1);
  const [isMinecraft, setIsMinecraft] = useState(false);
  const [classroom, setClassroom] = useState<string>('Sala Google');
  const [extraDates, setExtraDates] = useState<Date[]>([]);
  const [tempExtraDates, setTempExtraDates] = useState<Date[]>([]);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (open) {
      setJustification('');
      setQuantity(Math.min(1, maxQuantity) || 0);
      setNeedsTv(false);
      setNeedsSound(false);
      setNeedsMic(false);
      setMicQuantity(1);
      setIsMinecraft(false);
      setClassroom('Sala Google');
      setExtraDates([]);
      setTempExtraDates([]);
      setIsMultiMode(false);
      setShowCalendar(false);
    }
  }, [open, maxQuantity]);

  const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!justification.trim() || quantity <= 0 || quantity > maxQuantity) {
      toast({
        title: "Erro de Validação",
        description: "Preencha a justificativa e verifique a quantidade solicitada.",
        variant: "destructive"
      });
      return;
    }

    if (isMultiMode && extraDates.length > 0) {
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

      const result = await bulkCreateReservations(allDates, baseData);
      if (result.success) {
        setOpen(false);
        onReservationSuccess();
      }
    } else {
      const reservationData: ReservationData = {
        date: format(date, 'yyyy-MM-dd'),
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

      const result = await createReservation(reservationData);

      if (result) {
        setOpen(false);
        onReservationSuccess();
      }
    }
  };

  const totalReserved = currentReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
  const available = totalAvailableChromebooks - totalReserved;

  if (isPastDate) {
    return <div className="opacity-50 cursor-not-allowed">{children}</div>;
  }

  if (maxQuantity <= 0) {
    return <div className="opacity-80 cursor-not-allowed">{children}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>

      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-4 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] bg-background p-0">

        {/* Premium Neo-Brutal Header */}
        <DialogHeader className="p-4 border-b-4 border-black dark:border-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-3 border-black dark:border-white bg-white flex items-center justify-center shadow-[3px_3px_0_0_#000]">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white drop-shadow-[2px_2px_0_#000]">
                Agendamento
              </DialogTitle>
              <DialogDescription className="text-white/90 font-bold bg-black/20 w-fit px-2 py-0.5 text-[10px] uppercase tracking-widest mt-0.5">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} · {timeSlot}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">

          {/* Status Card - Neo Brutal Compact */}
          <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center gap-2 p-2 border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20">
                <Monitor className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-tight text-muted-foreground leading-none">Disponíveis</p>
                  <p className="text-lg font-black text-green-600 leading-none mt-1">{available}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 p-2 border-2 border-blue-500/30 bg-blue-50 dark:bg-blue-950/20">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-tight text-muted-foreground leading-none">Reservados</p>
                  <p className="text-lg font-black text-blue-600 leading-none mt-1">{totalReserved}</p>
                </div>
              </div>
            </div>
          </div>



          {/* Existing Reservations - Compact Premium */}
          {currentReservations.length > 0 && (
            <div className="mt-2 pt-2 border-t-2 border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Ocupação Atual
                </h3>
                <Badge variant="outline" className="text-[9px] font-black border-2 border-black dark:border-white rounded-none bg-amber-100 dark:bg-amber-900/30">
                  {currentReservations.length} {currentReservations.length === 1 ? 'Reserva' : 'Reservas'}
                </Badge>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {currentReservations.map((res, idx) => {
                  const isMine = res.created_by === user?.id;
                  return (
                    <div key={idx} className={cn(
                      "relative flex flex-col gap-1.5 p-2.5 border-3 transition-all",
                      isMine
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20 shadow-[3px_3px_0px_0px_rgba(139,92,246,0.3)]"
                        : "border-gray-400 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]",
                      res.is_minecraft && "border-green-600 bg-green-50 dark:bg-green-950/20 shadow-[3px_3px_0px_0px_rgba(22,163,74,0.3)]"
                    )}>
                      {isMine && (
                        <div className="absolute -top-1.5 -right-1 bg-violet-600 text-white text-[8px] font-black uppercase px-2 py-0.5 border-2 border-black">
                          Sua Reserva
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-black text-[10px] text-foreground uppercase tracking-tight truncate max-w-[70%]">
                          <User className={cn("h-3 w-3", isMine ? "text-violet-600" : "text-gray-500")} />
                          {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email || 'Docente')}
                        </span>
                        <span className="font-black text-xs text-foreground flex items-center gap-1.5 px-2 py-0.5 bg-background border-2 border-black dark:border-white">
                          <Monitor className="h-3 w-3" />
                          {res.quantity_requested}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {res.classroom && (
                          <div className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-blue-500 text-white border border-black">
                            {res.classroom}
                          </div>
                        )}
                        <div className="flex-1 text-[9px] font-bold text-muted-foreground italic truncate">
                          "{res.justification}"
                        </div>
                      </div>

                      {res.is_minecraft && (
                        <div className="text-[8px] font-black uppercase text-white bg-green-600 w-fit px-1.5 py-0.5 border border-black mt-0.5">
                          MINECRAFT
                        </div>
                      )}

                      {res.associated_loans && res.associated_loans.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
                          <span className="text-[7px] font-black uppercase text-blue-600 dark:text-blue-400 w-full mb-0.5">Equipamentos Retirados:</span>
                          {res.associated_loans.map((loan, lIdx) => (
                            <div key={lIdx} className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1">
                              <Monitor className="h-2 w-2" />
                              {loan.chromebook_id}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="p-3 border-2 border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 rounded-none flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 leading-tight uppercase">
                Você está criando uma nova reserva. Reservas de outros professores são apenas para consulta.
              </p>
            </div>
          )}

          {/* SECTION: NEW RESERVATION FORM */}
          <div className="mt-8 pt-6 border-t-[6px] border-black dark:border-white relative">
            <div className="absolute -top-[22px] left-4 bg-violet-600 text-white border-4 border-black px-4 py-1 shadow-[4px_4px_0px_0px_#000] flex items-center gap-2">
              <Plus className="h-5 w-5 font-black" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Novo Agendamento</h3>
            </div>

            {/* MODO DE AGENDAMENTO (MOVIDO PARA CÁ) */}
            <div className="border-4 border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-tight text-foreground flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Agendar Várias Datas?
                </p>
                <div className="flex bg-white dark:bg-black border-2 border-black p-0.5">
                  <button
                    type="button"
                    onClick={() => setIsMultiMode(false)}
                    className={cn(
                      "px-2 py-1 text-[9px] font-black uppercase transition-all",
                      !isMultiMode ? "bg-black text-white" : "text-black dark:text-white"
                    )}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMultiMode(true)}
                    className={cn(
                      "px-2 py-1 text-[9px] font-black uppercase transition-all",
                      isMultiMode ? "bg-black text-white" : "text-black dark:text-white"
                    )}
                  >
                    Sim
                  </button>
                </div>
              </div>

              {isMultiMode && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <div className="flex flex-wrap gap-1 p-1 bg-white dark:bg-black border-2 border-black min-h-[44px] items-center">
                    <Badge variant="outline" className="text-[10px] font-black border-2 border-black bg-blue-500 text-white rounded-none h-7 px-2">
                      {format(date, 'dd/MM')} — {timeSlot}
                    </Badge>
                    {extraDates.map((d, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] font-black border-2 border-black bg-violet-100 dark:bg-violet-900/40 text-foreground rounded-none flex items-center gap-2 pr-1 h-7 px-2"
                      >
                        {format(d, 'dd/MM')} — {timeSlot}
                        <CloseIcon
                          className="h-3.5 w-3.5 cursor-pointer hover:bg-red-500 hover:text-white border border-black transition-colors"
                          onClick={() => setExtraDates(extraDates.filter((_, idx) => idx !== i))}
                        />
                      </Badge>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCalendar(!showCalendar);
                      }}
                      className="h-6 px-2 border-black border-2 rounded-none text-[8px] font-black uppercase bg-violet-600 text-white hover:bg-violet-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      {showCalendar ? '- Fechar' : '+ Selecionar'}
                    </Button>
                  </div>

                  {showCalendar && (
                    <div className="mt-4 border-4 border-black bg-white dark:bg-zinc-900 shadow-[8px_8px_0_0_#000] p-0 animate-in zoom-in-95 duration-200 overflow-hidden">
                      <div className="bg-black text-white p-2 flex items-center justify-between border-b-2 border-black">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Selecione as Datas
                        </span>
                        <Badge className="bg-violet-500 border-none rounded-none text-[8px] font-black">
                          {extraDates.length + 1} DIA(S) NO TOTAL
                        </Badge>
                      </div>

                      <div className="p-4 flex justify-center bg-zinc-50 dark:bg-zinc-800/50">
                        <CalendarUI
                          mode="multiple"
                          selected={[date, ...extraDates]}
                          onSelect={(dates) => {
                            if (dates) {
                              setExtraDates(dates.filter(d => !isSameDay(d, date)));
                            }
                          }}
                          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || isSameDay(d, date)}
                          className="w-full flex justify-center"
                          classNames={{
                            months: "w-full flex flex-col items-center",
                            month: "w-full space-y-6",
                            caption: "flex justify-center pt-2 relative items-center gap-4 mb-2",
                            caption_label: "text-lg font-black uppercase tracking-tight",
                            nav: "flex items-center gap-2",
                            nav_button: "h-10 w-10 bg-white border-3 border-black rounded-none p-0 hover:bg-zinc-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                            nav_button_previous: "",
                            nav_button_next: "",
                            table: "w-full border-collapse",
                            head_row: "flex justify-between mb-4 border-b-2 border-black/10 pb-2",
                            head_cell: "text-muted-foreground w-12 font-black text-[11px] uppercase text-center",
                            row: "flex w-full mt-3 justify-between",
                            cell: "h-12 w-12 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                            day: "h-11 w-11 p-0 font-black border-3 border-transparent hover:border-black rounded-none transition-all flex items-center justify-center text-base",
                            day_selected: "bg-blue-600 text-white border-3 border-black hover:bg-blue-700 hover:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                            day_today: "bg-amber-100 border-3 border-amber-500 text-amber-900",
                            day_outside: "text-muted-foreground opacity-30",
                            day_disabled: "text-muted-foreground opacity-20 cursor-not-allowed",
                          }}
                          locale={ptBR}
                        />
                      </div>

                      <div className="p-4 border-t-4 border-black bg-white dark:bg-zinc-900 flex justify-end">
                        <Button
                          type="button"
                          onClick={() => setShowCalendar(false)}
                          className="w-full h-12 text-sm font-black uppercase bg-green-500 hover:bg-green-600 text-white border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                        >
                          Concluir Seleção
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-[9px] font-bold text-violet-600 dark:text-violet-400 italic">
                    * Repetir essa reserva em todos os dias selecionados.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* SEÇÃO 1: DADOS BÁSICOS (Cor: Violeta) */}
              <div className="border-4 border-violet-500 bg-violet-100 dark:bg-violet-950/20 shadow-[6px_6px_0px_0px_rgba(139,92,246,0.3)] border-l-[12px] p-0 overflow-hidden">
                <div className="p-2 pb-1.5 border-b-3 border-violet-500/30 bg-gradient-to-r from-violet-400 to-purple-500 flex items-center gap-2">
                  <Info className="h-4 w-4 text-white" />
                  <span className="text-xs font-black uppercase text-white">Dados da Reserva</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="justification" className="text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
                      Justificativa / Motivo
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="justification"
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Ex: Aula sobre Segunda Guerra Mundial"
                      disabled={isSaving}
                      required
                      rows={2}
                      className="border-3 border-black dark:border-white rounded-none focus:ring-0 focus:border-violet-500 transition-all resize-none text-sm bg-white dark:bg-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="classroom" className="text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
                      Sala
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="classroom"
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      placeholder="Ex: Sala 12 ou 9A"
                      disabled={isSaving}
                      required
                      className="border-3 border-black dark:border-white rounded-none h-9 text-sm font-bold bg-white dark:bg-black"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {['Sala Google', 'Sala Maker', 'Sala de Estudos', 'Sala de Artes'].map((sala) => (
                        <button
                          key={sala}
                          type="button"
                          onClick={() => setClassroom(sala)}
                          disabled={isSaving}
                          className={`px-2 py-1 text-[9px] font-black uppercase border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all ${classroom === sala
                            ? 'bg-violet-500 text-white'
                            : 'bg-white dark:bg-black text-foreground hover:bg-violet-100 dark:hover:bg-violet-900/30'
                            }`}
                        >
                          {sala}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: QUANTIDADE (Cor: Verde) */}
              <div className="border-4 border-green-500 bg-green-100 dark:bg-green-950/20 shadow-[6px_6px_0px_0px_rgba(34,197,94,0.3)] border-l-[12px] p-0 overflow-hidden">
                <div className="p-2 pb-1.5 border-b-3 border-green-500/30 bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-white" />
                    <span className="text-xs font-black uppercase text-white">Quantidade</span>
                  </div>
                  <div className="bg-white/30 border-2 border-white px-2 py-0.5">
                    <span className="text-base font-black text-white leading-none">{quantity}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <Slider
                    value={[quantity]}
                    onValueChange={(value) => setQuantity(value[0])}
                    min={1}
                    max={maxQuantity}
                    step={1}
                    disabled={isSaving || maxQuantity <= 0}
                    className="py-2"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-green-800 dark:text-green-300 uppercase">
                    <span>Mín: 1</span>
                    <span>Máx: {maxQuantity} disponível</span>
                  </div>
                  {quantity > maxQuantity && (
                    <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 uppercase">
                      <AlertTriangle className="h-3 w-3" />
                      Limite excedido
                    </p>
                  )}
                </div>
              </div>

              {/* SEÇÃO 3: RECURSOS EXTRAS (Cor: Azul) */}
              <div className="border-4 border-blue-500 bg-blue-100 dark:bg-blue-950/20 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)] border-l-[12px] p-0 overflow-hidden">
                <div className="p-2 pb-1.5 border-b-3 border-blue-500/30 bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center gap-2">
                  <Tv className="h-4 w-4 text-white" />
                  <span className="text-xs font-black uppercase text-white">Recursos Extras</span>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="needs-tv"
                        checked={needsTv}
                        onCheckedChange={(checked) => setNeedsTv(checked as boolean)}
                        disabled={isSaving}
                        className="h-5 w-5 border-3 border-black dark:border-white"
                      />
                      <Label htmlFor="needs-tv" className="text-xs font-bold flex items-center gap-2 cursor-pointer text-blue-700 dark:text-blue-300">
                        <Tv className="h-4 w-4" /> TV
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="needs-sound"
                        checked={needsSound}
                        onCheckedChange={(checked) => setNeedsSound(checked as boolean)}
                        disabled={isSaving}
                        className="h-5 w-5 border-3 border-black dark:border-white"
                      />
                      <Label htmlFor="needs-sound" className="text-xs font-bold flex items-center gap-2 cursor-pointer text-blue-700 dark:text-blue-300">
                        <Volume2 className="h-4 w-4" /> Som
                      </Label>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="needs-mic"
                          checked={needsMic}
                          onCheckedChange={(checked) => setNeedsMic(checked as boolean)}
                          disabled={isSaving}
                          className="h-5 w-5 border-3 border-black dark:border-white"
                        />
                        <Label htmlFor="needs-mic" className="text-xs font-bold flex items-center gap-2 cursor-pointer text-blue-700 dark:text-blue-300">
                          <Mic className="h-4 w-4" /> Microfones
                        </Label>
                      </div>
                      {needsMic && (
                        <div className="ml-7 flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={micQuantity}
                            onChange={(e) => setMicQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                            className="w-12 h-6 p-1 text-center font-bold text-xs border-2 border-black"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setIsMinecraft(!isMinecraft)}
                    className={cn(
                      "p-3 border-3 cursor-pointer transition-all flex flex-col justify-center gap-1 group h-full",
                      isMinecraft
                        ? "bg-[#3c8527] border-[#1e4d13] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white dark:bg-black border-foreground/10 hover:border-violet-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    <p className={cn("text-[10px] font-black uppercase", isMinecraft ? "text-white" : "text-foreground")}>Minecraft</p>
                    <p className={cn("text-[8px] font-bold uppercase", isMinecraft ? "text-[#e2f3df]" : "text-muted-foreground")}>Preparo TI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {justification && (
            <div className={cn(
              "p-3 border-4",
              isMinecraft ? "bg-[#3c8527]/10 border-[#3c8527]/30 shadow-[4px_4px_0px_0px_rgba(60,133,39,0.2)]" : "bg-blue-500/5 border-blue-500/30 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)]"
            )}>
              <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Resumo:</p>
              <p className="text-xs font-black">
                {isMinecraft && "[MINECRAFT] "} {quantity} Chromebooks para {classroom}
              </p>
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-1 pb-4 px-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 border-4 border-black dark:border-white rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !justification.trim() || quantity <= 0 || quantity > maxQuantity}
              className={cn(
                "h-10 flex-1 font-black uppercase",
                "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-4 border-black dark:border-white",
                "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)]",
                "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              )}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
