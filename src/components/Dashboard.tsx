import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart, ComposedChart } from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, subMonths, subWeeks, startOfWeek, startOfMonth, endOfMonth, endOfWeek, addDays } from "date-fns";
import type { LoanHistoryItem, Chromebook } from "@/types/database";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./ui/chart";
import { Computer, Download, ArrowLeft, BarChart as BarChartIcon, PieChart as PieChartIcon, Clock, Users, Calendar, CalendarRange, Activity, ChartLine, Brain, Loader2, History as HistoryIcon, RefreshCw, TrendingUp, Info } from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDatabase } from '@/hooks/useDatabase';
import { useOverdueLoans } from '@/hooks/useOverdueLoans';
import { LoanHistory } from "./LoanHistory";
import { GlassCard } from "./ui/GlassCard";
import { useDashboardData, PeriodView } from '@/hooks/useDashboardData';
import { Skeleton } from "./ui/skeleton";
import { CollapsibleDashboardFilter } from "./CollapsibleDashboardFilter";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"; // NOVO IMPORT
import { SectionHeader } from "./Shared/SectionHeader"; // NOVO IMPORT
import { DashboardDetailDialog } from "./DashboardDetailDialog"; // NOVO IMPORT

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
const StatsGrid = ({ periodView, stats, filteredLoans = [], filteredReturns = [], loading, onCardClick, history }: any) => {
  if (periodView === 'history' || periodView === 'reports') return null;

  // Desestruturação segura, usando valores padrão se stats for null/undefined
  const { 
    totalActive = 0, 
    totalChromebooks = 0, 
    totalInventoryUsageRate = 0, 
    availableChromebooks = 0, // Adicionado
    averageUsageTime = 0, 
    completionRate = 0, 
    maxOccupancyRate = 0 
  } = stats || {};

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 relative z-10">
        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
      </div>
    );
  }
  
  // Função para determinar se o empréstimo está em atraso
  const isOverdue = (loan: LoanHistoryItem) => {
    return loan.expected_return_date && new Date(loan.expected_return_date) < new Date();
  };

  return (
    <TooltipProvider>
      {/* ALTERADO: grid-cols-2 md:grid-cols-4 para acomodar o card de 2 colunas */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 relative z-10">
        
        {/* CARD 3: Ocupação Máxima (DESTAQUE) */}
        <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-red-500 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-sm font-medium flex items-center gap-1 cursor-help">
                  OCUPAÇÃO MÁXIMA DO INVENTÁRIO
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>O pico de uso (em %) atingido durante o período e horário selecionados no filtro. É calculado sobre o total de equipamentos móveis (excluindo status 'fixo' e 'fora_uso').</p>
              </TooltipContent>
            </ShadcnTooltip>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
          </CardHeader>
          <CardContent>
            {/* Aumentando o tamanho do valor */}
            <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              {maxOccupancyRate.toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pico de uso no período selecionado
            </p>
          </CardContent>
        </GlassCard>
        
        {/* CARD 1: Empréstimos Ativos (Contagem de ativos) */}
        <GlassCard 
          className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500 cursor-pointer"
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Empréstimos Ativos
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Número de Chromebooks atualmente emprestados (status 'emprestado').</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{totalActive}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {filteredLoans.length} empréstimos no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 2: Disponíveis (NOVO: Clicável para ver a lista) */}
        <GlassCard 
          className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500 cursor-pointer"
          onClick={() => onCardClick('Disponíveis', 'Lista de Chromebooks prontos para empréstimo.', 'chromebooks', null, 'disponivel')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Disponíveis
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Número de Chromebooks com status 'disponível' no inventário.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{availableChromebooks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              de {totalChromebooks} no total
            </p>
          </CardContent>
        </GlassCard>
        
        {/* Linha 2: Tempo Médio e Taxa de Devolução */}
        
        {/* CARD 4: Tempo Médio (Não Clicável - Métrica de cálculo) */}
        <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              {Math.round(averageUsageTime)} min
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              média no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 5: Taxa de Devolução (Não Clicável - Métrica de cálculo) */}
        <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
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
const PeriodCharts = ({ periodView, loading, periodChartData, stats, startHour, endHour, totalChromebooks, availableChromebooks, userTypeData, durationData, isNewLoan, history }: any) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Cores para o gráfico de pizza de Status
  const COLORS = ['#2563EB', '#22C55E'];
  
  // Renderiza o histórico completo
  if (periodView === 'history') {
    return <LoanHistory history={history} isNewLoan={isNewLoan} />;
  }
  
  // Renderiza os gráficos para Diário, Semanal e Mensal
  const isDaily = periodView === 'daily';
  const isWeekly = periodView === 'weekly';
  const isMonthly = periodView === 'monthly';
  
  const chartTitle = isDaily ? 'Atividade por Hora' : isWeekly ? 'Atividade Semanal' : 'Tendência Mensal';
  const chartDescription = isDaily ? 'Movimentação ao longo do dia' : isWeekly ? 'Últimos 7 dias' : 'Últimos 30 dias';
  const chartDataKey = isDaily ? 'hora' : 'date';
  
  // Desestruturação segura para stats, incluindo filteredLoans e filteredReturns
  const { 
    totalActive = 0, 
    loansByUserType = {},
    filteredLoans = [], // Adicionado para uso no cálculo de progresso
    filteredReturns = [], // Adicionado para uso no cálculo de progresso
  } = stats || {};

  // Garante que filteredLoans.length seja seguro para divisão
  const totalLoansInPeriod = filteredLoans.length || 1;

  return (
    <>
      <GlassCard className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{chartTitle}</CardTitle>
            <CardDescription>
              {chartDescription}
            </CardDescription>
          </div>
          <BarChartIcon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[300px]">
          <ChartContainer
            config={{
              empréstimos: { label: "Empréstimos", color: "hsl(var(--primary))" },
              devoluções: { label: "Devoluções", color: "hsl(var(--menu-green))" },
            }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {/* ALTERADO: Usando BarChart em vez de ComposedChart/Area para consistência */}
              <BarChart data={isDaily ? periodChartData.slice(startHour - 6, endHour - 6 + 1) : periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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
      <GlassCard className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Taxa de Ocupação Horária</CardTitle>
            <CardDescription>
              Ocupação do inventário móvel entre {startHour}h e {endHour}h
            </CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[300px]">
          <ChartContainer
            config={{
              ocupação: { label: "Ocupação (%)", color: "hsl(var(--destructive))" },
            }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={isDaily ? periodChartData.slice(startHour - 6, endHour - 6 + 1) : periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <GlassCard className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Status dos Chromebooks</CardTitle>
              <CardDescription>
                Total de {totalChromebooks} equipamentos
              </CardDescription>
            </div>
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px] flex items-center justify-center">
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

        <GlassCard className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Uso por Tipo de Usuário</CardTitle>
              <CardDescription>
                Distribuição dos empréstimos no período
              </CardDescription>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[250px]">
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
        <GlassCard className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tempo de Uso Médio</CardTitle>
              <CardDescription>
                Por tipo de usuário (minutos)
              </CardDescription>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ChartContainer
              config={{
                minutos: { label: "Minutos", color: "hsl(var(--menu-violet))" }, // Usando cor do menu violeta
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationData} layout="horizontal" margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="minutos" fill="hsl(var(--menu-violet))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </GlassCard>

        <GlassCard className="dashboard-card">
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