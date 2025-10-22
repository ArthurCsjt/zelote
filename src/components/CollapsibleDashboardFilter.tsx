import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { PeriodView } from '@/hooks/useDashboardData';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';

interface CollapsibleDashboardFilterProps {
  periodView: PeriodView;
  startHour: number;
  setStartHour: (hour: number) => void;
  endHour: number;
  setEndHour: (hour: number) => void;
  onApply: () => void;
  loading: boolean;
}

export const CollapsibleDashboardFilter: React.FC<CollapsibleDashboardFilterProps> = ({
  periodView,
  startHour,
  setStartHour,
  endHour,
  setEndHour,
  onApply,
  loading,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isHistoryOrReports = periodView === 'history' || periodView === 'reports';
  const isHourFilterInvalid = startHour >= endHour;

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
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Filtros de Análise</h3>
              {isHourFilterInvalid && !isHistoryOrReports && (
                <AlertTriangle className="h-4 w-4 text-destructive" title="Filtro de hora inválido" />
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 p-4 pt-0 border-t border-gray-100">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            
            {/* 1. Hora Inicial */}
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
                onChange={(e) => setStartHour(parseInt(e.target.value) || 0)}
                disabled={loading || isHistoryOrReports}
                className="text-center"
              />
            </div>

            {/* 2. Hora Final */}
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
                onChange={(e) => setEndHour(parseInt(e.target.value) || 0)}
                disabled={loading || isHistoryOrReports}
                className="text-center"
              />
            </div>
            
            {/* 3. Botão Aplicar */}
            <Button 
              onClick={onApply} 
              disabled={loading || isHistoryOrReports || isHourFilterInvalid}
              className="w-full sm:col-span-1"
            >
              Aplicar Filtro de Hora
            </Button>
          </div>
          
          {isHourFilterInvalid && !isHistoryOrReports && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                <AlertTriangle className="h-4 w-4" />
                A hora de início deve ser menor que a hora de fim.
            </p>
          )}
          
          {isHistoryOrReports && (
            <p className="text-sm text-muted-foreground mt-2">
                Os filtros de hora são aplicáveis apenas nas visualizações Diária, Semanal e Mensal.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </GlassCard>
  );
};