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
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <GlassCard className={cn("dashboard-card", getAnimationClass(600))}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Gráfico de Atividade</CardTitle>
              <CardDescription>
                {chartDescription}
              </CardDescription>
            </div>
            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]">
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
          <CardContent className="h-[300px]">
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
          <CardContent className="h-[300px] flex items-center justify-center">
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
          <CardContent className="h-[300px]">
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
                <span className="text-sm font-medium flex items-center gap-1"><GraduationCap className="h-4 w-4 text-blue-600" /> Alunos</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {loansByUserType.aluno || 0} empréstimos
                </Badge>
              </div>
              <Progress value={((loansByUserType.aluno || 0) / totalLoansInPeriod) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1"><UserCheck className="h-4 w-4 text-green-600" /> Professores</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {loansByUserType.professor || 0} empréstimos
                </Badge>
              </div>
              <Progress value={((loansByUserType.professor || 0) / totalLoansInPeriod) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1"><Briefcase className="h-4 w-4 text-orange-600" /> Funcionários</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
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