import React from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, Users, TrendingUp, AlertTriangle, Loader2, BookOpen, Activity, GraduationCap, Briefcase, UserCheck, Zap } from "lucide-react";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from '@/lib/utils';
import { LoanHistory } from "@/components/LoanHistory";
import { TopLoanContextsPanel } from "@/components/TopLoanContextsPanel";
import type { LoanHistoryItem, Chromebook } from "@/types/database";
import type { PeriodView, DashboardStats } from '@/hooks/useDashboardData';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface DashboardChartsProps {
  periodView: PeriodView | 'charts';
  loading: boolean;
  periodChartData: any[];
  stats: DashboardStats | null;
  totalChromebooks: number;
  availableChromebooks: number;
  userTypeData: { name: string; value: number }[];
  durationData: { name: string; minutos: number }[];
  isNewLoan: (loan: LoanHistoryItem) => boolean;
  history: LoanHistoryItem[];
  isMounted: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  periodView,
  loading,
  periodChartData,
  stats,
  totalChromebooks,
  availableChromebooks,
  userTypeData,
  durationData,
  isNewLoan,
  history,
  isMounted,
}) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (periodView === 'charts' && periodChartData.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Nenhum dado de empréstimo encontrado no período.</p>
        <p className="text-sm text-muted-foreground mt-2">Tente ampliar o intervalo de datas ou horários no filtro acima.</p>
      </GlassCard>
    );
  }

  // Renderiza o histórico completo
  if (periodView === 'history') {
    return <LoanHistory history={history} isNewLoan={isNewLoan} />;
  }

  const chartDescription = periodChartData.length > 2 ? 'Movimentação ao longo dos dias selecionados' : 'Movimentação ao longo das horas selecionadas';
  const chartDataKey = 'label';

  // Desestruturação segura para stats
  const {
    totalActive = 0,
    loansByUserType = {},
    topLoanContexts = [],
    peakHour = null,
    fleetDistribution = [],
  } = stats || {};

  // Total de empréstimos e devoluções no gráfico
  const totalLoansInChart = periodChartData.reduce((acc, curr) => acc + (curr.empréstimos || 0), 0);
  const totalReturnsInChart = periodChartData.reduce((acc, curr) => acc + (curr.devoluções || 0), 0);

  // Total de empréstimos no período (soma por tipo de usuário)
  const totalLoansInPeriod =
    (loansByUserType.aluno || 0) +
    (loansByUserType.professor || 0) +
    (loansByUserType.funcionario || 0) ||
    1;

  // Dados da Frota Completa (4 fatias)
  const fleetData = fleetDistribution.length > 0 ? fleetDistribution : [
    { name: "Livres", value: availableChromebooks, color: "#22C55E" },
    { name: "Fixos em Sala", value: stats?.totalFixed || 0, color: "#3B82F6" },
    { name: "Em Uso Agora", value: totalActive, color: "#F59E0B" },
    { name: "Manutenção", value: stats?.totalMaintenance || 0, color: "#EF4444" },
  ];

  const getAnimationClass = (delay: number) =>
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  return (
    <>
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {/* GRÁFICO 1: Atividade (Empréstimos vs Devoluções) */}
        <div className={cn("border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]", getAnimationClass(600))}>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-4 sm:p-6">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black uppercase">Gráfico de Atividade</CardTitle>
              <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-0.5">
                {chartDescription}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-black">
                {totalLoansInChart} Saídas
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200 border border-black">
                {totalReturnsInChart} Retornos
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-4 sm:p-6">
            <ChartContainer
              config={{
                empréstimos: { label: "Empréstimos", color: "#2563EB" },
                devoluções: { label: "Devoluções", color: "#22C55E" },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey={chartDataKey} tick={{ fontSize: 11, fontWeight: 'bold' }} stroke="#000" />
                  <YAxis tick={{ fontSize: 11, fontWeight: 'bold' }} stroke="#000" />
                  <Tooltip content={<ChartTooltipContent className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none" />} />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 'bold' }} />

                  <Bar
                    dataKey="empréstimos"
                    fill="#2563EB"
                    radius={[0, 0, 0, 0]}
                    name="Empréstimos"
                    stroke="#000"
                    strokeWidth={2}
                  />

                  <Bar
                    dataKey="devoluções"
                    fill="#22C55E"
                    radius={[0, 0, 0, 0]}
                    name="Devoluções"
                    stroke="#000"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </div>

        {/* GRÁFICO 2: Ocupação Horária (com Gradiente e Pico) */}
        <div className={cn("border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]", getAnimationClass(700))}>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-4 sm:p-6">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black uppercase">Taxa de Ocupação da Frota</CardTitle>
              <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-0.5">
                Demanda percentual ao longo do tempo
              </CardDescription>
            </div>
            {peakHour && (
              <Badge className="bg-amber-400 text-black border-2 border-black font-black uppercase text-[10px] tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none">
                <Zap className="h-3 w-3 mr-1" />
                Pico: {peakHour.label} ({peakHour.occupancy}%)
              </Badge>
            )}
          </CardHeader>
          <CardContent className="h-[350px] p-4 sm:p-6">
            <ChartContainer
              config={{
                ocupação: { label: "Ocupação (%)", color: "#EF4444" },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={periodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey={chartDataKey} tick={{ fontSize: 11, fontWeight: 'bold' }} stroke="#000" />
                  <YAxis
                    tick={{ fontSize: 11, fontWeight: 'bold' }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    stroke="#000"
                  />
                  <Tooltip content={<ChartTooltipContent className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none" />} />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 'bold' }} />

                  <Area
                    type="monotone"
                    dataKey="ocupação"
                    stroke="#EF4444"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#occupancyGradient)"
                    dot={{ stroke: '#000', strokeWidth: 2, r: 4, fill: '#EF4444' }}
                    activeDot={{ stroke: '#000', strokeWidth: 2, r: 6, fill: '#EF4444' }}
                    name="Ocupação (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 mt-8">
        {/* GRÁFICO 3: Raio-X da Frota Completa (Livres, Fixos, Em Uso, Manutenção) */}
        <div className={cn("border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]", getAnimationClass(800))}>
          <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
            <div>
              <CardTitle className="text-xl font-black uppercase">Raio-X da Frota Completa</CardTitle>
              <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
                Total de {totalChromebooks} equipamentos cadastrados
              </CardDescription>
            </div>
            <div className="p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <PieChartIcon className="h-5 w-5 text-black dark:text-white" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center p-6">
            <ChartContainer
              config={{
                'Livres p/ Empréstimo': { label: "Livres", color: "#22C55E" },
                'Fixos em Sala': { label: "Fixos", color: "#3B82F6" },
                'Em Uso Agora': { label: "Em Uso", color: "#F59E0B" },
                'Em Manutenção': { label: "Manutenção", color: "#EF4444" },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={fleetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#000"
                    strokeWidth={2}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {fleetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none" />} />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </div>

        <div className={cn("border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]", getAnimationClass(900))}>
          <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
            <div>
              <CardTitle className="text-xl font-black uppercase">Uso por Tipo de Usuário</CardTitle>
              <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
                Distribuição dos empréstimos
              </CardDescription>
            </div>
            <div className="p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <Users className="h-5 w-5 text-black dark:text-white" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
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
                  <Pie
                    data={userTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#000"
                    strokeWidth={2}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} stroke="#000" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none" />} />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 mt-8">
        {/* NOVO PAINEL: Top Contextos de Empréstimo */}
        <div className={getAnimationClass(1000)}>
          <TopLoanContextsPanel topLoanContexts={topLoanContexts} />
        </div>

        <div className={cn("border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]", getAnimationClass(1100))}>
          <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
            <div>
              <CardTitle className="text-xl font-black uppercase">Estatísticas Rápidas</CardTitle>
              <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
                Resumo do período
              </CardDescription>
            </div>
            <div className="p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <Activity className="h-5 w-5 text-black dark:text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2 uppercase"><GraduationCap className="h-4 w-4" /> Alunos</span>
                <span className="font-mono text-sm font-bold bg-blue-100 px-2 py-1 border border-black">{loansByUserType.aluno || 0}</span>
              </div>
              <div className="h-3 w-full bg-gray-100 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(((loansByUserType.aluno || 0) / totalLoansInPeriod) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2 uppercase"><UserCheck className="h-4 w-4" /> Professores</span>
                <span className="font-mono text-sm font-bold bg-green-100 px-2 py-1 border border-black">{loansByUserType.professor || 0}</span>
              </div>
              <div className="h-3 w-full bg-gray-100 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${Math.min(((loansByUserType.professor || 0) / totalLoansInPeriod) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2 uppercase"><Briefcase className="h-4 w-4" /> Funcionários</span>
                <span className="font-mono text-sm font-bold bg-orange-100 px-2 py-1 border border-black">{loansByUserType.funcionario || 0}</span>
              </div>
              <div className="h-3 w-full bg-gray-100 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${Math.min(((loansByUserType.funcionario || 0) / totalLoansInPeriod) * 100, 100)}%` }} />
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </>
  );
};