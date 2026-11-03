import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getStartOfWeek, getWeekDays, timeSlots } from '@/utils/scheduling';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Monitor, Laptop, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Converte formato de banco "07:10:00" em formato de UI "07h10"
const fromDbTime = (slot: string): string => {
  if (!slot) return slot;
  if (!slot.includes(':')) return slot;
  const [h, m] = slot.split(':');
  return `${h}h${m}`;
};

// Converte slot "07h10" em minutos desde as 00:00
const slotToMinutes = (slot: string): number => {
  const [h, m] = slot.split('h');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

interface PublicReservation {
  id: string;
  date: string;
  time_slot: string;
  classroom: string;
  quantity_requested: number;
  is_minecraft: boolean;
}

export const LoginSchedulingShowcase: React.FC = () => {
  // Relógio em tempo real para a linha vermelha de hora atual
  const [now, setNow] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(timer);
  }, []);

  const weekStart = useMemo(() => getStartOfWeek(now), [now]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const startDate = useMemo(() => format(weekDays[0], 'yyyy-MM-dd'), [weekDays]);
  const endDate = useMemo(() => format(weekDays[weekDays.length - 1], 'yyyy-MM-dd'), [weekDays]);

  // Busca dados de reservas da semana (via RPC segura para acesso público)
  const { data: reservations = [] } = useQuery<PublicReservation[]>({
    queryKey: ['public-weekly-reservations', startDate, endDate],
    queryFn: async () => {
      try {
        // 1. Tenta chamar a RPC segura criada no Supabase
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
          'get_public_schedule_showcase',
          { start_date: startDate, end_date: endDate }
        );

        if (!rpcError && Array.isArray(rpcData)) {
          return rpcData.map((r: any) => ({
            ...r,
            time_slot: fromDbTime(r.time_slot || ''),
          }));
        }

        // 2. Fallback para consulta direta caso o usuário esteja autenticado
        const { data, error } = await supabase
          .from('reservations')
          .select('id, date, time_slot, classroom, quantity_requested, is_minecraft')
          .gte('date', startDate)
          .lte('date', endDate);

        if (error) return [];
        return (data || []).map(r => ({
          ...r,
          time_slot: fromDbTime(r.time_slot || ''),
        }));
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Busca o limite de Chromebooks cadastrado
  const { data: totalAvailableChromebooks = 111 } = useQuery<number>({
    queryKey: ['public-operational-limit'],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'chromebook_operational_limit')
          .maybeSingle();

        if (data && data.value) {
          const parsed = typeof data.value === 'number' ? data.value : parseInt(data.value);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      } catch {}
      return 111;
    },
    staleTime: 1000 * 60 * 30,
  });

  // Mapeia reservas por "data_slot"
  const { reservationsMap, dailySlotsData } = useMemo(() => {
    const map = new Map<string, PublicReservation[]>();
    const slotsData = new Map<string, Map<string, number>>();

    reservations.forEach(res => {
      const key = `${res.date}_${res.time_slot}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(res);

      if (!slotsData.has(res.date)) {
        slotsData.set(res.date, new Map());
      }
      const daySlots = slotsData.get(res.date)!;
      const slotUsage = daySlots.get(res.time_slot) || 0;
      daySlots.set(res.time_slot, slotUsage + (res.quantity_requested || 0));
    });

    return { reservationsMap: map, dailySlotsData: slotsData };
  }, [reservations]);

  // Todos os 13 horários completos (de 07h10 até 17h40)
  const allSlots = timeSlots;
  const timeColumnWidth = 75;
  const gridTemplateColumns = `${timeColumnWidth}px repeat(${weekDays.length}, minmax(0, 1fr))`;

  // Altura fixa em pixels de cada linha de horário
  const ROW_HEIGHT_PX = 60; // 3.75rem

  // Horário em minutos agora
  const currentMinutesNow = now.getHours() * 60 + now.getMinutes();
  const firstSlotMinutes = slotToMinutes(allSlots[0]); // 07:10 = 430 min
  const lastSlotMinutes = slotToMinutes(allSlots[allSlots.length - 1]) + 50; // 17:40 + 50min = 18:30 = 1110 min

  // Encontra a posição exata interpolando entre os slots ou limites
  const currentTimeTopPx = useMemo(() => {
    if (currentMinutesNow < firstSlotMinutes) {
      return 0; // Antes do início das aulas
    }
    if (currentMinutesNow > lastSlotMinutes) {
      return allSlots.length * ROW_HEIGHT_PX; // Após o encerramento das aulas
    }

    for (let i = 0; i < allSlots.length; i++) {
      const slotStart = slotToMinutes(allSlots[i]);
      const nextSlotStart = i < allSlots.length - 1 ? slotToMinutes(allSlots[i + 1]) : slotStart + 50;

      if (currentMinutesNow >= slotStart && currentMinutesNow < nextSlotStart) {
        const progress = (currentMinutesNow - slotStart) / (nextSlotStart - slotStart);
        return i * ROW_HEIGHT_PX + progress * ROW_HEIGHT_PX;
      }
    }
    return null;
  }, [currentMinutesNow, firstSlotMinutes, lastSlotMinutes, allSlots]);

  // Índice da coluna de "Hoje" (0 = Segunda, 4 = Sexta)
  const todayColumnIndex = useMemo(() => {
    return weekDays.findIndex(d => isToday(d));
  }, [weekDays]);

  // Posicionamento automático por período:
  // - De manhã (< 12h): exibe do início (07h10 até ~13h10)
  // - A partir das 12h da tarde (>= 12h): rola para os horários da tarde (a partir das 12h30)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return;

      const currentHour = new Date().getHours();
      const isAfternoon = currentHour >= 12;

      if (isAfternoon) {
        const slot12h30Index = allSlots.indexOf('12h30');
        const targetScroll = slot12h30Index !== -1 
          ? slot12h30Index * ROW_HEIGHT_PX 
          : scrollContainerRef.current.scrollHeight;

        scrollContainerRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      } else {
        scrollContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [allSlots]);

  return (
    <div className="w-full flex flex-col select-none animate-in fade-in slide-in-from-left-8 duration-700">

      {/* Container Principal com Borda Neo-Brutalist */}
      <div className="relative border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,0.08)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none neo-brutal-dots font-black text-black" />

        {/* ========================================================= */}
        {/* HEADER FIXO: DISPONÍVEIS + DIAS DA SEMANA */}
        {/* ========================================================= */}
        <div
          className="grid gap-0 relative z-20 w-full border-b-4 border-black dark:border-white bg-white dark:bg-zinc-900"
          style={{ gridTemplateColumns }}
        >
          {/* CÉLULA 1 DO HEADER: DISPONÍVEIS + MAPA DE CALOR */}
          <div
            className="h-28 sm:h-32 flex flex-col border-r-4 border-black dark:border-white bg-white dark:bg-zinc-900 relative overflow-hidden"
            style={{ width: timeColumnWidth }}
          >
            <div
              className="absolute inset-0 opacity-[0.05] dark:opacity-10 pointer-events-none z-0"
              style={{
                backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                backgroundSize: '8px 8px'
              }}
            />
            <Monitor className="absolute -top-3 -right-3 h-8 w-8 text-primary/10 dark:text-primary/15 pointer-events-none stroke-[2.5] z-0 select-none rotate-12" />

            {/* Total Disponível — borrado para convidar ao login */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-1 group" title="Faça login para ver a disponibilidade">
              <span className="text-2xl sm:text-[26px] font-[1000] tabular-nums text-black dark:text-white tracking-tighter leading-none blur-sm select-none pointer-events-none">
                {totalAvailableChromebooks}
              </span>
              <span className="text-[7px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-[0.2em] leading-none text-center mt-1 blur-sm select-none pointer-events-none">
                Disponíveis
              </span>
              {/* Ícone de cadeado sobreposto */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            {/* Rodapé do Header: Mapa de Calor Legenda */}
            <div className="px-1 py-1 border-t-4 border-black dark:border-white bg-zinc-50 dark:bg-zinc-950 relative z-10 flex flex-col items-center justify-center gap-1 h-[38px] shrink-0 w-full overflow-hidden">
              <span className="text-[6.5px] font-[1000] uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 leading-none">
                Mapa de Calor
              </span>
              <div className="flex h-[7px] gap-[1.5px] justify-center w-[calc(100%-4px)] items-end">
                <div className="flex-1 h-full bg-zinc-200/60 dark:bg-zinc-700/30 border border-black/10 rounded-[1px]" title="0% de uso" />
                <div className="flex-1 h-full bg-amber-300 dark:bg-amber-400 border border-black/10 rounded-[1px]" title="<30%" />
                <div className="flex-1 h-full bg-orange-400 border border-black/10 rounded-[1px]" title="30-74%" />
                <div className="flex-1 h-full bg-orange-500 border border-black/10 rounded-[1px]" title="75-89%" />
                <div className="flex-1 h-full bg-red-600 dark:bg-red-500 border border-black/10 rounded-[1px]" title="100%" />
              </div>
            </div>
          </div>

          {/* CÉLULAS DOS 5 DIAS DA SEMANA (HEADER) */}
          {weekDays.map((day, index) => {
            const isCurrentDay = isToday(day);
            const dateKey = format(day, 'yyyy-MM-dd');
            const daySlots = dailySlotsData.get(dateKey);

            return (
              <div
                key={index}
                className={cn(
                  "h-28 sm:h-32 flex flex-col border-r-4 last:border-r-0 border-black dark:border-white transition-all relative overflow-hidden",
                  isCurrentDay
                    ? "bg-gradient-to-br from-primary via-primary to-primary/85 text-white"
                    : "bg-white dark:bg-zinc-900"
                )}
              >
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, ${isCurrentDay ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
                        linear-gradient(to bottom, ${isCurrentDay ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)
                      `,
                      backgroundSize: '16px 16px'
                    }}
                  />
                </div>

                {/* Conteúdo do Dia */}
                <div
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center p-1 sm:p-2 relative z-10",
                    isCurrentDay ? "text-white" : "text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mb-0.5",
                      isCurrentDay ? "text-white/95" : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {format(day, 'EEEE', { locale: ptBR }).toUpperCase()}
                  </span>
                  <div className="flex items-baseline gap-0.5 leading-none">
                    <span className="text-xl sm:text-3xl font-black tabular-nums tracking-tighter">
                      {format(day, 'dd')}
                    </span>
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-black tabular-nums",
                        isCurrentDay ? "text-white/70" : "text-zinc-400 dark:text-zinc-500"
                      )}
                    >
                      /{format(day, 'MM')}
                    </span>
                  </div>
                  {isCurrentDay && (
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/90 mt-0.5">
                      ● Hoje
                    </span>
                  )}
                </div>

                {/* Mini Heatmap Diário */}
                <div className="px-1.5 flex flex-col border-t-4 border-black dark:border-white relative z-10 bg-white dark:bg-zinc-950 justify-center h-[38px] shrink-0">
                  <div className="flex w-full h-[18px] sm:h-[22px] gap-[1.5px] justify-start">
                    {allSlots.map(slot => {
                      const usage = daySlots?.get(slot) || 0;
                      const rate = totalAvailableChromebooks > 0 ? (usage / totalAvailableChromebooks) * 100 : 0;

                      let color = "bg-zinc-200/60 dark:bg-zinc-700/30";
                      if (rate >= 100) color = "bg-red-600 dark:bg-red-500";
                      else if (rate >= 75) color = "bg-orange-600 dark:bg-orange-500";
                      else if (rate >= 30) color = "bg-orange-400";
                      else if (rate > 0) color = "bg-amber-300 dark:bg-amber-400";

                      return (
                        <div
                          key={slot}
                          className={cn("flex-1 h-full relative", color, "opacity-90")}
                          title={`${slot}: ${usage} Chromebooks`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* CORPO ROLÁVEL COM TODOS OS HORÁRIOS ATÉ O ÚLTIMO (17h40)  */}
        {/* ========================================================= */}
        <div
          ref={scrollContainerRef}
          className="relative max-h-[440px] sm:max-h-[480px] overflow-y-auto overflow-x-hidden select-none scroll-smooth schedule-showcase-scroll"
        >
          {/* ========================================================= */}
          {/* LINHA INDICADORA DE HORÁRIO ATUAL (AGORA) EM TEMPO REAL   */}
          {/* ========================================================= */}
          {currentTimeTopPx !== null && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none flex items-center transition-all duration-300"
              style={{ top: `${currentTimeTopPx}px` }}
            >
              {/* Badge com a hora exata */}
              <div
                className="bg-red-600 text-white font-black text-[10px] px-1.5 py-0.5 shadow-[2px_2px_0_0_#000] border-2 border-black tracking-wider flex items-center justify-center gap-1 z-40 shrink-0"
                style={{ width: timeColumnWidth }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                <span className="font-mono">{format(now, 'HH:mm')}</span>
              </div>

              {/* Linha vermelha de alta visibilidade cruzando a grade */}
              <div className="flex-1 h-[3px] bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.95)] relative flex items-center">
                {/* Marcador flutuante em 'Hoje' */}
                {todayColumnIndex !== -1 && (
                  <div
                    className="absolute -top-3 transform -translate-x-1/2 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0_0_#000] tracking-widest z-40"
                    style={{
                      left: `${((todayColumnIndex + 0.5) / weekDays.length) * 100}%`
                    }}
                  >
                    AGORA
                  </div>
                )}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white shadow-sm" />
              </div>
            </div>
          )}

          <div
            className="grid gap-0 relative z-10 w-full"
            style={{ gridTemplateColumns }}
          >
            {allSlots.map((slot, timeIndex) => {
              const [hourStr, minuteStr] = slot.split('h');

              return (
                <React.Fragment key={timeIndex}>
                  {/* Coluna de Horário Fixa à Esquerda */}
                  <div
                    className="h-[60px] flex items-center justify-center border-b-2 border-r-4 border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 sticky left-0 z-20"
                    style={{ width: timeColumnWidth }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="bg-white dark:bg-zinc-900 px-2 py-0.5 border-2 border-black dark:border-white shadow-[1px_1px_0_0_#000]">
                        <span className="text-[11px] font-bold tracking-tight uppercase text-zinc-700 dark:text-zinc-300">
                          {slot.replace('h', ':')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5 Células de Dias para este Horário */}
                  {weekDays.map((day, dayIndex) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const slotKey = `${dateKey}_${slot}`;
                    const slotReservations = reservationsMap.get(slotKey) || [];

                    // Calcula se o slot já passou
                    const slotTime = new Date(day);
                    slotTime.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);
                    const isPast = slotTime < now;

                    const isAvailable = slotReservations.length === 0;

                    return (
                      <div
                        key={dayIndex}
                        className="h-[60px] border-b border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 p-1 relative"
                      >
                        {/* Caso 1: Horário passado e vazio -> ENCERRADO */}
                        {isAvailable && isPast && (
                          <div className="h-full border-[2.5px] border-dashed border-zinc-400 dark:border-zinc-600 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-lg flex items-center justify-center gap-1 opacity-80 cursor-default">
                            <Clock className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                            <span className="text-[8px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                              Encerrado
                            </span>
                          </div>
                        )}

                        {/* Caso 2: Horário livre e futuro -> Slot com pontilhado e ícone + */}
                        {isAvailable && !isPast && (
                          <div className="h-full border-[2.5px] border-dashed border-zinc-400 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-lg flex items-center justify-center group cursor-default">
                            <Plus className="h-4 w-4 text-zinc-400 group-hover:scale-110 transition-transform" />
                          </div>
                        )}

                        {/* Caso 3: Horário reservado -> Card colorido oficial */}
                        {!isAvailable && (
                          <div className="h-full p-1 border-2 border-warning bg-warning/10 rounded-lg flex flex-col justify-center gap-1">
                            {slotReservations.slice(0, 2).map(res => {
                              const isMinecraft = res.is_minecraft;
                              const roomName = res.classroom ? res.classroom.split(' - ')[0].toUpperCase() : 'SALA';

                              return (
                                <div
                                  key={res.id}
                                  className={cn(
                                    "w-full flex items-center justify-between text-[9px] font-black uppercase px-1.5 py-1 border border-black rounded shadow-[2px_2px_0_0_#000] text-white truncate",
                                    isMinecraft
                                      ? "bg-gradient-to-br from-[#2d5a27] to-[#1e3c1a]"
                                      : "bg-gradient-to-br from-blue-600 to-indigo-600"
                                  )}
                                >
                                  <span className="truncate flex-1 text-left">{roomName}</span>
                                  {res.quantity_requested > 0 && (
                                    <span className="inline-flex items-center gap-0.5 ml-1 bg-black/25 px-1 py-0.5 rounded text-[8px] leading-none shrink-0">
                                      <Laptop className="h-2.5 w-2.5" />
                                      <span>{res.quantity_requested}</span>
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>

          {/* Faixa de Término no Final do Scroll */}
          <div className="py-2.5 px-3 border-t-2 border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest">
            <span>● Término das aulas • 18h30</span>
            <span>13 Horários Completos (07h10 até 17h40)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

