import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart, ComposedChart } from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, subMonths, subWeeks, startOfWeek, startOfMonth, endOfMonth, endOfWeek, addDays, endOfDay } from "date-fns";
import type { LoanHistoryItem, Chromebook } from "@/types/database";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./ui/chart";
import { Computer, Download, ArrowLeft, BarChart as BarChartIcon, PieChart as PieChartIcon, Clock, Users, Calendar, CalendarRange, Activity, ChartLine, Brain, Loader2, History as HistoryIcon, RefreshCw, TrendingUp, Info, Eye, UserCheck, GraduationCap, Briefcase, Zap, Waves } from "lucide-react"; // Adicionado Zap e Waves
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

interface DashboardProps {
  onBack?: () => void;
}

// Componente auxiliar para renderizar o Skeleton Card
const StatCardSkeleton = () => (
  <GlassCard className="border-white/30 border-l-4 border-l-gray-300">
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
      case 'green': return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-500', gradient: 'from-green-600 to-emerald-600' };
      case 'yellow': return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-500', gradient: 'from-amber-600 to-orange-600' };
      case 'red': return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500', gradient: 'from-red-600 to-red-800' };
      default: return { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-500', gradient: 'from-gray-600 to-gray-800' };
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
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 md:col-span-2 p-6", usageColors.border.replace('border-', 'border-l-'), getAnimationClass(0))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-base font-bold flex items-center gap-1 cursor-help text-gray-700">
                  TAXA DE USO (Tempo Real)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
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
                <CardTitle className="text-base font-bold flex items-center gap-1 cursor-help text-gray-700">
                  TAXA DE USO (Pico no Período)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
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
              <TooltipContent className="max-w-sm text-xs">
                <p>Número de Chromebooks atualmente emprestados (status 'emprestado'). Clique para ver a lista.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
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
              <TooltipContent className="max-w-sm text-xs">
                <p>Número de Chromebooks com status 'disponível' no inventário. Clique para ver a lista.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
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
              <TooltipContent className="max-w-sm text-xs">
                <p>Duração média (em minutos) dos empréstimos que foram devolvidos no período selecionado.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
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
              <TooltipContent className="max-w-sm text-xs">
                <p>Porcentagem de empréstimos realizados no período que já foram devolvidos.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
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


// Componente para renderizar os gráficos de acordo com o período
const PeriodCharts = ({ periodView, loading, periodChartData, stats, startHour, endHour, totalChromebooks, availableChromebooks, userTypeData, durationData, isNewLoan, history, isMounted }: any) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Cores para o gráfico de pizza de Status
  const COLORS = ['#2563EB', '#22C55E'];
  
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
    filteredLoans = [], 
    filteredReturns = [], 
    topLoanContexts = [], 
  } = stats || {};

  // Garante que filteredLoans.length seja seguro para divisão
  const totalLoansInPeriod = filteredLoans.length || 1;
  
  // Mapeamento de cores para o gráfico de duração
  const DURATION_COLORS: Record<string, string> = {
    Aluno: '#3B82F6', // Azul (menu-blue)
    Professor: '#10B981', // Verde (menu-green)
    Funcionario: '#F59E0B', // Laranja (menu-amber)
  };
  
  // Mapeamento de dados para o gráfico de duração (garantindo que o nome seja a chave)
  const durationChartData = durationData.map((d: any) => ({
      name: d.name,
      minutos: d.minutos,
      color: DURATION_COLORS[d.name] || '#9CA3AF',
  }));
  
  const getAnimationClass = (delay: number) => 
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';


  return (
    <>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <GlassCard className={cn("dashboard-card", getAnimationClass(600))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{chartTitle}</CardTitle>
              <CardDescription>
                {chartDescription}
              </CardDescription>
            </div>
            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]"> {/* AUMENTADO PARA 300PX */}
            <ChartContainer
              config={{
                empréstimos: { label: "Empréstimos", color: "hsl(var(--primary))" },
                devoluções: { label: "Devoluções", color: "hsl(var(--menu-green))" },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey={chartDataKey} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  
                  <Bar 
                    dataKey="empréstimos" 
                    fill="#2563EB" 
                    radius={[4, 4, 0, 0]} 
                    name="Empréstimos"
                  />
                  
                  <Bar 
                    dataKey="devoluções" 
                    fill="#22C55E" 
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
              <CardTitle className="text-lg">Taxa de Ocupação Horária</CardTitle>
              <CardDescription>
                Ocupação do inventário móvel no período selecionado
              </CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]"> {/* AUMENTADO PARA 300PX */}
            <ChartContainer
              config={{
                ocupação: { label: "Ocupação (%)", color: "hsl(var(--destructive))" },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey={chartDataKey} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                      tick={{ fontSize: 10 }} 
                      domain={[0, 100]} 
                      tickFormatter={(value) => `${value}%`}
                      stroke="hsl(var(--muted-foreground))" 
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  
                  <Line 
                      type="monotone" 
                      dataKey="ocupação" 
                      stroke="hsl(var(--destructive))" 
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
              <CardTitle className="text-lg">Status dos Chromebooks</CardTitle>
              <CardDescription>
                Total de {totalChromebooks} equipamentos
              </CardDescription>
            </div>
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center"> {/* AUMENTADO PARA 300PX */}
            <ChartContainer
              config={{
                'Em Uso': { label: "Em Uso", color: "hsl(var(--primary))" },
                'Disponíveis': { label: "Disponíveis", color: "hsl(var(--menu-green))" },
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
                    }].map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </GlassCard>

        <GlassCard className={cn("dashboard-card", getAnimationClass(900))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Uso por Tipo de Usuário</CardTitle>
              <CardDescription>
                Distribuição dos empréstimos no período
              </CardDescription>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]"> {/* AUMENTADO PARA 300PX */}
            <ChartContainer
              config={{
                'Aluno': { label: "Aluno", color: "#3B82F6" },
                'Professor': { label: "Professor", color: "#10B981" },
                'Funcionario': { label: "Funcionário", color: "#F59E0B" },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({
                      name,
                      value
                    }) => value > 0 ? `${name}: ${value}` : ''}>
                    {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </GlassCard>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
        {/* NOVO PAINEL: Top Contextos de Empréstimo */}
        <div className={getAnimationClass(1000)}>
            <TopLoanContextsPanel topLoanContexts={topLoanContexts} />
        </div>

        <GlassCard className={cn("dashboard-card", getAnimationClass(1100))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
              <CardDescription>
                Resumo do período
              </CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Alunos</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {loansByUserType.aluno || 0} empréstimos
                </Badge>
              </div>
              <Progress value={((loansByUserType.aluno || 0) / totalLoansInPeriod) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Professores</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {loansByUserType.professor || 0} empréstimos
                </Badge>
              </div>
              <Progress value={((loansByUserType.professor || 0) / totalLoansInPeriod) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Funcionários</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {loansByUserType.funcionario || 0} empréstimos
                </Badge>
              </div>
              <Progress value={((loansByUserType.funcionario || 0) / totalLoansInPeriod) * 100} className="h-2" />
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </>
  );
};


export function Dashboard({
  onBack
}: DashboardProps) {
  const {
    toast
  } = useToast();
  
  // NOVO ESTADO: Para controlar a animação de montagem
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Ativa a animação após um pequeno delay para garantir que o componente esteja no DOM
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // NOVO ESTADO: Datas de início e fim para o filtro dinâmico
  const [startDate, setStartDate] = useState<Date | null>(startOfDay(new Date())); // PADRÃO: HOJE
  const [endDate, setEndDate] = useState<Date | null>(endOfDay(new Date())); // Padrão: Hoje
  
  // O PeriodView agora só controla a visualização (Gráficos vs. Histórico)
  const [periodView, setPeriodView] = useState < PeriodView | 'charts' > ('charts');
  
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(19);
  
  const { 
    loading, 
    history, 
    chromebooks, 
    filteredLoans, 
    filteredReturns, 
    periodChartData, 
    stats, 
    refreshData 
  } = useDashboardData(
    periodView === 'charts' ? startDate : null, // Passa datas apenas se estiver em modo 'charts'
    periodView === 'charts' ? endDate : null,
    startHour, 
    endHour
  );
  
  const { getChromebooksByStatus } = useDatabase();

  // ESTADO DO MODAL DE DETALHES
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    open: false,
    title: '',
    description: '',
    dataType: 'chromebooks',
    data: null,
    isLoading: false,
  });

  // Função para abrir o modal e carregar dados dinamicamente
  const handleCardClick = useCallback(async (
    title: string, 
    description: string, 
    dataType: 'chromebooks' | 'loans', 
    initialData: DetailItem[] | null,
    statusFilter?: Chromebook['status']
  ) => {
    setDetailModal({
      open: true,
      title,
      description,
      dataType,
      data: initialData,
      isLoading: !initialData, // Se não houver dados iniciais (como para status), carrega
    });

    if (statusFilter && dataType === 'chromebooks') {
      setDetailModal(prev => ({ ...prev, isLoading: true }));
      const chromebooksData = await getChromebooksByStatus(statusFilter);
      
      const mappedData: DetailItem[] = chromebooksData.map(cb => ({
        id: cb.id,
        chromebook_id: cb.chromebook_id,
        model: cb.model,
        status: cb.status,
      }));
      
      setDetailModal(prev => ({
        ...prev,
        data: mappedData,
        isLoading: false,
      }));
    }
    
    // Se for loans, os dados já vêm pré-filtrados (history.filter)
    if (dataType === 'loans' && initialData) {
        setDetailModal(prev => ({ ...prev, data: initialData, isLoading: false }));
    }
    
  }, [getChromebooksByStatus]);
  
  // NOVO: Função para lidar com o clique no Pico de Uso (agora apenas aplica o filtro)
  const handleApplyFilter = () => {
    // O CollapsibleDashboardFilter já atualiza startDate/endDate/startHour/endHour no estado.
    refreshData();
    toast({
      title: "Filtro Aplicado",
      description: `Análise atualizada para o período de ${format(startDate!, 'dd/MM/yyyy')} a ${format(endDate!, 'dd/MM/yyyy')} (${startHour}h às ${endHour}h).`,
      variant: "info"
    });
  };


  const { overdueLoans, upcomingDueLoans } = useOverdueLoans();
  
  // Desestruturação segura no escopo principal
  const { 
    totalChromebooks = 0, 
    availableChromebooks = 0, 
    loansByUserType = {}, 
    userTypeData = [], 
    durationData = [], 
    maxOccupancyRate = 0,
    topLoanContexts = [], 
  } = stats || {};

  // Função para gerar o PDF do relatório
  const periodText: Record<PeriodView | 'charts', string> = {
    charts: `Período: ${startDate && endDate ? `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}` : 'N/A'}`,
    history: 'Histórico Completo',
    reports: 'Relatórios Inteligentes'
  };

  const generatePDFContent = (pdf: jsPDF) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;
    pdf.setFontSize(20);
    pdf.text(`Relatório de Uso dos Chromebooks - ${periodText[periodView]}`, pageWidth / 2, yPosition, {
      align: "center"
    });
    yPosition += 20;
    pdf.setFontSize(12);
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, yPosition, {
      align: "center"
    });
    yPosition += 20;
    pdf.setFontSize(16);
    pdf.text(`Estatísticas do Período`, 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    const periodStats = [
      `Empréstimos: ${filteredLoans?.length || 0}`, 
      `Devoluções: ${filteredReturns?.length || 0}`, 
      `Chromebooks ativos: ${stats?.totalActive || 0} de ${totalChromebooks || 0}`, 
      `Taxa de Ocupação Máxima: ${stats?.maxOccupancyRate.toFixed(0) || 0}%`,
      `Tempo médio de uso: ${Math.round(stats?.averageUsageTime || 0)} minutos`, 
      `Taxa de devolução: ${stats?.completionRate.toFixed(0) || 0}%`
    ];
    periodStats.forEach(stat => {
      pdf.text(`• ${stat}`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 13;
    pdf.setFontSize(16);
    pdf.text("Empréstimos Ativos", 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    history.filter(loan => !loan.return_date).forEach(loan => {
      if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`• ${loan.student_name} - ID: ${loan.chromebook_id}`, 25, yPosition);
      pdf.text(`  Retirada: ${format(new Date(loan.loan_date), "dd/MM/yyyy 'às' HH:mm")}`, 25, yPosition + 5);
      yPosition += 15;
    });
    return pdf;
  };
  
  const handleDownloadPDF = () => {
    if (periodView !== 'charts') {
      toast({
        title: "Atenção",
        description: "O download de relatórios só está disponível na aba 'Análise de Uso'.",
        variant: "destructive"
      });
      return;
    }
    try {
      const pdf = new jsPDF();
      generatePDFContent(pdf);
      pdf.save(`relatorio-chromebooks-personalizado.pdf`);
      toast({
        title: "Sucesso",
        description: `Relatório gerado com sucesso!`
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o relatório PDF",
        variant: "destructive"
      });
    }
  };
  
  // Quick Win: Badge "Novo"
  const isNewLoan = (loan: LoanHistoryItem) => {
    const loanDate = new Date(loan.loan_date);
    const now = new Date();
    const diffHours = differenceInMinutes(now, loanDate) / 60;
    return diffHours <= 24;
  };

  const periodOptions: { value: PeriodView | 'charts'; label: string; icon: React.ElementType }[] = [
    { value: 'charts', label: 'Análise de Uso', icon: BarChartIcon },
    { value: 'history', label: 'Histórico Completo', icon: HistoryIcon },
    // { value: 'reports', label: 'Relatórios Inteligentes', icon: Brain }, // Mantido como placeholder
  ];
  
  // Badge de Período Ativo
  const periodBadge = useMemo(() => {
    if (periodView !== 'charts' || !startDate || !endDate) return null;
    
    const startFmt = format(startDate, 'dd/MM');
    const endFmt = format(endDate, 'dd/MM');
    const dateRange = startFmt === endFmt ? startFmt : `${startFmt} - ${endFmt}`;
    
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-sm font-medium">
        <CalendarRange className="h-3 w-3 mr-1" />
        {dateRange} | {startHour}h - {endHour}h
      </Badge>
    );
  }, [periodView, startDate, endDate, startHour, endHour]);


  return (
    <div className="space-y-8 relative py-[30px]">
      { /* Background gradient overlay */ }
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 blur-2xl transform scale-110 py-[25px] rounded-3xl bg-[#000a0e]/0" />
      
      {/* Header: Title and Download Button */}
      <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 gap-4", isMounted ? 'animate-fadeIn animation-delay-0' : 'opacity-0')}>
        <SectionHeader 
          title="Dashboard" 
          description="Análise de uso e estatísticas de empréstimos"
          icon={BarChartIcon}
          iconColor="text-primary"
        />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={refreshData} 
            className="flex items-center gap-2 hover:bg-blue-50" 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{loading ? 'Atualizando...' : 'Atualizar Dados'}</span>
          </Button>
          
          {/* NOVO: Select para seleção de visualização */}
          <Select value={periodView} onValueChange={(v) => setPeriodView(v as PeriodView | 'charts')}>
            <SelectTrigger className="w-full sm:w-[200px] h-10">
              <SelectValue placeholder="Selecione a Visualização" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(option => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value} className="flex items-center">
                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {option.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtro de Hora (Aparece apenas no modo 'charts') */}
      {periodView === 'charts' && (
        <div className={cn("mt-6 space-y-4", isMounted ? 'animate-fadeIn animation-delay-100' : 'opacity-0')}>
            <CollapsibleDashboardFilter 
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={setEndDate}
                setEndDate={setEndDate}
                startHour={startHour}
                setStartHour={setStartHour}
                endHour={endHour}
                setEndHour={setEndHour}
                onApply={handleApplyFilter} // USANDO O NOVO HANDLER
                loading={loading}
            />
            {/* Badge de Período Ativo */}
            {periodBadge && (
                <div className="flex justify-start">
                    {periodBadge}
                </div>
            )}
        </div>
      )}

      {/* Grid de Cards de Estatísticas (Visível apenas no modo 'charts') */}
      {periodView === 'charts' && (
        <StatsGrid 
          periodView={periodView}
          filteredLoans={filteredLoans}
          filteredReturns={filteredReturns}
          stats={stats}
          loading={loading}
          onCardClick={handleCardClick}
          history={history}
          isMounted={isMounted} // PASSANDO O ESTADO DE MONTAGEM
        />
      )}

      {/* Conteúdo Principal (Gráficos ou Histórico) */}
      <div className="space-y-4 mt-6">
        <PeriodCharts 
          periodView={periodView}
          loading={loading}
          periodChartData={periodChartData}
          stats={stats}
          startHour={startHour}
          endHour={endHour}
          totalChromebooks={totalChromebooks}
          availableChromebooks={availableChromebooks}
          userTypeData={userTypeData}
          durationData={durationData}
          isNewLoan={isNewLoan}
          history={history}
          isMounted={isMounted} // PASSANDO O ESTADO DE MONTAGEM
        />
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
      
    </div>
  );
}