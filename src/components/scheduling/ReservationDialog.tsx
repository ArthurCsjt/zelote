import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Calendar, Clock, User, BookOpen, Save, Monitor, AlertTriangle, Info } from 'lucide-react';
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
  
  // Resetar ao abrir
  useEffect(() => {
    if (open) {
      setProfessorId('');
      setSubject('');
      // Define a quantidade mínima de 1, ou 0 se o máximo for 0
      setQuantity(Math.min(1, maxQuantity) || 0); 
    }
  }, [open, maxQuantity]);

  // Bloquear datas passadas (já tratado no SchedulingSlot, mas mantido aqui como fallback)
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

  // BLOQUEAR SE DATA PASSADA
  if (isPastDate) {
    return <div className="opacity-50 cursor-not-allowed">{children}</div>;
  }
  
  // Se não houver mais chromebooks disponíveis
  if (maxQuantity <= 0) {
    return <div className="opacity-80 cursor-not-allowed">{children}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>
      
      <DialogContent className="sm:max-w-[500px] bg-modal border-modal-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary text-xl">
            <Calendar className="h-5 w-5" />
            Nova Reserva de Chromebooks
          </DialogTitle>
          <DialogDescription className="text-base">
            {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {timeSlot}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          
          {/* CARD DE STATUS DO SLOT */}
          <div className={cn(
            "p-4 rounded-xl border",
            "bg-gradient-to-br from-blue-500/5 to-purple-500/5",
            "border-blue-500/20 dark:border-blue-900/50"
          )}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Disponíveis</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {available}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Total Reservado</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalReserved}
                </p>
              </div>
            </div>
            
            {/* RESERVAS EXISTENTES */}
            {currentReservations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Reservas existentes:
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {currentReservations.map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                      <span className="flex items-center gap-1 font-medium text-foreground truncate">
                        <User className="h-3 w-3 text-purple-500" />
                        {res.prof_name}
                      </span>
                      <span className="font-semibold text-primary">{res.quantity_requested} CB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* FORMULÁRIO EM 2 COLUNAS */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Professor */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <User className="h-4 w-4 text-purple-500" />
                Professor
                <span className="text-destructive">*</span>
              </Label>
              <ProfessorAutocomplete
                professores={professores}
                selectedProfessorId={professorId}
                onSelect={setProfessorId}
                disabled={isSaving}
              />
            </div>
            
            {/* Matéria/Turma */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subject" className="text-sm font-medium flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Matéria/Turma
                <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Ex: História 9A, Matemática Básica"
                disabled={isSaving}
                required
                className="h-11 bg-input dark:bg-input"
              />
            </div>
          </div>
          
          {/* QUANTIDADE COM SLIDER */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Monitor className="h-4 w-4 text-green-500" />
                Quantidade de Chromebooks
                <span className="text-destructive">*</span>
              </span>
              <span className="text-2xl font-bold text-primary">{quantity}</span>
            </Label>
            
            <Slider
              value={[quantity]}
              onValueChange={(value) => setQuantity(value[0])}
              min={1}
              max={maxQuantity}
              step={1}
              disabled={isSaving || maxQuantity <= 0}
              className="py-4"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínimo: 1</span>
              <span>Máximo: {maxQuantity}</span>
            </div>
            
            {quantity > maxQuantity && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Quantidade excede o limite disponível.
              </p>
            )}
          </div>
          
          {/* PREVIEW DA RESERVA */}
          {selectedProfessor && subject && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Info className="h-3 w-3" />
                Preview da Reserva:
              </p>
              <p className="text-sm font-medium text-foreground">
                {quantity} Chromebook{quantity > 1 ? 's' : ''} → {selectedProfessor.nome_completo}
              </p>
              <p className="text-xs text-muted-foreground">
                {subject} · {format(date, "dd/MM/yyyy")} às {timeSlot}
              </p>
            </div>
          )}
          
          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || !professorId || !subject.trim() || quantity <= 0 || quantity > maxQuantity}
              className="bg-primary hover:bg-primary/90"
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