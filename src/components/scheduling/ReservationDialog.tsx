import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Calendar, Clock, User, BookOpen, Save, Monitor, AlertTriangle, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatabase, ReservationData, Reservation } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { ProfessorAutocomplete } from './ProfessorAutocomplete';
import { cn } from '@/lib/utils';

interface ReservationDialogProps {
  children: ReactNode;
  date: Date;
  timeSlot: string;
  totalAvailableChromebooks: number;
  currentReservations: Reservation[];
  onReservationSuccess: () => void;
  professores: { id: string; nome_completo: string }[];
  maxQuantity: number;
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  children,
  date,
  timeSlot,
  totalAvailableChromebooks,
  currentReservations,
  onReservationSuccess,
  professores,
  maxQuantity,
}) => {
  const [open, setOpen] = useState(false);
  const { createReservation, loading: isSaving } = useDatabase();
  
  const [professorId, setProfessorId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  
  useEffect(() => {
    if (open) {
      setProfessorId('');
      setSubject('');
      setQuantity(Math.min(1, maxQuantity) || 0); 
    }
  }, [open, maxQuantity]);

  const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!professorId || !subject.trim() || quantity <= 0 || quantity > maxQuantity) {
      toast({ 
        title: "Erro de Validação", 
        description: "Preencha todos os campos corretamente e verifique a quantidade solicitada.", 
        variant: "destructive" 
      });
      return;
    }
    
    const reservationData: ReservationData = {
      date: format(date, 'yyyy-MM-dd'),
      time_slot: timeSlot,
      professor_id: professorId,
      subject: subject.trim(),
      quantity_requested: quantity,
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
  const selectedProfessor = professores.find(p => p.id === professorId);

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
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-3 border-foreground/20 rounded-none shadow-[8px_8px_0px_0px_hsl(var(--foreground)/0.15)] bg-background p-0">
        
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
                        <User className="h-3 w-3 text-primary" />
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
            
            {/* Professor */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                Professor
                <span className="text-error">*</span>
              </Label>
              <ProfessorAutocomplete
                professores={professores}
                selectedProfessorId={professorId}
                onSelect={setProfessorId}
                disabled={isSaving}
              />
            </div>
            
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-info" />
                Matéria/Turma
                <span className="text-error">*</span>
              </Label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Ex: História 9A, Matemática Básica"
                disabled={isSaving}
                required
                className="h-11 border-3 border-foreground/20 rounded-none focus:border-primary focus:shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.2)] transition-all"
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
          </div>
          
          {/* Preview - Neo Brutal */}
          {selectedProfessor && subject && (
            <div className="p-4 border-3 border-primary/30 bg-primary/5">
              <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-2">
                <Info className="h-3 w-3" />
                Preview da Reserva:
              </p>
              <p className="text-sm font-black text-foreground">
                {quantity} Chromebook{quantity > 1 ? 's' : ''} → {selectedProfessor.nome_completo}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {subject} · {format(date, "dd/MM/yyyy")} às {timeSlot}
              </p>
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
              disabled={isSaving || !professorId || !subject.trim() || quantity <= 0 || quantity > maxQuantity}
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
