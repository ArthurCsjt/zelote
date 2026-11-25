import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, Volume2, Mic, Gamepad2, Laptop, MapPin, Printer, Clock, CheckCircle2 } from 'lucide-react';
import type { Reservation } from '@/hooks/useDatabase';

interface TodayChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservations: Reservation[];
}

export const TodayChecklistDialog: React.FC<TodayChecklistDialogProps> = ({
  open,
  onOpenChange,
  reservations,
}) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const todayList = React.useMemo(() => {
    return reservations
      .filter((r) => r.date === todayStr && !r.released_at)
      .sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''));
  }, [reservations, todayStr]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-dialog sm:max-w-[620px] max-h-[85dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="neo-dialog-header-blue shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="neo-dialog-title">
                <Clock className="h-5 w-5" />
                Agenda do Dia (Preparação)
              </DialogTitle>
              <DialogDescription className="text-white/85 font-bold uppercase text-xs mt-1">
                {todayLabel} · {todayList.length} {todayList.length === 1 ? 'reserva' : 'reservas'}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="no-print bg-white text-black border-2 border-black rounded-none font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] hover:bg-zinc-100"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
          {todayList.length === 0 ? (
            <div className="py-10 text-center space-y-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="text-sm font-black uppercase">Nenhuma reserva ativa para hoje</p>
              <p className="text-xs text-muted-foreground">Quando professores reservarem para hoje, aparecerão aqui em ordem de horário.</p>
            </div>
          ) : (
            todayList.map((res) => {
              const collectedCount = res.associated_loans?.length || 0;
              const isFulfilled = (res.quantity_requested || 0) > 0 && collectedCount >= res.quantity_requested;

              return (
                <div
                  key={res.id}
                  className="p-3.5 border-2 border-black dark:border-white bg-card shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black font-black text-xs tabular-nums">
                        {res.time_slot}
                      </span>
                      <span className="font-black text-sm uppercase truncate">
                        {res.prof_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {res.classroom && (
                        <Badge variant="outline" className="border-2 border-black dark:border-white rounded-none font-black uppercase text-[10px]">
                          <MapPin className="h-3 w-3 mr-1" />
                          {res.classroom}
                        </Badge>
                      )}
                      {isFulfilled && (
                        <Badge className="bg-emerald-600 text-white border-2 border-black rounded-none font-black uppercase text-[10px]">
                          Retirado ({collectedCount})
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Extras e Quantidade */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-500/40 text-blue-900 dark:text-blue-200 font-black text-xs uppercase">
                      <Laptop className="h-3.5 w-3.5" />
                      {res.quantity_requested > 0 ? `${res.quantity_requested} Chromebooks` : 'Só a Sala'}
                    </span>

                    {res.is_minecraft && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white border border-black font-black text-xs uppercase">
                        <Gamepad2 className="h-3.5 w-3.5" />
                        Minecraft
                      </span>
                    )}
                    {res.needs_tv && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-950/40 border border-amber-500 text-amber-900 dark:text-amber-200 font-black text-xs uppercase">
                        <Tv className="h-3.5 w-3.5" />
                        TV
                      </span>
                    )}
                    {res.needs_sound && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-950/40 border border-purple-500 text-purple-900 dark:text-purple-200 font-black text-xs uppercase">
                        <Volume2 className="h-3.5 w-3.5" />
                        Som
                      </span>
                    )}
                    {res.needs_mic && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-950/40 border border-rose-500 text-rose-900 dark:text-rose-200 font-black text-xs uppercase">
                        <Mic className="h-3.5 w-3.5" />
                        Mic ({res.mic_quantity || 1})
                      </span>
                    )}
                  </div>

                  {res.justification && (
                    <p className="text-xs text-muted-foreground border-t border-black/10 dark:border-white/10 pt-1.5">
                      {res.justification}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
