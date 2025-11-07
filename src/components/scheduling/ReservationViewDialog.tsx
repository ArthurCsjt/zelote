import React, { useState, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Clock, User, BookOpen, Save, Monitor, AlertTriangle, Trash2, Edit3, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useDatabase, Reservation, ReservationData } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { ProfessorAutocomplete } from './ProfessorAutocomplete';
import { cn } from '@/lib/utils';

interface ReservationViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  professores: { id: string; nome_completo: string }[];
  totalAvailableChromebooks: number;
  allReservationsForSlot: Reservation[];
  onReservationUpdate: () => void;
}

export const ReservationViewDialog: React.FC<ReservationViewDialogProps> = ({
  open,
  onOpenChange,
  reservation,
  professores,
  totalAvailableChromebooks,
  allReservationsForSlot,
  onReservationUpdate,
}) => {
  const { updateReservation, deleteReservation, loading: isSaving } = useDatabase();
  
  const [isEditing, setIsEditing] = useState(false);
  const [professorId, setProfessorId] = useState(reservation?.professor_id || '');
  const [subject, setSubject] = useState(reservation?.subject || '');
  const [quantity, setQuantity] = useState(reservation?.quantity_requested || 1);
  
  // Sincroniza o estado interno quando a reserva muda
  useEffect(() => {
    if (reservation) {
      setProfessorId(reservation.professor_id);
      setSubject(reservation.subject || '');
      setQuantity(reservation.quantity_requested);
      setIsEditing(false); // Volta para o modo de visualização
    }
  }, [reservation]);

  if (!reservation) return null;
  
  // Calcula a disponibilidade máxima para edição
  const otherReservations = allReservationsForSlot.filter(res => res.id !== reservation.id);
  const reservedByOthers = otherReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
  const maxQuantity = totalAvailableChromebooks - reservedByOthers;
  
  const isQuantityInvalid = quantity <= 0 || quantity > maxQuantity;
  const isFormValid = professorId && subject.trim() && !isQuantityInvalid;

  const handleUpdateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || !reservation) return;
    
    const updateData: Partial<ReservationData> = {
      professor_id: professorId,
      subject: subject.trim(),
      quantity_requested: quantity,
    };
    
    const success = await updateReservation(reservation.id, updateData);
    
    if (success) {
      setIsEditing(false);
      onReservationUpdate();
    }
  };
  
  const handleDeleteReservation = async () => {
    if (!reservation) return;
    
    const success = await deleteReservation(reservation.id);
    
    if (success) {
      onOpenChange(false);
      onReservationUpdate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-modal border-modal-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Editar Minha Reserva' : 'Detalhes da Reserva'}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(reservation.date), 'dd/MM/yyyy')} às {reservation.time_slot}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleUpdateReservation} className="space-y-4 py-4">
          
          {/* Detalhes do Slot */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-1"><User className="h-3 w-3" /> Professor:</span>
              <span className={cn(!isEditing && 'font-semibold')}>{reservation.prof_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-1"><BookOpen className="h-3 w-3" /> Matéria:</span>
              <span className={cn(!isEditing && 'font-semibold')}>{reservation.subject}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-primary">
              <span className="font-medium flex items-center gap-1"><Monitor className="h-3 w-3" /> Quantidade:</span>
              <span>{reservation.quantity_requested} 💻</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Disponível (Slot):</span>
              <span>{maxQuantity + reservation.quantity_requested} 💻</span>
            </div>
          </div>
          
          {/* Formulário de Edição */}
          {isEditing && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label htmlFor="professor">Professor *</Label>
                <ProfessorAutocomplete
                  professores={professores}
                  selectedProfessorId={professorId}
                  onSelect={setProfessorId}
                  disabled={isSaving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Matéria/Turma *</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade de Chromebooks *</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  min={1}
                  max={maxQuantity + reservation.quantity_requested} // Máximo é o que está reservado + o que está disponível
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                  placeholder="1"
                  disabled={isSaving}
                  required
                  className="bg-input dark:bg-input"
                />
                <p className="text-xs text-muted-foreground">Máximo permitido: {maxQuantity + reservation.quantity_requested} Chromebooks</p>
                {isQuantityInvalid && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        A quantidade solicitada é inválida ou excede o limite disponível.
                    </p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            {isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancelar Edição
                </Button>
                <Button type="submit" disabled={isSaving || !isFormValid}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button type="button" variant="secondary" onClick={() => setIsEditing(true)} className="bg-menu-violet hover:bg-menu-violet-hover">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteReservation} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Cancelar Reserva
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};