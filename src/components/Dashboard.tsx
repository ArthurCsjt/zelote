import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart, ComposedChart } from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, subMonths, subWeeks, startOfWeek, startOfMonth, endOfMonth, endOfWeek, addDays } from "date-fns";
import type { LoanHistoryItem } from "@/types/database";
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
import { DashboardFilter } from "./DashboardFilter"; // NOVO IMPORT
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"; // Importando Tooltip

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

// Componente auxiliar para renderizar o grid de estatísticas
const StatsGrid = ({ periodView, stats, filteredLoans, filteredReturns, loading }: any) => {
  if (periodView === 'history' || periodView === 'reports') return null;

  const { totalActive, totalChromebooks, totalInventoryUsageRate, averageUsageTime, completionRate, maxOccupancyRate } = stats;

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 relative z-10">
        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5 relative z-10">
        
        {/* CARD 1: Empréstimos Ativos (Contagem de ativos) */}
        <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Empréstimos Ativos
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Número de Chromebooks atualmente emprestados (status 'emprestado').</p>
              </TooltipContent>
            </Tooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{totalActive}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {filteredLoans.length} empréstimos no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 2: Taxa de Uso do Inventário (CORRIGIDO: ativos / total de móveis) */}
        <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Taxa de Uso Atual
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Porcentagem de Chromebooks móveis que estão emprestados neste exato momento.</p>
              </TooltipContent>
            </Tooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{totalInventoryUsageRate.toFixed(0)}%</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={totalInventoryUsageRate} className="h-1.5 sm:h-2" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {totalActive} em uso (móveis)
              </span>
            </div>
          </CardContent>
        </GlassCard>
        
        {/* NOVO CARD: Ocupação Máxima */}
        <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Ocupação Máxima
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>O pico de uso (em %) atingido durante o período e horário selecionados no filtro.</p>
              </TooltipContent>
            </Tooltip>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">{maxOccupancyRate.toFixed(0)}%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Pico de uso no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 3: Tempo Médio (Mantido) */}
        <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Tempo Médio de Uso
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Duração média (em minutos) dos empréstimos que foram devolvidos no período selecionado.</p>
              </TooltipContent>
            </Tooltip>
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

        {/* CARD 4: Taxa de Devolução (Mantido) */}
        <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Taxa de Devolução
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Porcentagem de empréstimos realizados no período que já foram devolvidos.</p>
              </TooltipContent>
            </Tooltip>
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


export function Dashboard({
  onBack
}: DashboardProps) {
  const {
    toast
  } = useToast();
  const [periodView, setPeriodView] = useState < PeriodView > ('daily');
  const [startHour, setStartHour] = useState(7); // NOVO ESTADO
  const [endHour, setEndHour] = useState(19); // NOVO ESTADO
  
  // NOVO: Usando o hook centralizado com os filtros de hora
  const { 
    loading, 
    history, 
    chromebooks, 
    filteredLoans, 
    filteredReturns, 
    periodChartData, 
    stats, 
    refreshData 
  } = useDashboardData(periodView, startHour, endHour); // PASSANDO OS FILTROS

  const { overdueLoans, upcomingDueLoans } = useOverdueLoans();
  
  const { totalChromebooks, availableChromebooks, loansByUserType, userTypeData, durationData, maxOccupancyRate } = stats;

  // Função para gerar o PDF do relatório
  const periodText = {
    daily: 'Hoje',
    weekly: 'Esta Semana',
    monthly: 'Este Mês',
    history: 'Histórico Completo',
    // reports: 'Relatórios Inteligentes' // Removido
  };

  const generatePDFContent = (pdf: jsPDF) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;
    pdf.setFontSize(20);
    pdf.text(`Relatório de Uso dos Chromebooks - ${periodText[periodView as keyof typeof periodText]}`, pageWidth / 2, yPosition, {
      align: "center"
    });
    yPosition += 20;
    pdf.setFontSize(12);
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, yPosition, {
      align: "center"
    });
    yPosition += 20;
    pdf.setFontSize(16);
    pdf.text(`Estatísticas do ${periodText[periodView as keyof typeof periodText]}`, 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    const periodStats = [
      `Empréstimos: ${filteredLoans.length}`, 
      `Devoluções: ${filteredReturns.length}`, 
      `Chromebooks ativos: ${stats.totalActive} de ${totalChromebooks}`, 
      `Taxa de Ocupação Máxima: ${stats.maxOccupancyRate.toFixed(0)}%`, // NOVO DADO
      `Tempo médio de uso: ${Math.round(stats.averageUsageTime)} minutos`, 
      `Taxa de devolução: ${stats.completionRate.toFixed(0)}%`
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
    if (periodView === 'history') {
      toast({
        title: "Atenção",
        description: "O download de relatórios IA ou Histórico deve ser feito na própria aba, se disponível.",
        variant: "destructive"
      });
      return;
    }
    try {
      const pdf = new jsPDF();
      generatePDFContent(pdf);
      pdf.save(`relatorio-chromebooks-${periodView}.pdf`);
      toast({
        title: "Sucesso",
        description: `Relatório ${periodText[periodView as keyof typeof periodText]} gerado com sucesso!`
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

  // Cores para o gráfico de pizza de Status
  const COLORS = ['#2563EB', '#22C55E'];


  return <div className="space-y-8 relative py-[30px]">
      { /* Background gradient overlay */ }
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 blur-2xl transform scale-110 py-[25px] rounded-3xl bg-[#000a0e]/0" />
      
      {/* Header: Title and Download Button */}
      <div className="flex justify-between items-center relative z-10">
        <h2 className="text-xl sm:text-3xl font-bold text-gray-800 whitespace-nowrap">
          Dashboard
        </h2>
        <Button 
          variant="outline" 
          onClick={refreshData} 
          className="flex items-center gap-2 hover:bg-blue-50" 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{loading ? 'Atualizando...' : 'Atualizar Dados'}</span>
        </Button>
      </div>

      {/* Tabs for Period Selection */}
      <Tabs defaultValue="daily" value={periodView} onValueChange={(v) => setPeriodView(v as PeriodView)} className="relative z-10">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="daily" className="flex items-center gap-1 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            Diário
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-1 text-xs sm:text-sm">
            <CalendarRange className="h-3 w-3 sm:h-4 sm:w-4" />
            Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1 text-xs sm:text-sm">
            <ChartLine className="h-3 w-3 sm:h-4 sm:w-4" />
            Mensal
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-menu-rose data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-menu-rose/80 transition-colors"
          >
            <HistoryIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>
        
        {/* Filtro de Hora (Aparece acima das estatísticas) */}
        <div className="mt-6">
            <DashboardFilter 
                periodView={periodView}
                setPeriodView={setPeriodView}
                startHour={startHour}
                setStartHour={setStartHour}
                endHour={endHour}
                setEndHour={setEndHour}
                onApply={refreshData} // Força o recálculo dos dados
                loading={loading}
            />
        </div>

        {/* Grid de Cards de Estatísticas (Visível em todas as abas exceto Histórico/Relatórios) */}
        <StatsGrid 
          periodView={periodView}
          filteredLoans={filteredLoans}
          filteredReturns={filteredReturns}
          stats={stats}
          loading={loading}
        />

        <TabsContent value="daily" className="space-y-4 mt-6">
          {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <>
              <GlassCard className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Atividade por Hora</CardTitle>
                    <CardDescription>
                      Movimentação ao longo do dia
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
                      <ComposedChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                        <defs>
                          {/* Gradiente para a área de Empréstimos */}
                          <linearGradient id="colorEmprestimos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                          {/* Gradiente para a área de Devoluções (opcional, mas mantém o estilo) */}
                          <linearGradient id="colorDevolucoes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="hora" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        
                        {/* Área para Empréstimos (Visual mais suave) */}
                        <Area 
                          type="monotone" 
                          dataKey="empréstimos" 
                          stroke="#2563EB" 
                          fill="url(#colorEmprestimos)" 
                          fillOpacity={1} 
                          name="Empréstimos"
                        />
                        
                        {/* Linha ou Barra para Devoluções (Destaque) */}
                        <Bar 
                          dataKey="devoluções" 
                          fill="#22C55E" 
                          radius={[4, 4, 0, 0]} 
                          name="Devoluções"
                        />
                      </ComposedChart>
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
                            value: stats.totalActive
                          }, {
                            name: "Disponíveis",
                            value: availableChromebooks
                          }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                            {[{
                              name: "Em Uso",
                              value: stats.totalActive
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
                        Distribuição dos empréstimos hoje
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
                      <LineChart data={periodChartData.slice(startHour - 6, endHour - 6 + 1)} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="hora" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
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
                      <Progress value={(loansByUserType.aluno || 0) / filteredLoans.length * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Professores</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {loansByUserType.professor || 0} empréstimos
                        </Badge>
                      </div>
                      <Progress value={(loansByUserType.professor || 0) / filteredLoans.length * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Funcionários</span>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          {loansByUserType.funcionario || 0} empréstimos
                        </Badge>
                      </div>
                      <Progress value={(loansByUserType.funcionario || 0) / filteredLoans.length * 100} className="h-2" />
                    </div>
                  </CardContent>
                </GlassCard>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-6">
          {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <>
              <GlassCard className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Atividade Semanal</CardTitle>
                    <CardDescription>
                      Últimos 7 dias
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
                      <ComposedChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="empréstimos" fill="#2563EB" stroke="#2563EB" fillOpacity={0.3} />
                        <Bar dataKey="devoluções" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </GlassCard>
              
              {/* NOVO GRÁFICO: Ocupação Horária (Semanal) */}
              <GlassCard className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Taxa de Ocupação Horária (Semanal)</CardTitle>
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
                      <LineChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
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
                      <CardTitle className="text-lg">Uso por Tipo de Usuário</CardTitle>
                      <CardDescription>
                        Esta semana
                      </CardDescription>
                    </div>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="h-[250px] sm:h-[300px] flex items-center justify-center">
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
                          <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                            {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />)}
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
                      <CardTitle className="text-lg">Distribuição de Horários</CardTitle>
                      <CardDescription>
                        Preferências de horário esta semana
                      </CardDescription>
                    </div>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="h-[250px] sm:h-[300px] flex items-center justify-center">
                    <ChartContainer
                      config={{
                        'Manhã (8h-12h)': { label: "Manhã (8h-12h)", color: "#06B6D4" },
                        'Tarde (12h-17h)': { label: "Tarde (12h-17h)", color: "#8B5CF6" },
                        'Noite (17h-22h)': { label: "Noite (17h-22h)", color: "#F59E0B" },
                      }}
                      className="w-full h-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <Pie data={[{
                    name: "Manhã (8h-12h)",
                    value: filteredLoans.filter(loan => {
                      const hour = new Date(loan.loan_date).getHours();
                      return hour >= 8 && hour < 12;
                    }).length
                  }, {
                    name: "Tarde (12h-17h)",
                    value: filteredLoans.filter(loan => {
                      const hour = new Date(loan.loan_date).getHours();
                      return hour >= 12 && hour < 17;
                    }).length
                  }, {
                    name: "Noite (17h-22h)",
                    value: filteredLoans.filter(loan => {
                      const hour = new Date(loan.loan_date).getHours();
                      return hour >= 17 && hour < 22;
                    }).length
                  }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" label={({
                      name,
                      value
                    }) => value > 0 ? `${name}: ${value}` : ''}>
                            {[0, 1, 2].map(index => <Cell key={`cell-${index}`} fill={['#06B6D4', '#8B5CF6', '#F59E0B'][index]} />)}
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
                      <CardTitle className="text-lg">Tempo de Uso por Tipo</CardTitle>
                      <CardDescription>
                        Duração média em minutos
                      </CardDescription>
                    </div>
                    <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="h-[250px] sm:h-[300px]">
                    <ChartContainer
                      config={{
                        minutos: { label: "Minutos", color: "hsl(var(--menu-violet))" },
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
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4 mt-6">
          {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <>
              <GlassCard className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Tendência Mensal</CardTitle>
                    <CardDescription>
                      Últimos 30 dias
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
                      <AreaChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="empréstimos" stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="devoluções" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </GlassCard>
              
              {/* NOVO GRÁFICO: Ocupação Horária (Mensal) */}
              <GlassCard className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Taxa de Ocupação Horária (Mensal)</CardTitle>
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
                      <LineChart data={periodChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
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

              <GlassCard className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Duração Média de Uso</CardTitle>
                      <CardDescription>
                        Por tipo de usuário este mês
                      </CardDescription>
                    </div>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="h-[250px] sm:h-[300px]">
                    <ChartContainer
                      config={{
                        minutos: { label: "Minutos", color: "hsl(var(--menu-violet))" },
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
            </>
          )}
        </TabsContent>
        
        {/* ABA DE HISTÓRICO */}
        <TabsContent value="history" className="space-y-4 mt-6">
          {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <LoanHistory history={history} isNewLoan={isNewLoan} />}
        </TabsContent>
        
      </Tabs>
      
    </div>;
}