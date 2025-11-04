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
    <GlassCard className="p-0 border-blue-200/50 shadow-lg">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-xl">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Intervalo de Análise</h3>
              {isFilterInvalid && (
                <AlertTriangle className="h-4 w-4 text-destructive" title="Filtro inválido" />
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-6 p-4 pt-0 border-t border-gray-100 dark:border-border">
          
          {/* 1. Predefinições */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> Predefinições de Período
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handlePreset('today')} 
                disabled={loading}
                className="h-9 text-xs"
              >
                Hoje
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handlePreset('last7days')} 
                disabled={loading}
                className="h-9 text-xs"
              >
                Últimos 7 Dias
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handlePreset('thisMonth')} 
                disabled={loading}
                className="h-9 text-xs"
              >
                Mês Atual
              </Button>
            </div>
          </div>
          
          {/* 2. Seleção de Data e Hora */}
          <div className="space-y-4 p-4 border rounded-lg bg-white shadow-inner dark:bg-card/50 dark:border-border">
            <h4 className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CalendarRange className="h-4 w-4" />
                Datas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Data Início */}
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-xs font-medium">Data Início</Label>
                <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input dark:bg-input dark:border-border",
                        !startDate && "text-muted-foreground",
                        isDateRangeInvalid && "border-destructive ring-destructive"
                      )}
                      disabled={loading}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data de início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate || undefined}
                      onSelect={(date) => handleDateSelect(date, 'start')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Fim */}
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-xs font-medium">Data Fim</Label>
                <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input dark:bg-input dark:border-border",
                        !endDate && "text-muted-foreground",
                        isDateRangeInvalid && "border-destructive ring-destructive"
                      )}
                      disabled={loading}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione a data de fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate || undefined}
                      onSelect={(date) => handleDateSelect(date, 'end')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {isDateRangeInvalid && (
                <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    A data de início deve ser anterior ou igual à data de fim.
                </p>
            )}
          </div>
          
          {/* 3. Seleção de Hora */}
          <div className="space-y-4 p-4 border rounded-lg bg-white shadow-inner dark:bg-card/50 dark:border-border">
            <h4 className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Clock4 className="h-4 w-4" />
                Horário de Análise (Pico de Uso)
            </h4>
            <div className="grid grid-cols-3 gap-4 items-end">
              
              {/* Hora Inicial */}
              <div className="space-y-2">
                <Label htmlFor="start-hour" className="text-xs font-medium">Hora Início (0-23)</Label>
                <Input
                  id="start-hour"
                  type="number"
                  min="0"
                  max="23"
                  value={startHour}
                  onChange={(e) => handleHourChange(parseInt(e.target.value) || 0, 'start')}
                  disabled={loading}
                  className={cn("text-center bg-input dark:bg-input dark:border-border", isHourFilterInvalid && "border-destructive ring-destructive")}
                />
              </div>

              {/* Separador Visual */}
              <div className="flex items-center justify-center h-full">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Hora Final */}
              <div className="space-y-2">
                <Label htmlFor="end-hour" className="text-xs font-medium">Hora Fim (0-23)</Label>
                <Input
                  id="end-hour"
                  type="number"
                  min="0"
                  max="23"
                  value={endHour}
                  onChange={(e) => handleHourChange(parseInt(e.target.value) || 0, 'end')}
                  disabled={loading}
                  className={cn("text-center bg-input dark:bg-input dark:border-border", isHourFilterInvalid && "border-destructive ring-destructive")}
                />
              </div>
            </div>
            
            {isHourFilterInvalid && (
                <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    A hora de início deve ser menor que a hora de fim.
                </p>
            )}
          </div>
          
          {/* 4. Botão Aplicar */}
          <div className="pt-2">
            <Button 
              onClick={onApply} 
              disabled={loading || isFilterInvalid}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Aplicar Filtro
            </Button>
          </div>
          
        </CollapsibleContent>
      </Collapsible>
    </GlassCard>
  );
};