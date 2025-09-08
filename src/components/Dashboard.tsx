import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart, ComposedChart } from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, subMonths, subWeeks, startOfWeek, startOfMonth, endOfMonth, endOfWeek, addDays } from "date-fns";
import type { LoanHistoryItem } from "@/types/database";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./ui/chart";
import { Computer, Download, ArrowLeft, BarChart as BarChartIcon, PieChart as PieChartIcon, Clock, Users, Calendar, CalendarRange, Activity, ChartLine, Brain } from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileFriendlyDashboard } from "./MobileFriendlyDashboard";
import { useDatabase } from '@/hooks/useDatabase';
import { useOverdueLoans } from '@/hooks/useOverdueLoans';
import IntelligentReportsTab from './IntelligentReportsTab';
interface DashboardProps {
  onBack?: () => void;
}
export function Dashboard({
  onBack
}: DashboardProps) {
  const {
    getLoanHistory,
    getChromebooks
  } = useDatabase();
  const {
    overdueLoans,
    upcomingDueLoans
  } = useOverdueLoans();
  const [activeLoans, setActiveLoans] = useState<LoanHistoryItem[]>([]);
  const [history, setHistory] = useState<LoanHistoryItem[]>([]);
  const [chromebooks, setChromebooks] = useState<any[]>([]);
  const {
    toast
  } = useToast();
  const [periodView, setPeriodView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [periodData, setPeriodData] = useState<any[]>([]);
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
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  const pieData = [{
    name: "Em Uso",
    value: activeLoans.length
  }, {
    name: "Disponíveis",
    value: availableChromebooks
  }];
  const COLORS = ["#2563EB", "#22C55E"];

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
  }, {} as Record<string, number>);
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
  }, {} as Record<string, {
    total: number;
    count: number;
  }>);
  const durationData = Object.entries(averageLoanDurations).map(([type, data]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    minutos: Math.round(data.total / data.count)
  }));

  // Texto do período selecionado
  const periodText = {
    daily: 'Hoje',
    weekly: 'Esta Semana',
    monthly: 'Este Mês'
  };

  // Função para gerar o PDF do relatório
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
    pdf.text(`Estatísticas do ${periodText[periodView]}`, 20, yPosition);
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
    try {
      const pdf = new jsPDF();
      generatePDFContent(pdf);
      pdf.save(`relatorio-chromebooks-${periodView}.pdf`);
      toast({
        title: "Sucesso",
        description: `Relatório ${periodText[periodView]} gerado com sucesso!`
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
  return <div className="space-y-6 glass-morphism p-6 animate-fade-in relative px-[22px] py-[40px] bg-slate-300 rounded-md">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 blur-2xl transform scale-110 py-[25px] rounded-3xl bg-neutral-200" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 relative z-10">
        <div>
          <h2 className="text-2xl tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mx-px text-right px-[30px] text-slate-950 font-bold sm:text-lg">
            Dashboard
          </h2>
          
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start relative z-10">
          <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-2 hover:bg-blue-50 px-3 text-xs text-justify">
            <Download className="h-4 w-4" />
            <span className="whitespace-nowrap">Baixar Relatório</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full" onValueChange={v => setPeriodView(v as 'daily' | 'weekly' | 'monthly')}>
        <TabsList className="grid w-full sm:w-auto grid-cols-4 max-w-xl mb-4 bg-blue-100">
          <TabsTrigger value="daily" className="flex items-center gap-1 text-lg text-slate-950">
            <Calendar className="h-4 w-4 bg-slate-100" />
            <span className="text-black">Diário</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-1">
            <CalendarRange className="h-4 w-4" />
            <span className="text-black text-lg">Semanal</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1">
            <ChartLine className="h-4 w-4" />
            <span className="text-black text-lg">Mensal</span>
          </TabsTrigger>
          <TabsTrigger value="ia" className="flex items-center gap-1 font-thin text-base bg-black text-slate-50">
            <Brain className="h-4 w-4 rounded-sm" />
            <span className="text-lg font-medium text-center text-blue-100">Relatórios IA</span>
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-4 md:grid-cols-4 relative z-10">
          <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Empréstimos {periodText[periodView]}
              </CardTitle>
              <Computer className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{filteredLoans.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredReturns.length} devoluções
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chromebooks Ativos
              </CardTitle>
              <Computer className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{activeLoans.length}</div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={activeLoans.length / totalChromebooks * 100} className="h-2" />
                <span className="text-xs text-muted-foreground">
                  {(activeLoans.length / totalChromebooks * 100).toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tempo Médio de Uso
              </CardTitle>
              <Clock className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {Math.round(averageUsageTime)} min
              </div>
              <p className="text-xs text-muted-foreground">
                média {periodView === 'daily' ? 'do dia' : periodView === 'weekly' ? 'da semana' : 'do mês'}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Devolução
              </CardTitle>
              <Activity className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {completionRate.toFixed(0)}%
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={completionRate} className="h-2" />
                <span className="text-xs text-muted-foreground">
                  {filteredReturns.length} de {filteredLoans.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <TabsContent value="daily" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Atividade por Hora</CardTitle>
                  <CardDescription>
                    Movimentação ao longo do dia
                  </CardDescription>
                </div>
                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hora" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="empréstimos" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="devoluções" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Status dos Chromebooks</CardTitle>
                  <CardDescription>
                    Total de {totalChromebooks} equipamentos
                  </CardDescription>
                </div>
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Novos gráficos de pizza para análise detalhada */}
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card className="glass-card dashboard-card">
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
                  <PieChart>
                    <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({
                    name,
                    value
                  }) => `${name}: ${value}`}>
                      {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
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
                  <BarChart data={durationData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="minutos" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
                  <CardDescription>
                    Resumo do período
                  </CardDescription>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
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
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Atividade Semanal</CardTitle>
                  <CardDescription>
                    Últimos 7 dias
                  </CardDescription>
                </div>
                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="empréstimos" fill="#2563EB" stroke="#2563EB" fillOpacity={0.3} />
                    <Bar dataKey="devoluções" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Uso por Tipo de Usuário</CardTitle>
                  <CardDescription>
                    Esta semana
                  </CardDescription>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                      {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos adicionais para visão semanal */}
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Distribuição de Horários</CardTitle>
                  <CardDescription>
                    Preferências de horário esta semana
                  </CardDescription>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
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
                  }]} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value" label={({
                    name,
                    value
                  }) => value > 0 ? `${name}: ${value}` : ''}>
                      {[0, 1, 2].map(index => <Cell key={`cell-${index}`} fill={['#06B6D4', '#8B5CF6', '#F59E0B'][index]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tempo de Uso por Tipo</CardTitle>
                  <CardDescription>
                    Duração média em minutos
                  </CardDescription>
                </div>
                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutos" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tendência Mensal</CardTitle>
                  <CardDescription>
                    Últimos 30 dias
                  </CardDescription>
                </div>
                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="empréstimos" stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="devoluções" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Duração Média de Uso</CardTitle>
                  <CardDescription>
                    Por tipo de usuário este mês
                  </CardDescription>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="minutos" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Análise mensal mais detalhada */}
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Uso Mensal por Usuário</CardTitle>
                  <CardDescription>
                    Distribuição completa
                  </CardDescription>
                </div>
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={30} outerRadius={70} paddingAngle={5} dataKey="value" label={({
                    name,
                    percent
                  }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Performance Mensal</CardTitle>
                  <CardDescription>
                    Taxa de devolução e uso
                  </CardDescription>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{
                    name: "Devolvidos",
                    value: filteredReturns.length
                  }, {
                    name: "Pendentes",
                    value: filteredLoans.length - filteredReturns.length
                  }, {
                    name: "Ativos",
                    value: activeLoans.length
                  }]} cx="50%" cy="50%" innerRadius={30} outerRadius={70} paddingAngle={5} dataKey="value" label={({
                    name,
                    value
                  }) => `${name}: ${value}`}>
                      {[0, 1, 2].map(index => <Cell key={`cell-${index}`} fill={['#22C55E', '#F59E0B', '#EF4444'][index]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Resumo Executivo</CardTitle>
                  <CardDescription>
                    Métricas principais
                  </CardDescription>
                </div>
                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Utilização Total</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {(activeLoans.length / totalChromebooks * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Maior Uso</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {Object.entries(loansByUserType).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tempo Médio Total</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {Math.round(averageUsageTime)} min
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Taxa Devolução</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {completionRate.toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Status Geral</span>
                      <Badge variant={completionRate > 80 ? "default" : "destructive"}>
                        {completionRate > 80 ? "Excelente" : completionRate > 60 ? "Bom" : "Atenção"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ia" className="space-y-4 mt-6">
          <IntelligentReportsTab />
        </TabsContent>
      </Tabs>
      
      <Card className="glass-card dashboard-card mt-6">
        <CardHeader>
          <CardTitle>Empréstimos Ativos</CardTitle>
          <CardDescription>
            {activeLoans.length} Chromebooks em uso
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-y-auto">
          {activeLoans.length === 0 && <div className="text-center py-8 text-gray-500">
              <Computer className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>Nenhum empréstimo ativo no momento</p>
            </div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeLoans.map(loan => <div key={loan.id} className="p-4 glass-card border-white/30 border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{loan.student_name}</p>
                    <p className="text-sm text-gray-600">ID: {loan.chromebook_id}</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Pendente
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Retirada: {format(new Date(loan.loan_date), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
}