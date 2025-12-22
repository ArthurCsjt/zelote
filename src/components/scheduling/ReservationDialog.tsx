import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Monitor, AlertTriangle, Info, Save, Tv, Volume2, Mic, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatabase, ReservationData, Reservation } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Plus } from 'lucide-react';

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
  const { createReservation, loading: isSaving } = useDatabase();
  const { user } = useAuth();
  const { isAdmin } = useProfileRole();

  const [justification, setJustification] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [needsTv, setNeedsTv] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);
  const [needsMic, setNeedsMic] = useState(false);
  const [micQuantity, setMicQuantity] = useState(1);
  const [isMinecraft, setIsMinecraft] = useState(false);
  const [classroom, setClassroom] = useState<string>('Sala Google'); // NOVO: Sala/Turma com valor padrão

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
      toast({
        title: "Reserva criada!",
        description: `${quantity} Chromebook${quantity > 1 ? 's' : ''} reservado${quantity > 1 ? 's' : ''} para ${format(date, "dd/MM/yyyy 'às' ", { locale: ptBR })}${timeSlot}`,
        variant: "success",
      });
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

      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-3 border-foreground/20 rounded-none shadow-[8px_8px_0px_0px_hsl(var(--foreground)/0.15)] bg-background p-0">

        {/* Premium Neo-Brutal Header */}
        <DialogHeader className="p-6 border-b-4 border-foreground bg-primary shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rotate-[-3deg] border-4 border-foreground bg-white flex items-center justify-center shadow-[4px_4px_0_0_#000]">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white drop-shadow-[2px_2px_0_#000]">
                Agendamento
              </DialogTitle>
              <DialogDescription className="text-white/90 font-bold bg-black/20 w-fit px-2 py-0.5 text-xs uppercase tracking-widest mt-1">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} · {timeSlot}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Status Card - Neo Brutal */}
          <div className="border-3 border-foreground bg-muted/20 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border-3 border-success/40 bg-success/5 shadow-[2px_2px_0px_0px_hsl(var(--success)/0.2)]">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Disponíveis</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Monitor className="h-4 w-4 text-success" />
                  <p className="text-2xl font-black text-success leading-none">{available}</p>
                </div>
              </div>
              <div className="text-center p-3 border-3 border-primary/40 bg-primary/5 shadow-[2px_2px_0px_0px_hsl(var(--primary)/0.2)]">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Já Reservados</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <User className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-black text-primary leading-none">{totalReserved}</p>
                </div>
              </div>
            </div>

            {/* Existing Reservations - HIGH PROMINENCE */}
            {currentReservations.length > 0 && (
              <div className="mt-4 pt-4 border-t-4 border-foreground/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-4 w-4 text-warning fill-warning/20" />
                    Ocupação Atual
                  </h3>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 border border-foreground/10">
                    {currentReservations.length} {currentReservations.length === 1 ? 'Reserva' : 'Reservas'}
                  </span>
                </div>

                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                  {currentReservations.map((res, idx) => {
                    const isMine = res.created_by === user?.id;
                    return (
                      <div key={idx} className={cn(
                        "relative flex flex-col gap-2 p-3 border-3 transition-all",
                        isMine
                          ? "border-primary bg-primary/5 shadow-[4px_4px_0px_0px_hsl(var(--primary)/0.2)]"
                          : "border-foreground/20 bg-background shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]",
                        res.is_minecraft && "border-[#3c8527] bg-[#3c8527]/5"
                      )}>
                        {isMine && (
                          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[8px] font-black uppercase px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                            Sua Reserva
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-black text-xs text-foreground uppercase tracking-tight">
                            <div className={cn(
                              "w-2 h-2 rounded-full animate-pulse",
                              res.is_minecraft ? "bg-[#3c8527]" : (isMine ? "bg-primary" : "bg-muted-foreground")
                            )} />
                            {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email || 'Usuário Desconhecido')}
                          </span>
                          <span className="font-black text-sm text-foreground flex items-center gap-1">
                            <Monitor className="h-3 w-3 opacity-40" />
                            {res.quantity_requested} <span className="text-[10px] opacity-60">CB</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {res.classroom && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 bg-foreground text-background">
                              SALA: {res.classroom}
                            </div>
                          )}
                          <div className="flex-1 text-[10px] font-bold text-muted-foreground italic line-clamp-1 border-l-2 border-muted-foreground/20 pl-2">
                            "{res.justification}"
                          </div>
                        </div>

                        {res.is_minecraft && (
                          <div className="text-[8px] font-black uppercase text-[#3c8527] bg-[#3c8527]/10 w-fit px-1.5 py-0.5 border border-[#3c8527]/30">
                            Equipamento Minecraft
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Neo Brutal Info Alert for Permissions */}
          {!isAdmin && (
            <div className="p-3 border-2 border-info/30 bg-info/5 rounded-none flex items-start gap-2">
              <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
              <p className="text-[10px] font-bold text-info-foreground leading-tight">
                Você está criando uma NOVA reserva. Reservas de outros professores não podem ser alteradas por você.
              </p>
            </div>
          )}

          {/* SECTION: NEW RESERVATION FORM */}
          <div className="pt-6 border-t-4 border-dashed border-foreground/15 mt-2">
            <div className="flex items-center gap-3 mb-6 bg-primary/5 p-3 border-2 border-primary/20">
              <div className="w-10 h-10 bg-primary flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                <Plus className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-foreground">Fazer meu Agendamento</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Complete os dados para reservar seus Chromebooks</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Form Fields - Neo Brutal */}
              <div className="space-y-5">

                {/* Justification */}
                <div className="space-y-2">
                  <Label htmlFor="justification" className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                    Justificativa / Motivo
                    <span className="text-error">*</span>
                  </Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Ex: Aula sobre Segunda Guerra Mundial"
                    disabled={isSaving}
                    required
                    rows={2}
                    className="border-3 border-foreground/20 rounded-none focus:border-primary focus:shadow-[2px_2px_0px_0px_hsl(var(--primary)/0.2)] transition-all resize-none text-sm"
                  />
                </div>

                {/* Classroom / Turma */}
                <div className="space-y-2">
                  <Label htmlFor="classroom" className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                    Sala / Turma onde será utilizado
                    <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="classroom"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    placeholder="Ex: Sala 12 ou 9A"
                    disabled={isSaving}
                    required
                    className="border-3 border-foreground/20 rounded-none focus:border-primary focus:shadow-[2px_2px_0px_0px_hsl(var(--primary)/0.2)] transition-all h-10 text-sm font-bold"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Sala Google', 'Sala Maker', 'Sala de Estudos', 'Sala de Artes'].map((sala) => (
                      <button
                        key={sala}
                        type="button"
                        onClick={() => setClassroom(sala)}
                        disabled={isSaving}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all ${
                          classroom === sala 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-foreground hover:bg-primary/20'
                        }`}
                      >
                        {sala}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Slider - Neo Brutal */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-wide flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-success">
                      <Monitor className="h-3.5 w-3.5" />
                      Quantidade de Chromebooks
                      <span className="text-error">*</span>
                    </span>
                    <div className="bg-success/10 border-2 border-success/30 px-3 py-1">
                      <span className="text-xl font-black text-success leading-none">{quantity}</span>
                    </div>
                  </Label>

                  <div className="p-4 border-3 border-foreground/10 bg-muted/5">
                    <Slider
                      value={[quantity]}
                      onValueChange={(value) => setQuantity(value[0])}
                      min={1}
                      max={maxQuantity}
                      step={1}
                      disabled={isSaving || maxQuantity <= 0}
                      className="py-2"
                    />

                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-2 uppercase">
                      <span>Mín: 1</span>
                      <span>Máx: {maxQuantity} disponível</span>
                    </div>
                  </div>

                  {quantity > maxQuantity && (
                    <p className="text-xs font-bold text-error flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Quantidade excede o limite disponível.
                    </p>
                  )}
                </div>

                {/* Auxiliary Equipment Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 border-3 border-foreground/10 bg-muted/5">
                    <Label className="text-xs font-black uppercase tracking-wide">
                      Equipamentos Auxiliares
                    </Label>

                    <div className="space-y-3">
                      {/* TV */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="needs-tv"
                          checked={needsTv}
                          onCheckedChange={(checked) => setNeedsTv(checked as boolean)}
                          disabled={isSaving}
                          className="border-2 border-foreground/30"
                        />
                        <Label htmlFor="needs-tv" className="text-xs font-bold flex items-center gap-2 cursor-pointer">
                          <Tv className="h-4 w-4 text-primary" />
                          TV
                        </Label>
                      </div>

                      {/* Sound */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="needs-sound"
                          checked={needsSound}
                          onCheckedChange={(checked) => setNeedsSound(checked as boolean)}
                          disabled={isSaving}
                          className="border-2 border-foreground/30"
                        />
                        <Label htmlFor="needs-sound" className="text-xs font-bold flex items-center gap-2 cursor-pointer">
                          <Volume2 className="h-4 w-4 text-info" />
                          Som
                        </Label>
                      </div>

                      {/* Microphone */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="needs-mic"
                            checked={needsMic}
                            onCheckedChange={(checked) => setNeedsMic(checked as boolean)}
                            disabled={isSaving}
                            className="border-2 border-foreground/30"
                          />
                          <Label htmlFor="needs-mic" className="text-xs font-bold flex items-center gap-2 cursor-pointer">
                            <Mic className="h-4 w-4 text-success" />
                            Microfones
                          </Label>
                        </div>

                        {needsMic && (
                          <div className="ml-6 flex items-center gap-2">
                            <Input
                              id="mic-quantity"
                              type="number"
                              min={1}
                              max={10}
                              value={micQuantity}
                              onChange={(e) => setMicQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                              disabled={isSaving}
                              className="w-16 h-7 border-2 border-foreground/20 rounded-none text-center font-bold text-xs"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase text-xs">unid.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MINECRAFT OPTION */}
                  <div
                    onClick={() => setIsMinecraft(!isMinecraft)}
                    className={cn(
                      "p-4 border-3 cursor-pointer transition-all flex flex-col justify-center gap-2 group h-full",
                      isMinecraft
                        ? "bg-[#3c8527] border-[#1e4d13] shadow-[4px_4px_0px_0px_#1e4d13]"
                        : "bg-muted/10 border-foreground/10 hover:border-foreground/30"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={cn(
                        "p-1.5 border-2",
                        isMinecraft ? "bg-[#55aa33] border-[#1e4d13]" : "bg-muted/20 border-foreground/10"
                      )}>
                        <Monitor className={cn("h-4 w-4", isMinecraft ? "text-white" : "text-muted-foreground")} />
                      </div>
                      <div className={cn(
                        "h-5 w-9 border-2 flex items-center px-1 transition-all",
                        isMinecraft ? "bg-[#55aa33] border-[#1e4d13] justify-end" : "bg-muted/30 border-foreground/10 justify-start"
                      )}>
                        <div className={cn("h-3 w-3", isMinecraft ? "bg-white" : "bg-muted-foreground/30")} />
                      </div>
                    </div>
                    <div>
                      <p className={cn("text-xs font-black uppercase tracking-tight", isMinecraft ? "text-white" : "text-foreground")}>
                        Minecraft
                      </p>
                      <p className={cn("text-[9px] font-bold uppercase", isMinecraft ? "text-[#e2f3df]" : "text-muted-foreground")}>
                        Preparo TI
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview - Neo Brutal */}
          {justification && (
            <div className={cn(
              "p-4 border-3",
              isMinecraft ? "bg-[#3c8527]/10 border-[#3c8527]/30" : "bg-primary/5 border-primary/30"
            )}>
              <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-2">
                <Info className="h-3 w-3" />
                Preview da Reserva:
              </p>
              <p className="text-sm font-black text-foreground">
                {isMinecraft && <span className="text-[#3c8527] mr-2">[MINECRAFT]</span>}
                {quantity} Chromebook{quantity > 1 ? 's' : ''} → {user?.email?.split('@')[0] || 'Professor'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {justification.substring(0, 60)}{justification.length > 60 ? '...' : ''} · {classroom} · {format(date, "dd/MM/yyyy")} às {timeSlot}
              </p>
              {(needsTv || needsSound || needsMic || isMinecraft) && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
                  <span className="font-bold">Destaques:</span>
                  {isMinecraft && <span className="px-2 py-0.5 bg-[#3c8527] text-white font-black text-xs">MNCFT</span>}
                  {needsTv && <span className="px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary font-bold">TV</span>}
                  {needsSound && <span className="px-2 py-0.5 bg-info/10 border border-info/30 text-info font-bold">Som</span>}
                  {needsMic && <span className="px-2 py-0.5 bg-success/10 border border-success/30 text-success font-bold">Mic ({micQuantity})</span>}
                </p>
              )}
            </div>
          )}

          {/* Footer Buttons - Neo Brutal */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
              className="h-11 border-3 border-foreground/20 rounded-none font-bold uppercase tracking-wide hover:bg-muted transition-all"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !justification.trim() || quantity <= 0 || quantity > maxQuantity}
              className="h-11 border-3 border-primary rounded-none font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.2)] hover:shadow-[6px_6px_0px_0px_hsl(var(--foreground)/0.2)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
