import React, { useState, useEffect, useCallback } from 'react';
import { useDashboardData, PeriodView } from '@/hooks/useDashboardData';
import { CollapsibleDashboardFilter } from './CollapsibleDashboardFilter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, Waves, TrendingUp, Computer, Clock, Info, Activity } from 'lucide-react';
import { DashboardDetailDialog } from './DashboardDetailDialog';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { GlassCard } from './ui/GlassCard';
import { LoanHistoryItem, Chromebook } from '@/types/database';
import { TopLoanContextsPanel } from './TopLoanContextsPanel';
import { Progress } from './ui/progress';
import { TooltipProvider, Tooltip as ShadcnTooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';

interface DashboardProps {
  onBack?: () => void;
}

// Componente auxiliar para renderizar o grid de estatísticas
const StatsGrid = ({ periodView, stats, filteredLoans = [], filteredReturns = [], loading, onCardClick, history, isMounted }: any) => {
  if (periodView === 'history' || periodView === 'reports') return null;

  // Desestruturação segura, usando valores padrão se stats for null/undefined
  const { 
    totalActive = 0, 
    totalChromebooks = 0, 
    totalInventoryUsageRate = 0, 
    usageRateColor = 'green', // NOVO
    availableChromebooks = 0, 
    averageUsageTime = 0, 
    completionRate = 0, 
    maxOccupancyRate = 0,
    occupancyRateColor = 'green', // NOVO
  } = stats || {};

  // Função para determinar se o empréstimo está em atraso
  const isOverdue = (loan: LoanHistoryItem) => {
    return loan.expected_return_date && new Date(loan.expected_return_date) < new Date();
  };
  
  const getColorClasses = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green': return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50', border: 'border-green-500', gradient: 'from-green-600 to-emerald-600' };
      case 'yellow': return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-500', gradient: 'from-amber-600 to-orange-600' };
      case 'red': return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50', border: 'border-red-500', gradient: 'from-red-600 to-red-800' };
      default: return { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-950/50', border: 'border-gray-500', gradient: 'from-gray-600 to-gray-800' };
    }
  };
  
  const usageColors = getColorClasses(usageRateColor);
  const picoColors = getColorClasses(occupancyRateColor);

  // REMOVIDO: Lógica de animação baseada em isMounted
  const getAnimationClass = (delay: number) => ''; 

  return (
    <TooltipProvider>
      {/* Grid principal com 4 colunas em telas grandes */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4 relative z-10">
        
        {/* CARD 1: TAXA DE USO (Neste Instante) - DESTAQUE */}
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 md:col-span-2 p-6", usageColors.border.replace('border-', 'border-l-'), getAnimationClass(0))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-base font-bold flex items-center gap-1 cursor-help text-gray-700 dark:text-gray-300">
                  TAXA DE USO (Tempo Real)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Porcentagem de equipamentos móveis (não fixos) que estão atualmente emprestados.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Waves className={cn("h-6 w-6 sm:h-8 sm:w-8 animate-pulse", usageColors.text)} />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className={cn("text-4xl sm:text-6xl font-extrabold bg-clip-text text-transparent", `bg-gradient-to-r ${usageColors.gradient}`)}>
              {totalInventoryUsageRate.toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Uso atual do inventário móvel
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 2: TAXA DE USO (Pico no Período) - DESTAQUE */}
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 md:col-span-2 p-6", picoColors.border.replace('border-', 'border-l-'), getAnimationClass(100))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-base font-bold flex items-center gap-1 cursor-help text-gray-700 dark:text-gray-300">
                  TAXA DE USO (Pico no Período)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>O pico de uso (em %) atingido durante o período e horário selecionados no filtro.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <TrendingUp className={cn("h-6 w-6 sm:h-8 sm:w-8", picoColors.text)} />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className={cn("text-4xl sm:text-6xl font-extrabold bg-clip-text text-transparent", `bg-gradient-to-r ${picoColors.gradient}`)}>
              {maxOccupancyRate.toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pico de uso no período filtrado
            </p>
          </CardContent>
        </GlassCard>
        
        {/* LINHA 2: Cards Menores (4 colunas em md) */}
        
        {/* CARD 3: Empréstimos Ativos (Contagem de ativos) */}
        <GlassCard 
          className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500 cursor-pointer p-4", getAnimationClass(200))}
          onClick={() => onCardClick('Empréstimos Ativos', 'Lista de todos os Chromebooks atualmente emprestados.', 'loans', history.filter((loan: LoanHistoryItem) => !loan.return_date).map((loan: LoanHistoryItem) => ({
            id: loan.id,
            chromebook_id: loan.chromebook_id,
            model: loan.chromebook_model,
            loan_date: loan.loan_date,
            expected_return_date: loan.expected_return_date,
            student_name: loan.student_name,
            isOverdue: isOverdue(loan),
          })))}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Empréstimos Ativos
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Número de Chromebooks atualmente emprestados (status 'emprestado'). Clique para ver a lista.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{totalActive}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {filteredLoans.length} empréstimos no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 4: Disponíveis (Clicável para ver a lista) */}
        <GlassCard 
          className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500 cursor-pointer p-4", getAnimationClass(300))}
          onClick={() => onCardClick('Disponíveis', 'Lista de Chromebooks prontos para empréstimo.', 'chromebooks', null, 'disponivel')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Disponíveis
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Número de Chromebooks com status 'disponível' no inventário. Clique para ver a lista.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{availableChromebooks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              de {totalChromebooks} no total
            </p>
          </CardContent>
        </GlassCard>
        
        {/* CARD 5: Tempo Médio (Não Clicável - Métrica de cálculo) */}
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500 p-4", getAnimationClass(400))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Tempo Médio de Uso
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Duração média (em minutos) dos empréstimos que foram devolvidos no período selecionado.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              {Math.round(averageUsageTime)} min
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              média no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 6: Taxa de Devolução (Linha 2) */}
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-teal-500 p-4", getAnimationClass(500))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Taxa de Devolução
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Porcentagem de empréstimos realizados no período que já foram devolvidos.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 dark:text-teal-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {completionRate.toFixed(0)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={completionRate} className="h-1.5 sm:h-2" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {filteredReturns.length} de {filteredLoans.length}
              </span>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </TooltipProvider>
  );
};

// Componente principal Dashboard
export function Dashboard({ onBack }: DashboardProps) {
  // Removendo isMounted, pois não é mais necessário para a visibilidade
  const [startDate, setStartDate] = useState<Date | null>(startOfDay(subDays(new Date(), 6)));
  const [endDate, setEndDate] = useState<Date | null>(endOfDay(new Date()));
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(19);
  const [periodView, setPeriodView] = useState<PeriodView>('history'); // Padrão para 'history'
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState<any[] | null>(null);
  const [detailModalTitle, setDetailModalTitle] = useState('');
  const [detailModalDescription, setDetailModalDescription] = useState('');
  const [detailModalType, setDetailModalType] = useState<'chromebooks' | 'loans'>('chromebooks');
  const [detailModalLoading, setDetailModalLoading] = useState(false);
  const [chromebookStatusFilter, setChromebookStatusFilter] = useState<Chromebook['status'] | null>(null);
  
  const { 
    loading, 
    stats, 
    filteredLoans, 
    filteredReturns, 
    periodChartData, 
    history,
    chromebooks,
    refreshData
  } = useDashboardData(startDate, endDate, startHour, endHour);

  // REMOVIDO: useEffect para isMounted
  
  const handleApplyFilter = useCallback(() => {
    // A chamada a useDashboardData já é re-executada quando startDate/endDate/startHour/endHour mudam.
    // Apenas forçamos a atualização visual aqui.
    refreshData();
  }, [refreshData]);

  const handleCardClick = useCallback(async (title: string, description: string, type: 'chromebooks' | 'loans', data: any[] | null, statusFilter?: Chromebook['status']) => {
    setDetailModalTitle(title);
    setDetailModalDescription(description);
    setDetailModalType(type);
    setIsDetailModalOpen(true);
    setDetailModalLoading(true);
    
    if (type === 'chromebooks' && statusFilter) {
      // Se for Chromebooks, filtramos a lista completa localmente
      const filtered = chromebooks.filter(cb => cb.status === statusFilter).map(cb => ({
        id: cb.id,
        chromebook_id: cb.chromebook_id,
        model: cb.model,
        status: cb.status,
      }));
      setDetailModalData(filtered);
    } else if (type === 'loans' && data) {
      // Se for loans, usamos os dados já filtrados e mapeados
      setDetailModalData(data);
    } else {
      setDetailModalData([]);
    }
    
    setDetailModalLoading(false);
  }, [chromebooks]);

  const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];
  const userTypeData = stats?.userTypeData || [];
  const durationData = stats?.durationData || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Coluna de Filtros (1/4) */}
        <div className="lg:col-span-1 space-y-6">
          <CollapsibleDashboardFilter
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            startHour={startHour}
            setStartHour={setStartHour}
            endHour={endHour}
            setEndHour={setEndHour}
            onApply={handleApplyFilter}
            loading={loading}
          />
          
          {/* Gráfico de Uso por Tipo de Usuário */}
          <GlassCard className={cn("dashboard-card")}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Empréstimos por Tipo
              </CardTitle>
              <CardDescription>
                Distribuição dos empréstimos no período.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 p-0 flex items-center justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : userTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">Sem dados de empréstimo no período.</p>
              )}
            </CardContent>
          </GlassCard>
        </div>
        
        {/* Coluna de Estatísticas e Gráficos (3/4) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Grid de Estatísticas Principais */}
          <StatsGrid 
            periodView={periodView} 
            stats={stats} 
            filteredLoans={filteredLoans}
            filteredReturns={filteredReturns}
            loading={loading}
            onCardClick={handleCardClick}
            history={history}
            // isMounted removido
          />
          
          {/* Gráfico de Linha (Empréstimos e Ocupação) */}
          <GlassCard className={cn("dashboard-card")}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Atividade e Ocupação por Período
              </CardTitle>
              <CardDescription>
                Visualização horária ou diária da atividade de empréstimo e taxa de ocupação.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 p-0">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : periodChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={periodChartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Empréstimos/Devoluções', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12 } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ff7300" domain={[0, 100]} label={{ value: 'Ocupação (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 12 } }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="empréstimos" stroke="#8884d8" strokeWidth={2} name="Empréstimos" />
                    <Line yAxisId="left" type="monotone" dataKey="devoluções" stroke="#82ca9d" strokeWidth={2} name="Devoluções" />
                    <Line yAxisId="right" type="monotone" dataKey="ocupação" stroke="#ff7300" strokeWidth={2} name="Ocupação (%)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground text-sm">Selecione um período para visualizar o gráfico.</p>
                </div>
              )}
            </CardContent>
          </GlassCard>
          
          {/* Top Contextos de Empréstimo */}
          <TopLoanContextsPanel topLoanContexts={stats?.topLoanContexts || []} />
          
          {/* Gráfico de Duração Média */}
          <GlassCard className={cn("dashboard-card")}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Duração Média (Minutos)
              </CardTitle>
              <CardDescription>
                Tempo médio que cada tipo de usuário mantém o equipamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 p-0 flex items-center justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : durationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={durationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                    <XAxis type="number" label={{ value: 'Minutos', position: 'bottom', style: { fontSize: 12 } }} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`${value} minutos`, 'Duração Média']} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="minutos" fill="#8884d8" name="Duração Média" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">Sem dados de devolução no período.</p>
              )}
            </CardContent>
          </GlassCard>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <DashboardDetailDialog
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        title={detailModalTitle}
        description={detailModalDescription}
        data={detailModalData}
        isLoading={detailModalLoading}
        dataType={detailModalType}
      />
    </div>
  );
}