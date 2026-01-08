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

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-4 border-black rounded-none shadow-[12px_12px_0px_0px_#000] p-0 outline-none bg-white">

        {/* HEADER: AZUL VIBRANTE (Igual Imagem) */}
        <DialogHeader className="p-6 border-b-4 border-black bg-[#3b82f6] text-white overflow-hidden relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white p-2 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
              <Calendar className="h-6 w-6 text-black" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">AGENDAMENTO</DialogTitle>
              <p className="text-xs font-bold uppercase opacity-90 tracking-widest drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} • {timeSlot}
              </p>
            </div>
          </div>
          <CloseIcon onClick={() => setOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white cursor-pointer w-5 h-5" />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="p-6 space-y-6">

            {/* GRID DE STATUS (Igual Imagem) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 border-4 border-green-200 bg-white shadow-[inset_0_0_0_1px_#22c55e]">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="h-4 w-4 text-green-500" />
                  <span className="text-[10px] font-black uppercase text-green-600 tracking-widest">Disponíveis</span>
                </div>
                <span className="text-4xl font-black text-green-500 leading-none">{available}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 border-4 border-blue-200 bg-white shadow-[inset_0_0_0_1px_#3b82f6]">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Reservados</span>
                </div>
                <span className="text-4xl font-black text-blue-500 leading-none">{totalReserved}</span>
              </div>
            </div>

            {/* SEPARADOR "NOVO AGENDAMENTO" */}
            <div className="relative flex items-center justify-start py-2">
              <div className="absolute left-0 right-0 h-1 bg-black" />
              <div className="relative bg-[#a855f7] text-white px-4 py-1.5 border-2 border-black shadow-[4px_4px_0_0_#000] rotate-[-1deg] ml-2">
                <span className="text-xs font-black uppercase tracking-widest">+ Novo Agendamento</span>
              </div>
            </div>

            {/* AGENDAMENTO MÚLTIPLO (Igual Imagem - Branco com Borda Preta) */}
            <div className="border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000] p-4 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-transparent pt-1">
                    <CalendarDays className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black uppercase text-black">Agendar para várias datas?</h3>
                      <span className="bg-[#2563eb] text-white text-[9px] font-black px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">RECORRÊNCIA</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase leading-tight max-w-[280px] mt-1">
                      Economize tempo reservando o mesmo horário para outros dias da semana de uma só vez.
                    </p>
                  </div>
                </div>

                <div className="flex border-[3px] border-black bg-white h-9 shadow-[4px_4px_0_0_#000]">
                  <button
                    type="button"
                    onClick={() => setIsMultiMode(false)}
                    className={cn(
                      "px-6 text-xs font-black uppercase transition-all flex items-center",
                      !isMultiMode ? "bg-black text-white" : "bg-white text-zinc-400 hover:text-black"
                    )}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMultiMode(true)}
                    className={cn(
                      "px-6 text-xs font-black uppercase transition-all flex items-center border-l-[3px] border-black",
                      isMultiMode ? "bg-black text-white" : "bg-white text-zinc-400 hover:text-black"
                    )}
                  >
                    Sim
                  </button>
                </div>
              </div>

              {isMultiMode && (
                <div className="mt-4 pt-4 border-t-2 border-zinc-100 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Selecione os dias:</Label>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] font-black uppercase border-2 border-black">
                      {format(date, 'dd/MM')} (Atual)
                    </div>
                    {extraDates.map((d, i) => (
                      <div key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-[#a855f7] text-white text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000]">
                        {format(d, 'dd/MM')}
                        <CloseIcon className="h-3 w-3 cursor-pointer" onClick={() => setExtraDates(extraDates.filter((_, idx) => idx !== i))} />
                      </div>
                    ))}
                    <Button type="button" onClick={() => setShowCalendar(!showCalendar)} className="h-[28px] bg-white text-black border-2 border-black text-[10px] font-black uppercase hover:bg-zinc-100 shadow-[2px_2px_0_0_#000] rounded-none px-3">+ Add Data</Button>
                  </div>
                  {showCalendar && (
                    <div className="mt-2 border-2 border-black p-2 bg-white shadow-[4px_4px_0_0_#000] absolute z-50 left-0 right-0 mx-4">
                      <CalendarUI
                        mode="multiple"
                        selected={extraDates}
                        onSelect={(dates) => setExtraDates(dates || [])}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')}
                        className="rounded-none w-full"
                        locale={ptBR}
                      />
                      <Button type="button" onClick={() => setShowCalendar(false)} className="w-full mt-2 bg-black text-white h-8 text-[10px] font-black uppercase rounded-none">OK</Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO DADOS DA RESERVA (Header Roxo) */}
            <div className="border-2 border-[#a855f7] bg-[#fdf4ff] overflow-hidden shadow-[4px_4px_0_0_rgba(168,85,247,0.2)]">
              <div className="bg-[#a855f7] px-4 py-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-white" />
                <span className="text-xs font-black uppercase text-white tracking-widest">Dados da Reserva</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#a855f7] tracking-widest">Sala <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {['Sala Google', 'Sala Maker', 'Sala de Estudos', 'Sala de Artes'].map((s) => (
                      <button key={s} type="button" onClick={() => { setClassroom(s); setShowCustomClassroom(false); }} className={cn("px-3 py-1.5 text-[10px] font-black border-2 border-black uppercase shadow-[2px_2px_0_0_#000] transition-all", classroom === s && !showCustomClassroom ? "bg-[#a855f7] text-white translate-x-[1px] translate-y-[1px] shadow-none" : "bg-white text-black hover:bg-zinc-50")}>
                        {s}
                      </button>
                    ))}
                    <button type="button" onClick={() => { setShowCustomClassroom(true); setClassroom(''); }} className={cn("px-3 py-1.5 text-[10px] font-black border-2 border-black uppercase shadow-[2px_2px_0_0_#000] transition-all", showCustomClassroom ? "bg-[#a855f7] text-white" : "bg-white")}>+</button>
                  </div>
                  {showCustomClassroom && <Input value={classroom} onChange={(e) => setClassroom(e.target.value)} placeholder="Nome da sala..." className="border-2 border-black rounded-none h-9 mt-2 text-xs font-bold" />}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#a855f7] tracking-widest">Justificativa / Motivo <span className="text-red-500">*</span></Label>
                  <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Ex: Aula sobre Segunda Guerra Mundial" className="border-2 border-black rounded-none min-h-[80px] text-sm resize-none focus-visible:ring-0 focus-visible:border-[#a855f7]" required />
                </div>
              </div>
            </div>

            {/* SEÇÃO QUANTIDADE (Header Verde) */}
            <div className="border-2 border-[#22c55e] bg-[#f0fdf4] overflow-hidden shadow-[4px_4px_0_0_rgba(34,197,94,0.2)]">
              <div className="bg-[#22c55e] px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-white" />
                  <span className="text-xs font-black uppercase text-white tracking-widest">Quantidade</span>
                </div>
                <div className="bg-white/20 border border-white/40 px-2 py-0.5 rounded text-white text-xs font-black">{quantity}</div>
              </div>
              <div className="p-5">
                <Slider value={[quantity]} onValueChange={(v) => setQuantity(v[0])} min={1} max={maxQuantity} step={1} className="py-2" />
                <div className="flex justify-between mt-2 text-[9px] font-black uppercase text-green-700">
                  <span>Mín: 1</span>
                  <span>Máx Disponível: {maxQuantity}</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO RECURSOS EXTRAS (Header Azul) */}
            <div className="border-2 border-[#3b82f6] bg-[#eff6ff] overflow-hidden shadow-[4px_4px_0_0_rgba(59,130,246,0.2)]">
              <div className="bg-[#3b82f6] px-4 py-2 flex items-center gap-2">
                <Tv className="h-4 w-4 text-white" />
                <span className="text-xs font-black uppercase text-white tracking-widest">Recursos Extras</span>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div onClick={() => setNeedsTv(!needsTv)} className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn("w-5 h-5 rounded-full border-2 border-black flex items-center justify-center transition-all", needsTv ? "bg-black" : "bg-white")}>
                      {needsTv && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <Tv className="h-4 w-4 text-black" />
                    <span className="text-xs font-black uppercase text-zinc-700 group-hover:text-black">TV</span>
                  </div>
                  <div onClick={() => setNeedsSound(!needsSound)} className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn("w-5 h-5 rounded-full border-2 border-black flex items-center justify-center transition-all", needsSound ? "bg-black" : "bg-white")}>
                      {needsSound && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <Volume2 className="h-4 w-4 text-black" />
                    <span className="text-xs font-black uppercase text-zinc-700 group-hover:text-black">Som</span>
                  </div>
                  <div onClick={() => setNeedsMic(!needsMic)} className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn("w-5 h-5 rounded-full border-2 border-black flex items-center justify-center transition-all", needsMic ? "bg-black" : "bg-white")}>
                      {needsMic && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <Mic className="h-4 w-4 text-black" />
                    <span className="text-xs font-black uppercase text-zinc-700 group-hover:text-black">Microfones</span>
                    {needsMic && (
                      <Input type="number" value={micQuantity} onChange={(e) => setMicQuantity(parseInt(e.target.value))} onClick={(e) => e.stopPropagation()} className="w-12 h-6 text-[10px] font-bold border-black p-1 ml-auto" />
                    )}
                  </div>
                </div>

                <div onClick={() => setIsMinecraft(!isMinecraft)} className="bg-white border-2 border-black p-3 shadow-[4px_4px_0_0_#000] cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_#000] transition-all flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-black">Minecraft</h4>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Preparo TI</span>
                  </div>
                  <div className={cn("h-4 w-4 border-2 border-black", isMinecraft ? "bg-green-500" : "bg-zinc-200")} />
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* FOOTER (Igual Imagem) */}
        <DialogFooter className="p-6 bg-zinc-50 border-t-4 border-black flex flex-row gap-4 justify-between">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 h-12 font-black uppercase border-[3px] border-black bg-white hover:bg-zinc-100 text-black rounded-none shadow-[4px_4px_0_0_#000] text-sm"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !justification.trim() || !classroom.trim() || quantity <= 0}
            onClick={handleSubmit}
            className="flex-[2] h-12 font-black uppercase bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-[3px] border-black rounded-none shadow-[4px_4px_0_0_#000] text-sm"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Reserva"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
