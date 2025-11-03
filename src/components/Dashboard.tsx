import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart, ComposedChart } from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, subMonths, subWeeks, startOfWeek, startOfMonth, endOfMonth, endOfWeek, addDays, endOfDay } from "date-fns";
import type { LoanHistoryItem, Chromebook } from "@/types/database";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./ui/chart";
import { Computer, Download, ArrowLeft, BarChart as BarChartIcon, PieChart as PieChartIcon, Clock, Users, Calendar, CalendarRange, Activity, ChartLine, Brain, Loader2, History as HistoryIcon, RefreshCw, TrendingUp, Info, Eye, UserCheck, GraduationCap, Briefcase, Zap, Waves, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDatabase } from '@/hooks/useDatabase';
import { useOverdueLoans } from '@/hooks/useOverdueLoans';
import { LoanHistory } from "./LoanHistory";
import { GlassCard } from "./ui/GlassCard";
import { useDashboardData, PeriodView } from '@/hooks/useDashboardData';
import { Skeleton } from "./ui/skeleton";
import { CollapsibleDashboardFilter } from "./CollapsibleDashboardFilter"; // <-- IMPORTAÇÃO CORRIGIDA
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"; // NOVO IMPORT
import { SectionHeader } from "./Shared/SectionHeader"; // NOVO IMPORT
import { DashboardDetailDialog } from "./DashboardDetailDialog"; // NOVO IMPORT
import { cn } from '@/lib/utils'; // <-- IMPORTAÇÃO ADICIONADA
import { TopLoanContextsPanel } from "./TopLoanContextsPanel"; // <-- NOVO IMPORT
import { useTheme } from '@/lib/theme'; // NOVO IMPORT

interface DashboardProps {
  onBack?: () => void;
}

// Componente auxiliar para renderizar o Skeleton Card
const StatCardSkeleton = () => (
  <GlassCard className="border-border border-l-4 border-l-muted">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-1/2 mb-1" />
      <Skeleton className="h-3 w-3/4" />
    </CardContent>
  </GlassCard>
);

// Tipos para o estado do modal
type DetailItem = {
  id: string;
  chromebook_id: string;
  model: string;
  status?: Chromebook['status'];
  loan_date?: string;
  expected_return_date?: string;
  student_name?: string;
  isOverdue?: boolean;
};

type DetailModalState = {
  open: boolean;
  title: string;
  description: string;
  dataType: 'chromebooks' | 'loans';
  data: DetailItem[] | null;
  isLoading: boolean;
};

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
      case 'green': return { text: 'text-success', bg: 'bg-success-bg', border: 'border-success', gradient: 'from-success to-green-600' };
      case 'yellow': return { text: 'text-warning', bg: 'bg-warning-bg', border: 'border-warning', gradient: 'from-warning to-orange-600' };
      case 'red': return { text: 'text-error', bg: 'bg-error-bg', border: 'border-error', gradient: 'from-error to-red-800' };
      default: return { text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-muted-foreground', gradient: 'from-muted-foreground to-gray-800' };
    }
  };
  
  const usageColors = getColorClasses(usageRateColor);
  const picoColors = getColorClasses(occupancyRateColor);

  const getAnimationClass = (delay: number) => 
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  return (
    <TooltipProvider>
      {/* Grid principal com 4 colunas em telas grandes */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4 relative z-10">
        
        {/* CARD 1: TAXA DE USO (Neste Instante) - DESTAQUE */}
        <GlassCard className={cn("border-border hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 md:col-span-2 p-6", usageColors.border.replace('border-', 'border-l-'), getAnimationClass(0))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-base font-bold flex items-center gap-1 cursor-help text-foreground">
                  TAXA DE USO (Tempo Real)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs bg-card text-card-foreground border-border">
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
        <GlassCard className={cn("border-border hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 md:col-span-2 p-6", picoColors.border.replace('border-', 'border-l-'), getAnimationClass(100))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-base font-bold flex items-center gap-1 cursor-help text-foreground">
                  TAXA DE USO (Pico no Período)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs bg-card text-card-foreground border-border">
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
          className={cn("border-border hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-primary cursor-pointer p-4", getAnimationClass(200))}
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
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help text-foreground">
                  Empréstimos Ativos
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs bg-card text-card-foreground border-border">
                <p>Número de Chromebooks atualmente emprestados (status 'emprestado'). Clique para ver a lista.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-blue-800 bg-clip-text text-transparent">{totalActive}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {filteredLoans.length} empréstimos no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 4: Disponíveis (Clicável para ver a lista) */}
        <GlassCard 
          className={cn("border-border hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-success cursor-pointer p-4", getAnimationClass(300))}
          onClick={() => onCardClick('Disponíveis', 'Lista de Chromebooks prontos para empréstimo.', 'chromebooks', null, 'disponivel')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help text-foreground">
                  Disponíveis
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs bg-card text-card-foreground border-border">
                <p>Número de Chromebooks com status 'disponível' no inventário. Clique para ver a lista.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-success to-green-600 bg-clip-text text-transparent">{availableChromebooks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              de {totalChromebooks} no total
            </p>
          </CardContent>
        </GlassCard>
        
        {/* CARD 5: Tempo Médio (Não Clicável - Métrica de cálculo) */}
        <GlassCard className={cn("border-border hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-menu-violet p-4", getAnimationClass(400))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help text-foreground">
                  Tempo Médio de Uso
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs bg-card text-card-foreground border-border">
                <p>Duração média (em minutos) dos empréstimos que foram devolvidos no período selecionado.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-menu-violet" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-menu-violet to-violet-600 bg-clip-text text-transparent">
              {Math.round(averageUsageTime)} min
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              média no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 6: Taxa de Devolução (Linha 2) */}
        <GlassCard className={cn("border-border hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-menu-teal p-4", getAnimationClass(500))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help text-foreground">
                  Taxa de Devolução
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs bg-card text-card-foreground border-border">
                <p>Porcentagem de empréstimos realizados no período que já foram devolvidos.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-menu-teal" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-menu-teal to-cyan-600 bg-clip-text text-transparent">
              {completionRate.toFixed(0)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={completionRate} className="h-1.5 sm:h-2" />
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {filteredReturns.length} de {filteredLoans.length}
              </span>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </TooltipProvider>
  );
};


// Componente para renderizar os gráficos de acordo com o período
const PeriodCharts = ({ periodView, loading, periodChartData, stats, startHour, endHour, totalChromebooks, availableChromebooks, userTypeData, durationData, isNewLoan, history, isMounted, filteredLoans = [], filteredReturns = [] }: any) => {
  const { theme } = useTheme();
  
  // Cores adaptativas para Recharts
  const chartColors = {
    primary: theme === 'dark' ? 'hsl(217.2 91.2% 59.8%)' : 'hsl(221.2 83.2% 53.3%)',
    success: theme === 'dark' ? 'hsl(142 76% 55%)' : 'hsl(142 71% 45%)',
    error: theme === 'dark' ? 'hsl(0 84% 65%)' : 'hsl(0 84% 60%)',
    grid: theme === 'dark' ? 'hsl(217.2 32.6% 25%)' : 'hsl(214.3 31.8% 91.4%)',
    text: theme === 'dark' ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)',
    background: theme === 'dark' ? 'hsl(217.2 32.6% 15%)' : 'hsl(0 0% 100%)',
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (periodView === 'charts' && periodChartData.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
        <p className="text-lg font-semibold text-foreground">Nenhum dado de empréstimo encontrado no período.</p>
        <p className="text-sm text-muted-foreground mt-2">Tente ampliar o intervalo de datas ou horários no filtro acima.</p>
      </GlassCard>
    );
  }

  // Cores para o gráfico de pizza de Status
  const PIE_COLORS = [chartColors.primary, chartColors.success];
  
  // Renderiza o histórico completo
  if (periodView === 'history') {
    return <LoanHistory history={history} isNewLoan={isNewLoan} />;
  }
  
  // Renderiza os gráficos para o intervalo de tempo selecionado
  
  const chartTitle = periodChartData.length > 2 ? 'Atividade Diária' : 'Atividade Horária';
  const chartDescription = periodChartData.length > 2 ? 'Movimentação ao longo dos dias selecionados' : 'Movimentação ao longo das horas selecionadas';
  const chartDataKey = 'label'; // Usamos 'label' agora

  // Desestruturação segura para stats, incluindo filteredLoans e filteredReturns
  const { 
    totalActive = 0, 
    loansByUserType = {},
    topLoanContexts = [], 
  } = stats || {};

  // Garante que filteredLoans.length seja seguro para divisão
  const totalLoansInPeriod = filteredLoans.length || 1;
  
  // Mapeamento de cores para o gráfico de duração
  const DURATION_COLORS: Record<string, string> = {
    Aluno: chartColors.primary,
    Professor: chartColors.success,
    Funcionario: chartColors.error,
  };
  
  // Mapeamento de dados para o gráfico de duração (garantindo que o nome seja a chave)
  const durationChartData = durationData.map((d: any) => ({
      name: d.name,
      minutos: d.minutos,
      color: DURATION_COLORS[d.name] || chartColors.text,
  }));
  
  const getAnimationClass = (delay: number) => 
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';


  return (
    <>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <GlassCard className={cn("dashboard-card", getAnimationClass(600))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">{chartTitle}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {chartDescription}
              </CardDescription>
            </div>
            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]"> {/* AUMENTADO PARA 300PX */}
            <ChartContainer
              config={{
                empréstimos: { label: "Empréstimos", color: chartColors.primary },
                devoluções: { label: "Devoluções", color: chartColors.success },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} opacity={0.5} />
                  <XAxis dataKey={chartDataKey} tick={{ fontSize: 10, fill: chartColors.text }} stroke={chartColors.text} />
                  <YAxis tick={{ fontSize: 10, fill: chartColors.text }} stroke={chartColors.text} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.background, 
                      border: `1px solid ${chartColors.grid}`, 
                      borderRadius: 'var(--radius-sm)',
                      color: chartColors.text
                    }}
                    content={<ChartTooltipContent />} 
                  />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: chartColors.text }} />
                  
                  <Bar 
                    dataKey="empréstimos" 
                    fill={chartColors.primary} 
                    radius={[4, 4, 0, 0]} 
                    name="Empréstimos"
                  />
                  
                  <Bar 
                    dataKey="devoluções" 
                    fill={chartColors.success} 
                    radius={[4, 4, 0, 0]} 
                    name="Devoluções"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </GlassCard>

        {/* NOVO GRÁFICO: Ocupação Horária */}
        <GlassCard className={cn("dashboard-card", getAnimationClass(700))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Taxa de Ocupação Horária</CardTitle>
              <CardDescription className="text-muted-foreground">
                Ocupação do inventário móvel no período selecionado
              </CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]"> {/* AUMENTADO PARA 300PX */}
            <ChartContainer
              config={{
                ocupação: { label: "Ocupação (%)", color: chartColors.error },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} opacity={0.5} />
                  <XAxis dataKey={chartDataKey} tick={{ fontSize: 10, fill: chartColors.text }} stroke={chartColors.text} />
                  <YAxis 
                      tick={{ fontSize: 10, fill: chartColors.text }} 
                      domain={[0, 100]} 
                      tickFormatter={(value) => `${value}%`}
                      stroke={chartColors.text} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.background, 
                      border: `1px solid ${chartColors.grid}`, 
                      borderRadius: 'var(--radius-sm)',
                      color: chartColors.text
                    }}
                    content={<ChartTooltipContent />} 
                  />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: chartColors.text }} />
                  
                  <Line 
                      type="monotone" 
                      dataKey="ocupação" 
                      stroke={chartColors.error} 
                      strokeWidth={2} 
                      name="Ocupação (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </GlassCard>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <GlassCard className={cn("dashboard-card", getAnimationClass(800))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Status dos Chromebooks</CardTitle>
              <CardDescription className="text-muted-foreground">
                Total de {totalChromebooks} equipamentos
              </CardDescription>
            </div>
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center"> {/* AUMENTADO PARA 300PX */}
            <ChartContainer
              config={{
                'Em Uso': { label: "Em Uso", color: chartColors.primary },
                'Disponíveis': { label: "Disponíveis", color: chartColors.success },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie data={[{
                    name: "Em Uso",
                    value: totalActive
                  }, {
                    name: "Disponíveis",
                    value: availableChromebooks
                  }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {[{
                      name: "Em Uso",
                      value: totalActive
                    }, {
                      name: "Disponíveis",
                      value: availableChromebooks
                    }].map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.background, 
                      border: `1px solid ${chartColors.grid}`, 
                      borderRadius: 'var(--radius-sm)',
                      color: chartColors.text
                    }}
                    content={<ChartTooltipContent />} 
                  />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: chartColors.text }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </GlassCard>

        <GlassCard className={cn("dashboard-card", getAnimationClass(900))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Uso por Tipo de Usuário</CardTitle>
              <CardDescription className="text-muted-foreground">
                Distribuição dos empréstimos no período
              </CardDescription>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]"> {/* AUMENTADO PARA 300PX */}
            <ChartContainer
              config={{
                'Aluno': { label: "Aluno", color: chartColors.primary },
                'Professor': { label: "Professor", color: chartColors.success },
                'Funcionario': { label: "Funcionário", color: chartColors.error },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({
                      name,
                      value
                    }) => value > 0 ? `${name}: ${value}` : ''}>
                    {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={[chartColors.primary, chartColors.success, chartColors.error][index % 3]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.background, 
                      border: `1px solid ${chartColors.grid}`, 
                      borderRadius: 'var(--radius-sm)',
                      color: chartColors.text
                    }}
                    content={<ChartTooltipContent />} 
                  />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: chartColors.text }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </GlassCard>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
        {/* NOVO PAINEL: Top Contextos de Empréstimo */}
        <div className={getAnimationClass(1000)}>
            <TopLoanContextsPanel topLoanContexts={stats?.topLoanContexts || []} />
        </div>

        <GlassCard className={cn("dashboard-card", getAnimationClass(1100))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Estatísticas Rápidas</CardTitle>
              <CardDescription className="text-muted-foreground">
                Resumo do período
              </CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Alunos</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                  {stats?.loansByUserType.aluno || 0} empréstimos
                </Badge>
              </div>
              <Progress value={((stats?.loansByUserType.aluno || 0) / totalLoansInPeriod) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Professores</span>
                <Badge variant="secondary" className="bg-success-bg text-success-foreground border-success/30">
                  {stats?.loansByUserType.professor || 0} empréstimos
                </Badge>
              </div>
              <Progress value={((stats?.loansByUserType.professor || 0) / totalLoansInPeriod) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Funcionários</span>
                <Badge variant="secondary" className="bg-warning-bg text-warning-foreground border-warning/30">
                  {stats?.loansByUserType.funcionario || 0} empréstimos
                </Badge>
              </div>
              <Progress value={((stats?.loansByUserType.funcionario || 0) / totalLoansInPeriod) * 100} className="h-2" />
            </div>
          </CardContent>
        </GlassCard>
      </div>
      
      {/* Modal de Detalhes */}
      <DashboardDetailDialog
        open={detailModal.open}
        onOpenChange={(open) => setDetailModal(prev => ({ ...prev, open }))}
        title={detailModal.title}
        description={detailModal.description}
        data={detailModal.data}
        isLoading={detailModal.isLoading}
        dataType={detailModal.dataType}
      />
      
    </>
  );
}

// Exportação nomeada do componente
export function Dashboard({ onBack }: DashboardProps) {
  const { refreshData, loading, history, chromebooks, filteredLoans = [], filteredReturns = [], periodChartData, stats } = useDashboardData(null, null);
  const { refresh: refreshOverdue } = useOverdueLoans();
  const [isMounted, setIsMounted] = useState(false);
  
  // Estado para o filtro de período
  const [startDate, setStartDate] = useState<Date | null>(startOfDay(subDays(new Date(), 7)));
  const [endDate, setEndDate] = useState<Date | null>(endOfDay(new Date()));
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(19);
  
  // Estado para a visualização (charts, history, reports)
  const [periodView, setPeriodView] = useState<PeriodView>('charts');
  
  // Estado para o modal de detalhes
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    open: false,
    title: '',
    description: '',
    dataType: 'chromebooks',
    data: null,
    isLoading: false,
  });
  
  // Hook para montar a animação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Função para verificar se um empréstimo é novo (para destaque no histórico)
  const isNewLoan = useCallback((loan: LoanHistoryItem) => {
    const loanDate = new Date(loan.loan_date);
    return differenceInMinutes(new Date(), loanDate) < 5; // Novo se criado nos últimos 5 minutos
  }, []);
  
  // Função para aplicar o filtro de período
  const handleApplyFilter = () => {
    // O hook useDashboardData já recalcula quando startDate/endDate/startHour/endHour mudam.
    // Apenas forçamos a atualização dos dados brutos se necessário.
    refreshData();
  };
  
  // Função para lidar com o clique nos cards de estatísticas
  const handleCardClick = useCallback(async (title: string, description: string, dataType: 'chromebooks' | 'loans', data: DetailItem[] | null = null, statusFilter?: Chromebook['status']) => {
    setDetailModal({
      open: true,
      title,
      description,
      dataType,
      data: null,
      isLoading: true,
    });

    if (dataType === 'chromebooks' && statusFilter) {
      const { data: chromebooksData, error } = await supabase
        .from('chromebooks')
        .select('id, chromebook_id, model, status')
        .eq('status', statusFilter);
        
      if (error) {
        toast({ title: "Erro", description: "Falha ao carregar lista de Chromebooks.", variant: "destructive" });
        setDetailModal(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      const detailData: DetailItem[] = (chromebooksData || []).map(cb => ({
        id: cb.id,
        chromebook_id: cb.chromebook_id,
        model: cb.model,
        status: cb.status,
      }));
      
      setDetailModal(prev => ({ ...prev, data: detailData, isLoading: false }));
      
    } else if (dataType === 'loans' && data) {
      // Se for empréstimos, os dados já foram pré-calculados no StatsGrid
      setDetailModal(prev => ({ ...prev, data, isLoading: false }));
    } else {
      setDetailModal(prev => ({ ...prev, isLoading: false }));
    }
  }, []);


  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Dashboard de Uso" 
        description="Análise de empréstimos, devoluções e inventário em tempo real."
        icon={BarChartIcon}
        iconColor="text-menu-dark-blue"
        className="flex flex-col items-center"
      />
      
      {/* Filtro de Período */}
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
      
      {/* Tabs de Visualização */}
      <Tabs value={periodView} onValueChange={(v) => setPeriodView(v as PeriodView)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChartIcon className="h-4 w-4" />
            Gráficos e Estatísticas
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Histórico Completo
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2" disabled>
            <Brain className="h-4 w-4" />
            Assistente de Relatórios (Em Breve)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6 mt-6">
          {loading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <StatsGrid 
              periodView={periodView} 
              stats={stats} 
              filteredLoans={filteredLoans} 
              filteredReturns={filteredReturns} 
              loading={loading} 
              onCardClick={handleCardClick}
              history={history}
              isMounted={isMounted}
            />
          )}
          
          {/* Gráficos (Renderizados pelo componente auxiliar) */}
          <PeriodCharts 
            periodView={periodView} 
            loading={loading} 
            periodChartData={periodChartData} 
            stats={stats} 
            startHour={startHour} 
            endHour={endHour} 
            totalChromebooks={stats?.totalChromebooks}
            availableChromebooks={stats?.availableChromebooks}
            userTypeData={stats?.userTypeData}
            durationData={stats?.durationData}
            isNewLoan={isNewLoan}
            history={history}
            isMounted={isMounted}
            filteredLoans={filteredLoans}
            filteredReturns={filteredReturns}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <PeriodCharts 
            periodView={periodView} 
            loading={loading} 
            history={history} 
            isNewLoan={isNewLoan}
            filteredLoans={filteredLoans}
            filteredReturns={filteredReturns}
          />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6 mt-6">
          <GlassCard className="p-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">Assistente de Relatórios</p>
            <p className="text-sm text-muted-foreground mt-2">
              Em breve, você poderá fazer perguntas em linguagem natural sobre os dados do seu inventário.
            </p>
          </GlassCard>
        </TabsContent>
      </Tabs>
      
      {/* Modal de Detalhes */}
      <DashboardDetailDialog
        open={detailModal.open}
        onOpenChange={(open) => setDetailModal(prev => ({ ...prev, open }))}
        title={detailModal.title}
        description={detailModal.description}
        data={detailModal.data}
        isLoading={detailModal.isLoading}
        dataType={detailModal.dataType}
      />
      
    </div>
  );
}