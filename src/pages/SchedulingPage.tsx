import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Monitor, AlertTriangle } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // IMPORT CORRIGIDO AQUI
import { getStartOfWeek, formatWeekRange, changeWeek, getWeekDays, changeMonth } from '@/utils/scheduling';
import { SchedulingCalendar } from '@/components/scheduling/SchedulingCalendar';
import { SchedulingMonthView } from '@/components/scheduling/SchedulingMonthView'; // NOVO IMPORT
import { SectionHeader } from '@/components/Shared/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom'; // Importando useNavigate

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
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Inicializando useNavigate
  
  // Estado para controlar a data de referência (pode ser o início da semana ou o mês atual)
  const [currentDate, setCurrentDate] = useState(getStartOfWeek(new Date()));
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  
  // Define o intervalo de busca no DB baseado no modo de visualização
  const { startDate, endDate, displayRange } = useMemo(() => {
    if (viewMode === 'weekly') {
      const weekDays = getWeekDays(currentDate);
      const start = format(weekDays[0], 'yyyy-MM-dd');
      const end = format(weekDays[weekDays.length - 1], 'yyyy-MM-dd');
      return {
        startDate: start,
        endDate: end,
        displayRange: formatWeekRange(currentDate),
      };
    } else { // monthly
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        // CORREÇÃO: Passando ptBR para format
        displayRange: format(currentDate, 'MMMM yyyy', { locale: ptBR }).charAt(0).toUpperCase() + format(currentDate, 'MMMM yyyy', { locale: ptBR }).slice(1),
      };
    }
  }, [currentDate, viewMode]);
  
  // Query 1: Total de Chromebooks disponíveis
  const { data: totalAvailableChromebooks = 0, isLoading: isLoadingTotal } = useQuery({
    queryKey: ['totalAvailableChromebooks'],
    queryFn: getTotalAvailableChromebooks,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
  
  // Query 2: Reservas da semana/mês
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

  const handleDateChange = (direction: 'next' | 'prev') => {
    if (viewMode === 'weekly') {
      setCurrentDate(prev => changeWeek(prev, direction));
    } else {
      setCurrentDate(prev => changeMonth(prev, direction));
    }
  };
  
  const handleViewModeChange = (v: 'weekly' | 'monthly') => {
    setViewMode(v);
    // Ao mudar a visualização, reajusta a data de referência para o início da semana/mês atual
    if (v === 'weekly') {
        setCurrentDate(getStartOfWeek(new Date()));
    } else {
        setCurrentDate(startOfMonth(new Date()));
    }
  };
  
  const handleReservationSuccess = () => {
    refetch(); // Recarrega as reservas após uma inserção bem-sucedida
    queryClient.invalidateQueries({ queryKey: ['totalAvailableChromebooks'] });
  };
  
  const isLoading = isLoadingTotal || isLoadingReservations || isLoadingProfessores;

  return (
    <Layout 
      title="Agendamento de Chromebooks" 
      subtitle="Reserve lotes de equipamentos para suas aulas" 
      showBackButton 
      onBack={() => navigate('/')} // ALTERADO: Navega para a rota raiz (menu principal)
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header e Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <SectionHeader 
            title="Agendamento de Reservas" 
            description="Gerencie a disponibilidade semanal ou mensal de Chromebooks."
            icon={Calendar}
            iconColor="text-menu-violet"
          />
          
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v: 'weekly' | 'monthly') => v && handleViewModeChange(v)}
            className="h-10 bg-card border border-border"
          >
            <ToggleGroupItem value="weekly" aria-label="Visualização Semanal" className="h-10 px-4">
              🗓️ Semanal
            </ToggleGroupItem>
            <ToggleGroupItem value="monthly" aria-label="Visualização Mensal" className="h-10 px-4">
              📅 Mensal
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {/* Card de Status e Navegação */}
        <GlassCard className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                {/* Navegação de Semana/Mês */}
                <nav className="flex items-center gap-4 font-semibold text-lg">
                    <Button variant="outline" size="icon" onClick={() => handleDateChange('prev')} disabled={isLoading}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-base text-foreground min-w-[250px] text-center">
                        {displayRange}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => handleDateChange('next')} disabled={isLoading}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </nav>
                
                {/* Status de Disponibilidade */}
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                    <Monitor className="h-5 w-5" />
                    {isLoadingTotal ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <span>{totalAvailableChromebooks} 💻 Disponíveis</span>
                    )}
                </div>
            </div>
            
            {/* Aviso de Fim de Semana (Apenas na visualização semanal) */}
            {viewMode === 'weekly' && getWeekDays(currentDate).length === 0 && (
                <div className="text-center p-4 bg-warning-bg border border-warning/50 rounded-lg text-warning-foreground">
                    <AlertTriangle className="h-5 w-5 inline mr-2" />
                    Esta semana não contém dias úteis (Segunda a Sexta).
                </div>
            )}
        </GlassCard>

        {/* Calendário de Agendamento */}
        <GlassCard className="p-4 overflow-x-auto">
          {viewMode === 'weekly' ? (
            <SchedulingCalendar
              currentDate={currentDate}
              reservations={reservations}
              totalAvailableChromebooks={totalAvailableChromebooks}
              currentUser={user}
              isLoading={isLoading}
              onReservationSuccess={handleReservationSuccess}
              professores={professores.map(p => ({ id: p.id, nome_completo: p.nome_completo }))}
            />
          ) : (
            <SchedulingMonthView
              currentDate={currentDate}
              reservations={reservations}
              totalAvailableChromebooks={totalAvailableChromebooks}
              isLoading={isLoading}
            />
          )}
        </GlassCard>
      </div>
    </Layout>
  );
};

export default SchedulingPage;