import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Clock, Users, Monitor, BookOpen, Tv, Volume2, Mic, Gamepad2, ChevronRight, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Reservation } from '@/hooks/useDatabase';

interface TodayAgendaPanelProps {
  reservations: Reservation[];
}

const slotLabel = (slot: string) => {
  // Tenta extrair horário do time_slot (ex: "08:00-09:30", "07:30", "periodo_1")
  if (!slot) return slot;
  if (slot.includes('-')) return slot; // já tem range
  if (slot.match(/^\d{2}:\d{2}$/)) return slot;
  // Fallback: exibe como veio
  return slot.replace(/_/g, ' ');
};

const dayLabel = (dateStr: string) => {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    return format(d, "EEE, dd/MM", { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const dayBadgeColor = (dateStr: string) => {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'bg-green-500 text-white';
    if (isTomorrow(d)) return 'bg-blue-500 text-white';
    return 'bg-gray-200 text-gray-800 dark:bg-zinc-700 dark:text-white';
  } catch {
    return 'bg-gray-200 text-gray-800';
  }
};

export const TodayAgendaPanel: React.FC<TodayAgendaPanelProps> = ({ reservations }) => {
  // Ordena: hoje primeiro, depois amanhã, etc.
  const sorted = useMemo(() =>
    [...reservations].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time_slot || '').localeCompare(b.time_slot || '');
    }),
    [reservations]
  );

  const isEmpty = sorted.length === 0;

  return (
    <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-5">
        <div>
          <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Agenda Operacional
          </CardTitle>
          <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
            Reservas de hoje e amanhã por horário
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xl font-black text-blue-600 dark:text-blue-400">
            {sorted.length}
          </span>
          <span className="text-xs font-bold uppercase text-gray-500">agendados</span>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-zinc-700">
              <Inbox className="h-10 w-10 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="font-black uppercase text-sm text-gray-400 dark:text-zinc-500">Nenhuma reserva agendada</p>
            <p className="text-xs text-gray-400 dark:text-zinc-600 font-mono">para hoje ou amanhã</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black/10 dark:divide-white/10 max-h-[420px] overflow-y-auto">
            {sorted.map((res, i) => (
              <div
                key={res.id}
                className={cn(
                  "flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group",
                  i === 0 && isToday(parseISO(res.date)) && "bg-green-50/60 dark:bg-green-950/20"
                )}
              >
                {/* Coluna de horário */}
                <div className="shrink-0 flex flex-col items-center min-w-[60px]">
                  <span className={cn(
                    "text-[10px] font-black uppercase px-2 py-0.5 font-mono mb-1",
                    dayBadgeColor(res.date)
                  )}>
                    {dayLabel(res.date)}
                  </span>
                  <div className="flex items-center gap-1 bg-black dark:bg-white text-white dark:text-black px-2 py-1 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] font-black font-mono">{slotLabel(res.time_slot)}</span>
                  </div>
                </div>

                {/* Conteúdo principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-black dark:text-white truncate">
                      {res.prof_name}
                    </span>
                    {res.prof_role && (
                      <Badge className="rounded-none border border-black dark:border-white text-[10px] px-1.5 py-0 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-bold uppercase">
                        {res.prof_role}
                      </Badge>
                    )}
                  </div>

                  {res.classroom && (
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      📍 {res.classroom}
                    </p>
                  )}

                  {res.justification && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 font-mono">
                      {res.justification}
                    </p>
                  )}

                  {/* Equipamentos solicitados */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-950/50 border border-black dark:border-yellow-700 px-2 py-0.5">
                      <Monitor className="h-3 w-3 text-yellow-700 dark:text-yellow-400" />
                      <span className="text-[10px] font-black font-mono text-yellow-800 dark:text-yellow-300">
                        {res.quantity_requested} Chromebook{res.quantity_requested !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {res.needs_tv && (
                      <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 px-1.5 py-0.5 flex items-center gap-1">
                        <Tv className="h-3 w-3" /> TV
                      </span>
                    )}
                    {res.needs_sound && (
                      <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-700 px-1.5 py-0.5 flex items-center gap-1">
                        <Volume2 className="h-3 w-3" /> Som
                      </span>
                    )}
                    {res.needs_mic && (
                      <span className="text-[10px] font-bold bg-pink-100 dark:bg-pink-950/50 border border-pink-300 dark:border-pink-700 px-1.5 py-0.5 flex items-center gap-1">
                        <Mic className="h-3 w-3" /> Mic×{res.mic_quantity || 1}
                      </span>
                    )}
                    {res.is_minecraft && (
                      <span className="text-[10px] font-bold bg-green-100 dark:bg-green-950/50 border border-green-300 dark:border-green-700 px-1.5 py-0.5 flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3" /> Minecraft
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};
