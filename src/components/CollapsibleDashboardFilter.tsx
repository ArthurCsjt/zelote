import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Clock, AlertTriangle, ChevronDown, ChevronUp, Calendar, CalendarRange, CalendarDays, Clock4, ArrowRight } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay, isBefore, isAfter, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface CollapsibleDashboardFilterProps {
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  startHour: number;
  setStartHour: (hour: number) => void;
  endHour: number;
  setEndHour: (hour: number) => void;
  onApply: () => void; // Mantido para ser chamado no clique
  loading: boolean;
}

export const CollapsibleDashboardFilter: React.FC<CollapsibleDashboardFilterProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startHour,
  setStartHour,
  endHour,
  setEndHour,
  onApply,
  loading,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  const isHourFilterInvalid = startHour >= endHour;
  const isDateRangeInvalid = startDate && endDate && isBefore(endDate, startDate);
  const isFilterInvalid = isHourFilterInvalid || isDateRangeInvalid || !startDate || !endDate;

  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return;

    const newDate = new Date(date);

    if (type === 'start') {
      // Mantém a hora atual do startHour e define minutos/segundos para 0
      newDate.setHours(startHour, 0, 0, 0);
      setStartDate(newDate);
      setIsStartCalendarOpen(false);

      // Se o endDate for anterior ao novo startDate, ajusta o endDate
      if (endDate && isBefore(endDate, newDate)) {
        setEndDate(newDate);
      }
    } else {
      // Mantém a hora atual do endHour e define minutos/segundos para 59/999
      newDate.setHours(endHour, 59, 59, 999);
      setEndDate(newDate);
      setIsEndCalendarOpen(false);

      // Se o startDate for posterior ao novo endDate, ajusta o startDate
      if (startDate && isAfter(startDate, newDate)) {
        setStartDate(newDate);
      }
    }
  };

  const handleHourChange = (hour: number, type: 'start' | 'end') => {
    // Garante que a hora esteja entre 0 e 23
    const safeHour = Math.max(0, Math.min(23, hour));

    if (type === 'start') {
      setStartHour(safeHour);
      if (startDate) {
        const newDate = new Date(startDate);
        newDate.setHours(safeHour, 0, 0, 0);
        setStartDate(newDate);
      }
    } else {
      setEndHour(safeHour);
      if (endDate) {
        const newDate = new Date(endDate);
        newDate.setHours(safeHour, 59, 59, 999);
        setEndDate(newDate);
      }
    }
  };

  const handlePreset = (preset: 'today' | 'last7days' | 'thisMonth') => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'last7days':
        start = startOfDay(subDays(now, 6));
        end = endOfDay(now);
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfDay(now); // Vai até o final do dia atual
        break;
      default:
        return;
    }

    // Aplica as horas atuais do filtro para manter a consistência
    start.setHours(startHour, 0, 0, 0);
    end.setHours(endHour, 59, 59, 999);

    setStartDate(start);
    setEndDate(end);
    onApply(); // Aplica o filtro imediatamente
  };

  return (
    <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border-b-2 border-black dark:border-white">
            <div className="flex items-center gap-3">
              <div className="p-1 border-2 border-black dark:border-white bg-blue-300 dark:bg-blue-900">
                <CalendarRange className="h-5 w-5 text-black dark:text-white" />
              </div>
              <h3 className="text-lg font-black uppercase text-black dark:text-white tracking-tight">Intervalo de Análise</h3>
              {isFilterInvalid && (
                <div className="bg-red-500 text-white font-bold px-2 py-0.5 border-2 border-black text-xs uppercase flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Inválido
                </div>
              )}
            </div>
            <div className="p-1 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {isOpen ? <ChevronUp className="h-4 w-4 text-black dark:text-white" /> : <ChevronDown className="h-4 w-4 text-black dark:text-white" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-6 p-6 bg-gray-50 dark:bg-zinc-900/50">

          {/* 1. Predefinições */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase flex items-center gap-1 text-gray-500">
              <CalendarDays className="h-3 w-3" /> Predefinições de Período
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => handlePreset('today')}
                disabled={loading}
                className="h-10 text-xs uppercase font-bold border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePreset('last7days')}
                disabled={loading}
                className="h-10 text-xs uppercase font-bold border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800"
              >
                Últimos 7 Dias
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePreset('thisMonth')}
                disabled={loading}
                className="h-10 text-xs uppercase font-bold border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800"
              >
                Mês Atual
              </Button>
            </div>
          </div>

          {/* 2. Seleção de Data e Hora */}
          <div className="space-y-4 p-6 border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
            <h4 className="text-base font-black uppercase flex items-center gap-2 text-black dark:text-white">
              <CalendarRange className="h-5 w-5" />
              Definir Datas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Data Início */}
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-xs font-bold uppercase">Data Início</Label>
                <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-bold uppercase border-2 border-black dark:border-white rounded-none h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950",
                        !startDate && "text-muted-foreground",
                        isDateRangeInvalid && "border-red-500 text-red-500"
                      )}
                      disabled={loading}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "SELECIONE"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate || undefined}
                      onSelect={(date) => handleDateSelect(date, 'start')}
                      initialFocus
                      className="rounded-none bg-white dark:bg-zinc-900"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Fim */}
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-xs font-bold uppercase">Data Fim</Label>
                <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-bold uppercase border-2 border-black dark:border-white rounded-none h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950",
                        !endDate && "text-muted-foreground",
                        isDateRangeInvalid && "border-red-500 text-red-500"
                      )}
                      disabled={loading}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "SELECIONE"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate || undefined}
                      onSelect={(date) => handleDateSelect(date, 'end')}
                      initialFocus
                      className="rounded-none bg-white dark:bg-zinc-900"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {isDateRangeInvalid && (
              <div className="text-sm font-bold text-red-500 bg-red-100 border-2 border-red-500 p-2 flex items-center gap-2 uppercase">
                <AlertTriangle className="h-4 w-4" />
                Data de início deve ser anterior ao fim!
              </div>
            )}
          </div>

          {/* 3. Seleção de Hora */}
          <div className="space-y-4 p-6 border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
            <h4 className="text-base font-black uppercase flex items-center gap-2 text-black dark:text-white">
              <Clock4 className="h-5 w-5" />
              Horário (Pico de Uso)
            </h4>
            <div className="grid grid-cols-3 gap-4 items-end">

              {/* Hora Inicial */}
              <div className="space-y-2">
                <Label htmlFor="start-hour" className="text-xs font-bold uppercase">Início (0-23h)</Label>
                <Input
                  id="start-hour"
                  type="number"
                  min="0"
                  max="23"
                  value={startHour}
                  onChange={(e) => handleHourChange(parseInt(e.target.value) || 0, 'start')}
                  disabled={loading}
                  className={cn(
                    "text-center font-bold text-lg border-2 border-black dark:border-white rounded-none h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950",
                    isHourFilterInvalid && "border-red-500 text-red-500"
                  )}
                />
              </div>

              {/* Separador Visual */}
              <div className="flex items-center justify-center h-full pb-4">
                <ArrowRight className="h-6 w-6 text-black dark:text-white" />
              </div>

              {/* Hora Final */}
              <div className="space-y-2">
                <Label htmlFor="end-hour" className="text-xs font-bold uppercase">Fim (0-23h)</Label>
                <Input
                  id="end-hour"
                  type="number"
                  min="0"
                  max="23"
                  value={endHour}
                  onChange={(e) => handleHourChange(parseInt(e.target.value) || 0, 'end')}
                  disabled={loading}
                  className={cn(
                    "text-center font-bold text-lg border-2 border-black dark:border-white rounded-none h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950",
                    isHourFilterInvalid && "border-red-500 text-red-500"
                  )}
                />
              </div>
            </div>

            {isHourFilterInvalid && (
              <div className="text-sm font-bold text-red-500 bg-red-100 border-2 border-red-500 p-2 flex items-center gap-2 uppercase">
                <AlertTriangle className="h-4 w-4" />
                Hora fim deve ser maior que início!
              </div>
            )}
          </div>

          {/* 4. Botão Aplicar */}
          <div className="pt-2">
            <Button
              onClick={onApply}
              disabled={loading || isFilterInvalid}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-14 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:transform active:translate-x-[6px] active:translate-y-[6px] transition-all rounded-none text-lg"
            >
              Aplicar Filtro
            </Button>
          </div>

        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};