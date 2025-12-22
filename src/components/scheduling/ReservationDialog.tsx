import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Monitor, AlertTriangle, Info, Save, Tv, Volume2, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatabase, ReservationData, Reservation } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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

  const [justification, setJustification] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [needsTv, setNeedsTv] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);
  const [needsMic, setNeedsMic] = useState(false);
  const [micQuantity, setMicQuantity] = useState(1);
  const [isMinecraft, setIsMinecraft] = useState(false);

  useEffect(() => {
    if (open) {
      setJustification('');
      setQuantity(Math.min(1, maxQuantity) || 0);
      setNeedsTv(false);
      setNeedsSound(false);
      setNeedsMic(false);
      setMicQuantity(1);
      setIsMinecraft(false);
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

        {/* Neo Brutal Header */}
        <DialogHeader className="p-5 border-b-3 border-foreground/10 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 border-3 border-primary bg-primary/10 shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.3)]">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight text-foreground">
                  Nova Reserva
                </DialogTitle>
                <DialogDescription className="text-sm font-medium">
                  {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {timeSlot}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Status Card - Neo Brutal */}
          <div className="border-3 border-foreground/10 bg-muted/20 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border-3 border-success/30 bg-success/5">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-black text-success">{available}</p>
              </div>
              <div className="text-center p-3 border-3 border-info/30 bg-info/5">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Reservados</p>
                <p className="text-2xl font-black text-info">{totalReserved}</p>
              </div>
            </div>

            {/* Existing Reservations */}
            {currentReservations.length > 0 && (
              <div className="mt-4 pt-4 border-t-3 border-foreground/10">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground mb-2">
                  Reservas Existentes:
                </p>
                <div className="space-y-1.5 max-h-20 overflow-y-auto">
                  {currentReservations.map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-background border-2 border-foreground/10 px-2 py-1.5">
                      <span className="flex items-center gap-1.5 font-bold text-foreground truncate">
                        {res.prof_name}
                      </span>
                      <span className="font-black text-primary">{res.quantity_requested} CB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Fields - Neo Brutal */}
          <div className="space-y-4">

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
                placeholder="Ex: Aula de História sobre Segunda Guerra Mundial, turma 9A"
                disabled={isSaving}
                required
                rows={3}
                className="border-3 border-foreground/20 rounded-none focus:border-primary focus:shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.2)] transition-all resize-none"
              />
            </div>

            {/* Quantity Slider - Neo Brutal */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-success" />
                  Quantidade
                  <span className="text-error">*</span>
                </span>
                <span className="text-2xl font-black text-primary">{quantity}</span>
              </Label>

              <div className="p-4 border-3 border-foreground/10 bg-muted/10">
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
                  <span>Máx: {maxQuantity}</span>
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
            <div className="space-y-3 p-4 border-3 border-foreground/10 bg-muted/5">
              <Label className="text-xs font-black uppercase tracking-wide">
                Equipamentos Auxiliares (Opcional)
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
                  <Label htmlFor="needs-tv" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
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
                  <Label htmlFor="needs-sound" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
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
                    <Label htmlFor="needs-mic" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
                      <Mic className="h-4 w-4 text-success" />
                      Microfone
                    </Label>
                  </div>

                  {needsMic && (
                    <div className="ml-6 flex items-center gap-2">
                      <Label htmlFor="mic-quantity" className="text-xs font-bold">Quantidade:</Label>
                      <Input
                        id="mic-quantity"
                        type="number"
                        min={1}
                        max={10}
                        value={micQuantity}
                        onChange={(e) => setMicQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                        disabled={isSaving}
                        className="w-20 h-8 border-2 border-foreground/20 rounded-none text-center font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MINECRAFT BUTTON - SPECIAL HIGHLIGHT */}
            <div
              onClick={() => setIsMinecraft(!isMinecraft)}
              className={cn(
                "p-4 border-3 cursor-pointer transition-all flex items-center justify-between group",
                isMinecraft
                  ? "bg-[#3c8527] border-[#1e4d13] shadow-[4px_4px_0px_0px_#1e4d13]"
                  : "bg-muted/10 border-foreground/10 hover:border-foreground/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 border-2",
                  isMinecraft ? "bg-[#55aa33] border-[#1e4d13]" : "bg-muted/20 border-foreground/10"
                )}>
                  <Monitor className={cn("h-5 w-5", isMinecraft ? "text-white" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className={cn("text-sm font-black uppercase tracking-tight", isMinecraft ? "text-white" : "text-foreground")}>
                    Aula de Minecraft
                  </p>
                  <p className={cn("text-[10px] font-bold uppercase", isMinecraft ? "text-[#e2f3df]" : "text-muted-foreground")}>
                    Requer preparação especial
                  </p>
                </div>
              </div>
              <div className={cn(
                "h-6 w-11 border-2 flex items-center px-1 transition-all",
                isMinecraft ? "bg-[#55aa33] border-[#1e4d13] justify-end" : "bg-muted/30 border-foreground/10 justify-start"
              )}>
                <div className={cn("h-4 w-4", isMinecraft ? "bg-white" : "bg-muted-foreground/30")} />
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
                {justification.substring(0, 60)}{justification.length > 60 ? '...' : ''} · {format(date, "dd/MM/yyyy")} às {timeSlot}
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
