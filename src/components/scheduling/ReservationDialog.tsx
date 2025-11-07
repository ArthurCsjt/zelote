import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Clock, User, BookOpen, Save, Monitor, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useDatabase, ReservationData, Reservation } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessorAutocomplete } from './ProfessorAutocomplete'; // NOVO IMPORT

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

// Função para buscar a lista de professores (para o Combobox)
const fetchProfessores = async () => {
    const { data, error } = await supabase
        .from('professores')
        .select('id, nome_completo')
        .order('nome_completo', { ascending: true });
    if (error) throw error;
    return data;
};

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
  const { user } = useAuth();
  
  const [professorId, setProfessorId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  
  // Resetar estado ao abrir/fechar
  useEffect(() => {
    if (open) {
        setProfessorId('');
        setSubject('');
        setQuantity(1);
    }
  }, [open]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!professorId || !subject.trim() || quantity <= 0 || quantity > maxQuantity) {
      toast({ title: "Erro de Validação", description: "Preencha todos os campos corretamente e verifique a quantidade solicitada.", variant: "destructive" });
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
    }
    // O toast de erro é tratado no useDatabase
  };
  
  const totalReserved = currentReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
  const available = totalAvailableChromebooks - totalReserved;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="group">
        {children}
      </div>
      
      <DialogContent className="sm:max-w-[450px] bg-modal border-modal-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            Agendar Reserva
          </DialogTitle>
          <DialogDescription>
            Reserve Chromebooks para a aula de {format(date, 'dd/MM/yyyy')} às {timeSlot}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreateReservation} className="space-y-4 py-4">
          
          {/* Detalhes do Slot */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> Data:</span>
              <span>{format(date, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Horário:</span>
              <span>{timeSlot}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-primary">
              <span className="font-medium flex items-center gap-1"><Monitor className="h-3 w-3" /> Disponível:</span>
              <span>{available} 💻</span>
            </div>
          </div>
          
          {/* Professor (AGORA COM AUTOCOMPLETAR) */}
          <div className="space-y-2">
            <Label htmlFor="professor">Professor *</Label>
            <ProfessorAutocomplete
              professores={professores}
              selectedProfessorId={professorId}
              onSelect={setProfessorId}
              disabled={isSaving}
            />
          </div>
          
          {/* Matéria/Turma */}
          <div className="space-y-2">
            <Label htmlFor="subject">Matéria/Turma (Ex: História 9A) *</Label>
            <Input 
              id="subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="Digite a matéria ou turma"
              disabled={isSaving}
              required
              className="bg-input dark:bg-input"
            />
          </div>
          
          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade de Chromebooks *</Label>
            <Input 
              id="quantity" 
              type="number" 
              min={1}
              max={maxQuantity}
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
              placeholder="1"
              disabled={isSaving}
              required
              className="bg-input dark:bg-input"
            />
            <p className="text-xs text-muted-foreground">Máximo disponível: {maxQuantity} Chromebooks</p>
            {quantity > maxQuantity && (
                <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    A quantidade solicitada excede o limite disponível.
                </p>
            )}
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !professorId || !subject.trim() || quantity <= 0 || quantity > maxQuantity}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Reserva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};