import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Clock, Calendar, Search } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { PeriodView } from '@/hooks/useDashboardData';

interface DashboardFilterProps {
  periodView: PeriodView;
  setPeriodView: (view: PeriodView) => void;
  startHour: number;
  setStartHour: (hour: number) => void;
  endHour: number;
  setEndHour: (hour: number) => void;
  onApply: () => void;
  loading: boolean;
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
  periodView,
  setPeriodView,
  startHour,
  setStartHour,
  endHour,
  setEndHour,
  onApply,
  loading,
}) => {
  const isHistoryOrReports = periodView === 'history' || periodView === 'reports';

  return (
    <GlassCard className="p-4 border-blue-200/50 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Filtros de Análise</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
        
        {/* 1. Seleção de Período (Mantida nas Tabs, mas incluída aqui para contexto) */}
        {/* <div className="space-y-2">
          <Label>Período</Label>
          <Select value={periodView} onValueChange={(v) => setPeriodView(v as PeriodView)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div> */}

        {/* 2. Hora Inicial */}
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

        {/* 3. Hora Final */}
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
        
        {/* 4. Botão Aplicar (Apenas para forçar o recálculo se necessário) */}
        <Button 
          onClick={onApply} 
          disabled={loading || isHistoryOrReports || startHour >= endHour}
          className="w-full sm:col-span-1"
        >
          Aplicar Filtro de Hora
        </Button>
      </div>
      
      {startHour >= endHour && (
        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            A hora de início deve ser menor que a hora de fim.
        </p>
      )}
      
      {isHistoryOrReports && (
        <p className="text-sm text-muted-foreground mt-2">
            Os filtros de hora são aplicáveis apenas nas visualizações Diária, Semanal e Mensal.
        </p>
      )}
    </GlassCard>
  );
};