import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Monitor, Info, Save, Tv, Volume2, Mic, User, ListFilter, CalendarDays, X as CloseIcon, ArrowRight } from 'lucide-react';
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
  const [classroom, setClassroom] = useState<string>('');
  const [extraDates, setExtraDates] = useState<Date[]>([]);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCustomClassroom, setShowCustomClassroom] = useState(false);

  useEffect(() => {
    if (open) {
      setJustification('');
      setQuantity(Math.min(1, maxQuantity) || 0);
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

  const isExpired = date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || !classroom.trim() || quantity <= 0 || quantity > maxQuantity) {
      toast({
        title: "Erro de Validação",
        description: "Preencha a sala e a justificativa.",
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

      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto border-4 border-black dark:border-zinc-800 rounded-none shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] p-0 outline-none bg-white dark:bg-zinc-950 text-black dark:text-zinc-100">

        {/* HEADER */}
        <DialogHeader className="p-4 sm:p-5 border-b-4 border-black bg-[#3b82f6] text-white relative">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]">
              <Calendar className="h-5 w-5 text-black" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight">AGENDAMENTO</DialogTitle>
              <p className="text-[10px] sm:text-xs font-bold uppercase opacity-90 tracking-wide">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} • {timeSlot}
              </p>
            </div>
          </div>
          <CloseIcon onClick={() => setOpen(false)} className="absolute top-3 right-3 text-white/70 hover:text-white cursor-pointer w-5 h-5 transition-colors" />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="p-4 sm:p-5 space-y-5">

            {/* STATUS GRID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 border-3 border-[#22c55e] bg-green-50/50 dark:bg-green-950/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Monitor className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-green-600 dark:text-green-400 tracking-wider">Disponíveis</span>
                </div>
                <span className="text-3xl sm:text-4xl font-black text-green-500 leading-none">{available}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 sm:p-4 border-3 border-[#a855f7] bg-purple-50/50 dark:bg-purple-950/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">Reservados</span>
                </div>
                <span className="text-3xl sm:text-4xl font-black text-purple-500 leading-none">{totalReserved}</span>
              </div>
            </div>

            {/* NOVO AGENDAMENTO DIVIDER */}
            <div className="relative flex items-center py-1">
              <div className="absolute inset-x-0 h-[3px] bg-black" />
              <div className="relative bg-[#a855f7] text-white px-3 py-1 border-2 border-black shadow-[3px_3px_0_0_#000] -rotate-1">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide">+ Novo Agendamento</span>
              </div>
            </div>

            {/* RECORRÊNCIA */}
            <div className="border-2 border-[#1e3a8a] bg-blue-50/30 overflow-hidden shadow-[4px_4px_0_0_rgba(30,58,138,0.15)] relative">
              <div className="bg-[#1e3a8a] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-white" />
                  <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider">Múltiplas Datas</span>
                </div>
                <span className="bg-white/20 border border-white/50 px-2 py-0.5 text-white text-[8px] sm:text-[9px] font-black uppercase">Recorrência</span>
              </div>

              <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-[9px] sm:text-[10px] font-bold text-zinc-600 dark:text-zinc-400 leading-snug max-w-[240px]">
                    Economize tempo reservando o mesmo horário para outros dias.
                  </p>

                  <div className="flex border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.1)] self-start sm:self-center overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsMultiMode(false)}
                      className={cn(
                        "px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-black uppercase transition-all",
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
                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#1e3a8a] mb-2.5 block">Selecione os dias:</Label>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-white text-[9px] sm:text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000]">
                        <Calendar className="h-3 w-3" />
                        {format(date, 'dd/MM')}
                        <span className="text-zinc-400 text-[8px]">(atual)</span>
                      </div>
                      {extraDates.map((d, i) => (
                        <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1e3a8a] text-white text-[9px] sm:text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                          <Calendar className="h-3 w-3" />
                          {format(d, 'dd/MM')}
                          <CloseIcon className="h-3 w-3 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity" onClick={() => setExtraDates(extraDates.filter((_, idx) => idx !== i))} />
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="h-auto py-1.5 px-3 bg-white dark:bg-zinc-900 text-[#1e3a8a] dark:text-blue-400 border-2 border-dashed border-[#1e3a8a] dark:border-blue-700 text-[9px] sm:text-[10px] font-black uppercase hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-solid rounded-none flex items-center gap-1.5 transition-all"
                      >
                        <CalendarDays className="h-3 w-3" />
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
                <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider">Dados da Reserva</span>
              </div>
              <div className="p-3 sm:p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase text-[#a855f7] dark:text-purple-400 tracking-wider">Sala <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Sala Google', 'Sala Maker', 'Sala de Estudos', 'Sala de Artes'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setClassroom(s); setShowCustomClassroom(false); }}
                        className={cn(
                          "px-2 sm:px-2.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-black border-2 border-black uppercase transition-all",
                          classroom === s && !showCustomClassroom
                            ? "bg-[#1e3a8a] text-white shadow-[2px_2px_0_0_#000] translate-x-[1px] translate-y-[1px] shadow-none"
                            : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.1)]"
                        )}
                      >
                        {s}
                      </button>
                    ))}
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
                      placeholder="Nome da sala..."
                      className="border-2 border-black rounded-none h-8 mt-2 text-xs font-bold focus-visible:ring-0 focus-visible:border-[#a855f7]"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase text-[#a855f7] dark:text-purple-400 tracking-wider">Justificativa / Motivo <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Ex: Aula sobre Segunda Guerra Mundial"
                    className="border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none min-h-[70px] text-xs sm:text-sm resize-none focus-visible:ring-0 focus-visible:border-[#a855f7] dark:focus-visible:border-purple-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* QUANTIDADE */}
            <div className="border-2 border-[#22c55e] bg-green-50/30 overflow-hidden shadow-[4px_4px_0_0_rgba(34,197,94,0.15)]">
              <div className="bg-[#22c55e] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-white" />
                  <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider">Quantidade</span>
                </div>
                <div className="bg-white/20 border border-white/50 px-2 py-0.5 text-white text-xs font-black">{quantity}</div>
              </div>
              <div className="p-3 sm:p-4">
                <Slider value={[quantity]} onValueChange={(v) => setQuantity(v[0])} min={1} max={maxQuantity} step={1} className="py-2" />
                <div className="flex justify-between mt-1.5 text-[8px] sm:text-[9px] font-black uppercase text-green-700">
                  <span>Mín: 1</span>
                  <span>Máx: {maxQuantity}</span>
                </div>
              </div>
            </div>

            {/* RECURSOS EXTRAS */}
            <div className="border-2 border-[#3b82f6] bg-blue-50/30 dark:bg-blue-950/20 overflow-hidden shadow-[4px_4px_0_0_rgba(59,130,246,0.15)]">
              <div className="bg-[#3b82f6] px-3 py-2 flex items-center gap-2">
                <Tv className="h-4 w-4 text-white" />
                <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider">Recursos Extras</span>
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
                    <span className="text-[10px] sm:text-xs font-black uppercase">TV</span>
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
                    <span className="text-[10px] sm:text-xs font-black uppercase">Som</span>
                  </div>

                  {/* MIC */}
                  <div
                    onClick={() => setNeedsMic(!needsMic)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 border-2 border-black dark:border-zinc-800 cursor-pointer transition-all",
                      needsMic ? "bg-black dark:bg-blue-600 text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)]"
                    )}
                  >
                    <Mic className={cn("h-4 w-4", needsMic ? "text-white" : "text-black dark:text-zinc-400")} />
                    <span className="text-[10px] sm:text-xs font-black uppercase">Mic</span>
                    {needsMic && (
                      <Input
                        type="number"
                        value={micQuantity}
                        onChange={(e) => setMicQuantity(parseInt(e.target.value) || 1)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-5 text-[10px] font-bold border-white bg-white/20 text-white p-1 ml-auto rounded-none"
                        min={1}
                      />
                    )}
                  </div>

                  {/* MINECRAFT */}
                  <div
                    onClick={() => setIsMinecraft(!isMinecraft)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 border-2 border-black dark:border-zinc-800 cursor-pointer transition-all",
                      isMinecraft ? "bg-[#22c55e] text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)]"
                    )}
                  >
                    <Monitor className={cn("h-4 w-4", isMinecraft ? "text-white" : "text-black dark:text-zinc-400")} />
                    <div className="flex flex-col">
                      <span className="text-[10px] sm:text-xs font-black uppercase leading-none">Minecraft</span>
                      <span className="text-[8px] font-black uppercase opacity-60 dark:opacity-80">TI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
            disabled={isSaving || !justification.trim() || !classroom.trim() || quantity <= 0}
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
