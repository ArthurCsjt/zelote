import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Monitor, AlertTriangle } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getStartOfWeek, formatWeekRange, changeWeek, getWeekDays } from '@/utils/scheduling';
import { SchedulingCalendar } from '@/components/scheduling/SchedulingCalendar';
import { SectionHeader } from '@/components/Shared/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Função para buscar a lista de professores (para o Combobox)
const fetchProfessores = async () => {
    const { data, error } = await supabase
        .from('professores')
        .select('id, nome_completo')
        .order('nome_completo', { ascending: true });
    if (error) throw error;
    return data;
};

const SchedulingPage = () => {
  const { user } = useAuth();
  const { getReservationsForWeek, getTotalAvailableChromebooks } = useDatabase();
  
  // Estado para controlar a semana atual (usamos a Segunda-feira como referência)
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  
  // Datas de início e fim da semana para a busca no DB
  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const startDate = format(weekDays[0], 'yyyy-MM-dd');
  const endDate = format(weekDays[weekDays.length - 1], 'yyyy-MM-dd');
  
  // Query 1: Total de Chromebooks disponíveis
  const { data: totalAvailableChromebooks = 0, isLoading: isLoadingTotal } = useQuery({
    queryKey: ['totalAvailableChromebooks'],
    queryFn: getTotalAvailableChromebooks,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
  
  // Query 2: Reservas da semana
  const { data: reservations = [], isLoading: isLoadingReservations, refetch } = useQuery({
    queryKey: ['reservations', startDate, endDate],
    queryFn: () => getReservationsForWeek(startDate, endDate),
    enabled: !!user,
  });
  
  // Query 3: Lista de Professores (para o formulário)
  const { data: professores = [], isLoading: isLoadingProfessores } = useQuery({
    queryKey: ['professoresList'],
    queryFn: fetchProfessores,
    staleTime: Infinity,
  });

  const handleWeekChange = (direction: 'next' | 'prev') => {
    setCurrentWeekStart(prev => changeWeek(prev, direction));
  };
  
  const handleGoToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };
  
  const handleReservationSuccess = () => {
    refetch(); // Recarrega as reservas após uma inserção bem-sucedida
  };
  
  const isLoading = isLoadingTotal || isLoadingReservations || isLoadingProfessores;

  return (
    <Layout 
      title="Agendamento de Chromebooks" 
      subtitle="Reserve lotes de equipamentos para suas aulas" 
      showBackButton 
      onBack={() => window.history.back()}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header e Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <SectionHeader 
            title="Agendamento de Reservas" 
            description="Gerencie a disponibilidade semanal de Chromebooks."
            icon={Calendar}
            iconColor="text-menu-violet"
          />
          
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v: 'weekly' | 'monthly') => v && setViewMode(v)}
            className="h-10 bg-card border border-border"
          >
            <ToggleGroupItem value="weekly" aria-label="Visualização Semanal" className="h-10 px-4">
              🗓️ Semanal
            </ToggleGroupItem>
            <ToggleGroupItem value="monthly" aria-label="Visualização Mensal" className="h-10 px-4" disabled>
              📅 Mensal (Em breve)
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {/* Card de Status e Navegação */}
        <GlassCard className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Navegação de Semana */}
                <nav className="flex items-center gap-2 font-semibold text-lg w-full md:w-auto">
                    <Button variant="outline" size="icon" onClick={() => handleWeekChange('prev')} disabled={isLoading}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-base text-foreground min-w-[200px] text-center">
                        {formatWeekRange(currentWeekStart)}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => handleWeekChange('next')} disabled={isLoading}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleGoToToday} disabled={isLoading} className="ml-2">
                        Hoje
                    </Button>
                </nav>
                
                {/* Status de Disponibilidade */}
                <div className="flex items-center gap-2 text-lg font-bold text-primary w-full md:w-auto justify-end">
                    <Monitor className="h-5 w-5" />
                    {isLoadingTotal ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <span>{totalAvailableChromebooks} 💻 Disponíveis</span>
                    )}
                </div>
            </div>
            
            {/* Aviso de Fim de Semana (Se a data atual não for um dia útil) */}
            {weekDays.length === 0 && (
                <div className="text-center p-4 bg-warning-bg border border-warning/50 rounded-lg text-warning-foreground">
                    <AlertTriangle className="h-5 w-5 inline mr-2" />
                    Esta semana não contém dias úteis (Segunda a Sexta).
                </div>
            )}
        </GlassCard>

        {/* Calendário de Agendamento */}
        <GlassCard className="p-4 overflow-x-auto">
          <SchedulingCalendar
            currentDate={currentWeekStart}
            reservations={reservations}
            totalAvailableChromebooks={totalAvailableChromebooks}
            currentUser={user}
            isLoading={isLoading}
            onReservationSuccess={handleReservationSuccess}
            professores={professores.map(p => ({ id: p.id, nome_completo: p.nome_completo }))}
          />
        </GlassCard>
      </div>
    </Layout>
  );
};

export default SchedulingPage;