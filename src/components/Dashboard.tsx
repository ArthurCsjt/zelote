import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart, ComposedChart } from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, subMonths, subWeeks, startOfWeek, startOfMonth, endOfMonth, endOfWeek, addDays } from "date-fns";
import type { LoanHistoryItem } from "@/types/database";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./ui/chart";
import { Computer, Download, ArrowLeft, BarChart as BarChartIcon, PieChart as PieChartIcon, Clock, Users, Calendar, CalendarRange, Activity, ChartLine, Loader2, History as HistoryIcon } from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDatabase } from '@/hooks/useDatabase';
import { useOverdueLoans } from '@/hooks/useOverdueLoans';
import { LoanHistory } from "./LoanHistory";
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard

interface DashboardProps {
  onBack?: () => void;
}

// Componente auxiliar para renderizar o grid de estatísticas
const StatsGrid = ({ periodView, filteredLoans, filteredReturns, activeLoans, totalChromebooks, averageUsageTime, completionRate }: any) => {
  if (periodView === 'history') return null;

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 relative z-10">
      <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">
            Empréstimos
          </CardTitle>
          <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{filteredLoans.length}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {filteredReturns.length} devoluções no período
          </p>
        </CardContent>
      </GlassCard>

      <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">
            Chromebooks Ativos
          </CardTitle>
          <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{activeLoans.length}</div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={activeLoans.length / totalChromebooks * 100} className="h-1.5 sm:h-2" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {(activeLoans.length / totalChromebooks * 100).toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">
            Tempo Médio
          </CardTitle>
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

      <GlassCard className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">
            Taxa de Devolução
          </CardTitle>
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
  );
};


export function Dashboard({
  onBack
}: DashboardProps) {
  // Removido useIsMobile
  
  const {
    getLoanHistory,
    getChromebooks
  } = useDatabase();
  const {
    overdueLoans,
    upcomingDueLoans
  } = useOverdueLoans();
  const [activeLoans, setActiveLoans] = useState < LoanHistoryItem[] > ([]);
  const [history, setHistory] = useState < LoanHistoryItem[] > ([]);
  const [chromebooks, setChromebooks] = useState < any[] > ([]);
  const {
    toast
  } = useToast();
  const [periodView, setPeriodView] = useState < 'daily' | 'weekly' | 'monthly' | 'history' > ('daily');
  const [periodData, setPeriodData] = useState < any[] > ([]);
  const [loading, setLoading] = useState(false);
  const totalChromebooks = chromebooks.length;
  const availableChromebooks = totalChromebooks - activeLoans.length;

  // Buscar dados iniciais
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyData, chromebooksData] = await Promise.all([getLoanHistory(), getChromebooks()]);
      setHistory(historyData);
      setChromebooks(chromebooksData);
      setActiveLoans(historyData.filter(loan => !loan.return_date));
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [getLoanHistory, getChromebooks]);

  // useEffect para buscar dados
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Função para obter dados baseados no período selecionado
  useEffect(() => {
    const currentDate = new Date();
    let filteredData: any[] = [];
    switch (periodView) {
      case 'daily':
        // Dados por hora do dia atual
        filteredData = Array.from({
          length: 24
        }, (_, i) => {
          const hour = i;
          const hourLoans = history.filter(loan => {
            const loanDate = new Date(loan.loan_date);
            return isToday(loanDate) && loanDate.getHours() === hour;
          });
          return {
            hora: `${hour}h`,
            empréstimos: hourLoans.length,
            devoluções: hourLoans.filter(loan => loan.status === 'devolvido').length
          };
        });
        break;
      case 'weekly':
        // Dados dos últimos 7 dias
        filteredData = Array.from({
          length: 7
        }, (_, i) => {
          const date = subDays(currentDate, 6 - i);
          const dailyLoans = history.filter(loan => isWithinInterval(new Date(loan.loan_date), {
            start: startOfDay(date),
            end: new Date(date.setHours(23, 59, 59, 999))
          }));
          return {
            date: format(date, "dd/MM"),
            empréstimos: dailyLoans.length,
            devoluções: dailyLoans.filter(loan => loan.return_date).length
          };
        });
        break;
      case 'monthly':
        // Dados dos últimos 30 dias
        filteredData = Array.from({
          length: 30
        }, (_, i) => {
          const date = subDays(currentDate, 29 - i);
          const dailyLoans = history.filter(loan => isWithinInterval(new Date(loan.loan_date), {
            start: startOfDay(date),
            end: new Date(date.setHours(23, 59, 59, 999))
          }));
          return {
            date: format(date, "dd/MM"),
            empréstimos: dailyLoans.length,
            devoluções: dailyLoans.filter(loan => loan.return_date).length
          };
        });
        break;
    }
    setPeriodData(filteredData);
  }, [periodView, history]);

  const pieData = [{
    name: "Em Uso",
    value: activeLoans.length
  }, {
    name: "Disponíveis",
    value: availableChromebooks
  }];
  const COLORS = ["#2563EB", "#22C55E"];

  // Obter dados filtrados pelo período atual
  const getFilteredLoans = () => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;
    switch (periodView) {
      case 'daily':
        startDate = startOfDay(today);
        break;
      case 'weekly':
        startDate = startOfWeek(today, {
          weekStartsOn: 1
        });
        endDate = endOfWeek(today, {
          weekStartsOn: 1
        });
        break;
      case 'monthly':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      default:
        startDate = startOfDay(today);
    }
    return history.filter(loan => isWithinInterval(new Date(loan.loan_date), {
      start: startDate,
      end: endDate
    }));
  };
  const filteredLoans = getFilteredLoans();
  const filteredReturns = filteredLoans.filter(loan => loan.return_date);

  // Estatísticas
  const completionRate = filteredLoans.length > 0 ? filteredReturns.length / filteredLoans.length * 100 : 0;
  const averageUsageTime = filteredReturns.reduce((acc, loan) => {
    if (loan.return_date) {
      const duration = differenceInMinutes(new Date(loan.return_date), new Date(loan.loan_date));
      return acc + duration;
    }
    return acc;
  }, 0) / (filteredReturns.length || 1);
  const loansByUserType = filteredLoans.reduce((acc, loan) => {
    const userType = loan.user_type || 'aluno';
    acc[userType] = (acc[userType] || 0) + 1;
    return acc;
  }, {} as Record < string, number > );
  const userTypeData = Object.entries(loansByUserType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }));
  const completedLoans = filteredLoans.filter(loan => loan.return_date);
  const averageLoanDurations = completedLoans.reduce((acc, loan) => {
    if (loan.return_date) {
      const durationMinutes = differenceInMinutes(new Date(loan.return_date), new Date(loan.loan_date));
      if (!acc[loan.user_type || 'aluno']) {
        acc[loan.user_type || 'aluno'] = {
          total: 0,
          count: 0
        };
      }
      acc[loan.user_type || 'aluno'].total += durationMinutes;
      acc[loan.user_type || 'aluno'].count += 1;
    }
    return acc;
  }, {} as Record < string, {
    total: number;
    count: number;
  } > );
  const durationData = Object.entries(averageLoanDurations).map(([type, data]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    minutos: Math.round(data.total / data.count)
  }));

  // Texto do período selecionado
  const periodText = {
    daily: 'Hoje',
    weekly: 'Esta Semana',
    monthly: 'Este Mês',
    history: 'Histórico Completo',
  };

  // Função para gerar o PDF do relatório
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
    const periodStats = [`Empréstimos: ${filteredLoans.length}`, `Devoluções: ${filteredReturns.length}`, `Chromebooks ativos: ${activeLoans.length} de ${totalChromebooks}`, `Tempo médio de uso: ${Math.round(averageUsageTime)} minutos`, `Taxa de devolução: ${completionRate.toFixed(0)}%`];
    periodStats.forEach(stat => {
      pdf.text(`• ${stat}`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 13;
    pdf.setFontSize(16);
    pdf.text("Empréstimos por Tipo de Usuário", 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    Object.entries(loansByUserType).forEach(([type, count]) => {
      pdf.text(`• ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 13;
    pdf.setFontSize(16);
    pdf.text("Empréstimos Ativos", 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    activeLoans.forEach(loan => {
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
        description: "O download do Histórico deve ser feito na própria aba, se disponível.",
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

  return <div className="space-y-8 glass-morphism p-4 sm:p-6 lg:p-8 animate-fade-in relative bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-slate-200/20">
      { /* Background gradient overlay */ }
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 blur-2xl transform scale-110 py-[25px] rounded-3xl bg-[#000a0e]/0" />
      
      {/* Header: Title and Download Button */}
      <div className="flex justify-between items-center relative z-10">
        <h2 className="text-xl sm:text-3xl font-bold text-gray-800 whitespace-nowrap">
          Dashboard
        </h2>
        
        {/* Botão de download: Branco (outline) e apenas ícone */}
        <Button 
          variant="outline" // Alterado para outline (branco)
          size="icon" // Alterado para icon (apenas ícone)
          onClick={handleDownloadPDF} 
          disabled={periodView === 'history'}
          className="h-10 w-10" // Definindo tamanho para ser um quadrado
        >
          <Download className="h-5 w-5" /> {/* Ícone sem margem */}
        </Button>
      </div>

      {/* Tabs for Period Selection */}
      <Tabs defaultValue="daily" value={periodView} onValueChange={(v) => setPeriodView(v as any)} className="relative z-10">
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Grid de Cards de Estatísticas (Visível em todas as abas exceto Histórico) */}
            <StatsGrid 
              periodView={periodView}
              filteredLoans={filteredLoans}
              filteredReturns={filteredReturns}
              activeLoans={activeLoans}
              totalChromebooks={totalChromebooks}
              averageUsageTime={averageUsageTime}
              completionRate={completionRate}
            />

            <TabsContent value="daily" className="space-y-4 mt-6">
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
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={periodData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="empréstimos" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="devoluções" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({
                      name,
                      value
                    }) => `${name}: ${value}`}>
                          {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
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
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={durationData} layout="horizontal" margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="minutos" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">Chromebooks Disponíveis</span>
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          {availableChromebooks} de {totalChromebooks}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 mt-6">
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
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={periodData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="empréstimos" fill="#2563EB" stroke="#2563EB" fillOpacity={0.3} />
                      <Bar dataKey="devoluções" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
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
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={durationData} layout="horizontal" margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="minutos" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4 mt-6">
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
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={periodData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="empréstimos" stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="devoluções" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={durationData} layout="horizontal" margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="minutos" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </GlassCard>
            </TabsContent>
            
            {/* ABA DE HISTÓRICO */}
            <TabsContent value="history" className="space-y-4 mt-6">
              <LoanHistory history={history} />
            </TabsContent>
          </>
        )}
      </Tabs>
      
    </div>;
}