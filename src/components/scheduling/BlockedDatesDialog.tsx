import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarOff, Plus, Trash2, Loader2 } from 'lucide-react';
import { useDatabase, type BlockedDate } from '@/hooks/useDatabase';

interface BlockedDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedDates: BlockedDate[];
  onUpdated: () => void;
}

export const BlockedDatesDialog: React.FC<BlockedDatesDialogProps> = ({
  open,
  onOpenChange,
  blockedDates,
  onUpdated,
}) => {
  const { addBlockedDate, deleteBlockedDate } = useDatabase();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason.trim() || isSaving) return;
    setIsSaving(true);
    const created = await addBlockedDate(date, reason.trim());
    setIsSaving(false);
    if (created) {
      setDate('');
      setReason('');
      onUpdated();
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteBlockedDate(id);
    if (ok) onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-dialog sm:max-w-[480px] max-h-[85dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="neo-dialog-header-rose shrink-0">
          <DialogTitle className="neo-dialog-title">
            <CalendarOff className="h-5 w-5" />
            Feriados e Dias Sem Aula
          </DialogTitle>
          <DialogDescription className="text-white/85 font-bold uppercase text-xs mt-1">
            Bloqueie datas do calendário escolar para evitar reservas indevidas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          <form onSubmit={handleAdd} className="space-y-3 p-3 border-2 border-black dark:border-white bg-card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="blocked-date" className="text-xs font-black uppercase">Data</Label>
                <Input
                  id="blocked-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="neo-input h-10"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="blocked-reason" className="text-xs font-black uppercase">Motivo</Label>
                <Input
                  id="blocked-reason"
                  placeholder="Ex: Feriado, Conselho..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="neo-input h-10"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSaving || !date || !reason.trim()}
              className="w-full neo-btn h-10 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Bloquear Data
            </Button>
          </form>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-muted-foreground">Datas Bloqueadas ({blockedDates.length})</h4>
            {blockedDates.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center border border-dashed">
                Nenhum feriado ou recesso cadastrado.
              </p>
            ) : (
              blockedDates.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2.5 border-2 border-black dark:border-white bg-card"
                >
                  <div>
                    <p className="text-xs font-black uppercase">
                      {format(parseISO(item.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Remover bloqueio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
