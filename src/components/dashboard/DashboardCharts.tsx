import React from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, Users, TrendingUp, AlertTriangle, Loader2, BookOpen, Activity, GraduationCap, Briefcase, UserCheck } from "lucide-react";
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

  // Cores para o gráfico de pizza de Status
  const COLORS = ['#2563EB', '#22C55E'];

  // Renderiza o histórico completo
  if (periodView === 'history') {
    return <LoanHistory history={history} isNewLoan={isNewLoan} />;
  }

  // Renderiza os gráficos para o intervalo de tempo selecionado

  const chartTitle = periodChartData.length > 2 ? 'Atividade Diária' : 'Atividade Horária';
  const chartDescription = periodChartData.length > 2 ? 'Movimentação ao longo dos dias selecionados' : 'Movimentação ao longo das horas selecionadas';
  const chartDataKey = 'label';

  // Desestruturação segura para stats
  const {
    totalActive = 0,
    loansByUserType = {},
    filteredLoans = [],
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
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        <div className={cn("border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]", getAnimationClass(600))}>
          <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
            <div>
              <CardTitle className="text-xl font-black uppercase">Gráfico de Atividade</CardTitle>
              <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
                {chartDescription}
              </CardDescription>
            </div>
            <div className="p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <BarChartIcon className="h-5 w-5 text-black dark:text-white" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
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

        {/* NOVO GRÁFICO: Ocupação Horária */}
        <div className={cn("border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]", getAnimationClass(700))}>
          <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
            <div>
              <CardTitle className="text-xl font-black uppercase">Taxa de Ocupação Horária</CardTitle>
              <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
                Ocupação do inventário móvel no período
              </CardDescription>
            </div>
            <div className="p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <TrendingUp className="h-5 w-5 text-black dark:text-white" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            <ChartContainer
              config={{
                ocupação: { label: "Ocupação (%)", color: "#EF4444" },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

                  <Line
                    type="monotone"
                    dataKey="ocupação"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ stroke: '#000', strokeWidth: 2, r: 4, fill: '#EF4444' }}
                    activeDot={{ stroke: '#000', strokeWidth: 2, r: 6, fill: '#EF4444' }}
                    name="Ocupação (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 mt-8">
        <div className={cn("border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]", getAnimationClass(800))}>
          <CardHeader className="flex flex-row items-center justify-between border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
            <div>
              <CardTitle className="text-xl font-black uppercase">Status dos Chromebooks</CardTitle>
              <CardDescription className="font-mono text-xs font-bold text-gray-500 mt-1">
                Total de {totalChromebooks} equipamentos
              </CardDescription>
            </div>
            <div className="p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <PieChartIcon className="h-5 w-5 text-black dark:text-white" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center p-6">
            <ChartContainer
              config={{
                'Em Uso': { label: "Em Uso", color: "#3B82F6" },
                'Disponíveis': { label: "Disponíveis", color: "#22C55E" },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={[{ name: "Em Uso", value: totalActive }, { name: "Disponíveis", value: availableChromebooks }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#000"
                    strokeWidth={2}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {[{ name: "Em Uso", value: totalActive }, { name: "Disponíveis", value: availableChromebooks }].map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="#000" strokeWidth={2} />)}
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