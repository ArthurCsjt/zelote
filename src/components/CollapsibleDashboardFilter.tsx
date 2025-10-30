import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Clock, AlertTriangle, ChevronDown, ChevronUp, Calendar, CalendarRange } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';

interface CollapsibleDashboardFilterProps {
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  startHour: number;
  setStartHour: (hour: number) => void;
  endHour: number;
  setEndHour: (hour: number) => void;
  onApply: () => void;
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
  const isFilterInvalid = isHourFilterInvalid || isDateRangeInvalid;
  
  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return;

    const newDate = new Date(date);
    
    if (type === 'start') {
        // Mantém a hora atual do startHour
        newDate.setHours(startHour, 0, 0, 0);
        setStartDate(newDate);
        setIsStartCalendarOpen(false);
        
        // Se o endDate for anterior ao novo startDate, ajusta o endDate
        if (endDate && isBefore(endDate, newDate)) {
            setEndDate(newDate);
        }
    } else {
        // Mantém a hora atual do endHour
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
              <h3 className="text-lg font-semibold text-gray-800">Intervalo de Análise</h3>
              {isFilterInvalid && (
                <AlertTriangle className="h-4 w-4 text-destructive" title="Filtro de hora inválido" />
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 p-4 pt-0 border-t border-gray-100">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Data Inicial */}
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" /> Data Início
              </Label>
              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
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

            {/* 2. Data Final */}
            <div className="space-y-2">
              <Label htmlFor="end-date" className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" /> Data Fim
              </Label>
              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
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
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-2">
            
            {/* 3. Hora Inicial */}
            <div className="space-y-2">
              <Label htmlFor="start-hour" className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3" /> Hora Início (0-23)
              </Label>
              <Input
                id="start-hour"
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => handleHourChange(parseInt(e.target.value) || 0, 'start')}
                disabled={loading}
                className="text-center"
              />
            </div>

            {/* 4. Hora Final */}
            <div className="space-y-2">
              <Label htmlFor="end-hour" className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3" /> Hora Fim (0-23)
              </Label>
              <Input
                id="end-hour"
                type="number"
                min="0"
                max="23"
                value={endHour}
                onChange={(e) => handleHourChange(parseInt(e.target.value) || 0, 'end')}
                disabled={loading}
                className="text-center"
              />
            </div>
            
            {/* 5. Botão Aplicar */}
            <Button 
              onClick={onApply} 
              disabled={loading || isFilterInvalid || !startDate || !endDate}
              className="w-full sm:col-span-1"
            >
              Aplicar Filtro
            </Button>
          </div>
          
          {isFilterInvalid && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                <AlertTriangle className="h-4 w-4" />
                {isDateRangeInvalid ? 'A data de início deve ser anterior à data de fim.' : 'A hora de início deve ser menor que a hora de fim.'}
            </p>
          )}
          
        </CollapsibleContent>
      </Collapsible>
    </GlassCard>
  );
};