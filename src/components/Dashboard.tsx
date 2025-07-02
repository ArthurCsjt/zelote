import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, 
  Area, AreaChart, ComposedChart
} from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, 
  subMonths, subWeeks, startOfWeek, startOfMonth, endOfMonth, endOfWeek, addDays } from "date-fns";
import { Loan } from "./ActiveLoans";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./ui/chart";
import { 
  Computer, 
  Download, 
  ArrowLeft, 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Clock, 
  Users, 
  Calendar,
  CalendarRange, 
  Activity,
  ChartLine
} from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileFriendlyDashboard } from "./MobileFriendlyDashboard";

interface DashboardProps {
  activeLoans: Loan[];
  history: Loan[];
  onBack: () => void;
}

export function Dashboard({ activeLoans, history, onBack }: DashboardProps) {
  const { toast } = useToast();
  const [periodView, setPeriodView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [periodData, setPeriodData] = useState<any[]>([]);
  const totalChromebooks = 50;
  const availableChromebooks = totalChromebooks - activeLoans.length;

  const pieData = [
    { name: "Em Uso", value: activeLoans.length },
    { name: "Disponíveis", value: availableChromebooks },
  ];

  const COLORS = ["#2563EB", "#22C55E"];

  // Função para obter dados baseados no período selecionado
  useEffect(() => {
    const currentDate = new Date();
    let filteredData: any[] = [];

    switch(periodView) {
      case 'daily':
        // Dados por hora do dia atual
        filteredData = Array.from({ length: 24 }, (_, i) => {
          const hour = i;
          const hourLoans = history.filter(loan => {
            return isToday(loan.timestamp) && loan.timestamp.getHours() === hour;
          });
          
          return {
            hora: `${hour}h`,
            empréstimos: hourLoans.length,
            devoluções: hourLoans.filter(loan => loan.returnRecord).length,
          };
        });
        break;
      
      case 'weekly':
        // Dados dos últimos 7 dias
        filteredData = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(currentDate, 6 - i);
          const dailyLoans = history.filter(loan => 
            isWithinInterval(loan.timestamp, {
              start: startOfDay(date),
              end: new Date(date.setHours(23, 59, 59, 999))
            })
          );
          
          return {
            date: format(date, "dd/MM"),
            empréstimos: dailyLoans.length,
            devoluções: dailyLoans.filter(loan => loan.returnRecord).length,
          };
        });
        break;
      
      case 'monthly':
        // Dados dos últimos 30 dias
        filteredData = Array.from({ length: 30 }, (_, i) => {
          const date = subDays(currentDate, 29 - i);
          const dailyLoans = history.filter(loan => 
            isWithinInterval(loan.timestamp, {
              start: startOfDay(date),
              end: new Date(date.setHours(23, 59, 59, 999))
            })
          );
          
          return {
            date: format(date, "dd/MM"),
            empréstimos: dailyLoans.length,
            devoluções: dailyLoans.filter(loan => loan.returnRecord).length,
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

    switch(periodView) {
      case 'daily':
        startDate = startOfDay(today);
        break;
      case 'weekly':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'monthly':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      default:
        startDate = startOfDay(today);
    }

    return history.filter(loan => 
      isWithinInterval(loan.timestamp, { start: startDate, end: endDate })
    );
  };

  const filteredLoans = getFilteredLoans();
  const filteredReturns = filteredLoans.filter(loan => loan.returnRecord);
  
  // Estatísticas
  const completionRate = filteredLoans.length > 0 
    ? (filteredReturns.length / filteredLoans.length) * 100 
    : 0;

  const averageUsageTime = filteredReturns.reduce((acc, loan) => {
    if (loan.returnRecord) {
      const duration = differenceInMinutes(
        loan.returnRecord.returnTime, 
        loan.timestamp
      );
      return acc + duration;
    }
    return acc;
  }, 0) / (filteredReturns.length || 1);

  const loansByUserType = filteredLoans.reduce((acc, loan) => {
    const userType = loan.userType || 'aluno';
    acc[userType] = (acc[userType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userTypeData = Object.entries(loansByUserType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }));

  const completedLoans = filteredLoans.filter(loan => loan.returnRecord);
  const averageLoanDurations = completedLoans.reduce((acc, loan) => {
    if (loan.returnRecord) {
      const durationMinutes = differenceInMinutes(
        loan.returnRecord.returnTime, 
        loan.timestamp
      );
      
      if (!acc[loan.userType || 'aluno']) {
        acc[loan.userType || 'aluno'] = { total: 0, count: 0 };
      }
      
      acc[loan.userType || 'aluno'].total += durationMinutes;
      acc[loan.userType || 'aluno'].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number, count: number }>);

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
    pdf.text(`Relatório de Uso dos Chromebooks - ${periodText[periodView]}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    pdf.setFontSize(16);
    pdf.text(`Estatísticas do ${periodText[periodView]}`, 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    const periodStats = [
      `Empréstimos: ${filteredLoans.length}`,
      `Devoluções: ${filteredReturns.length}`,
      `Chromebooks ativos: ${activeLoans.length} de ${totalChromebooks}`,
      `Tempo médio de uso: ${Math.round(averageUsageTime)} minutos`,
      `Taxa de devolução: ${completionRate.toFixed(0)}%`
    ];

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
      pdf.text(`• ${loan.studentName} - ID: ${loan.chromebookId}`, 25, yPosition);
      pdf.text(`  Retirada: ${format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}`, 25, yPosition + 5);
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
        description: `Relatório ${periodText[periodView]} gerado com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o relatório PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-gray-500">Visualize estatísticas e relatórios de uso dos Chromebooks</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 hover:bg-blue-50 px-3"
          >
            <Download className="h-4 w-4" />
            <span className="whitespace-nowrap">Baixar Relatório</span>
          </Button>
          <Button 
            variant="back"
            size="default"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="whitespace-nowrap">Voltar ao Menu</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full" onValueChange={(v) => setPeriodView(v as 'daily' | 'weekly' | 'monthly')}>
        <TabsList className="grid w-full sm:w-auto grid-cols-3 max-w-md mb-4">
          <TabsTrigger value="daily" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Diário</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-1">
            <CalendarRange className="h-4 w-4" />
            <span>Semanal</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1">
            <ChartLine className="h-4 w-4" />
            <span>Mensal</span>
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="stats-card stats-card-blue dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Empréstimos {periodText[periodView]}
              </CardTitle>
              <Computer className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredLoans.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredReturns.length} devoluções
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card stats-card-green dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chromebooks Ativos
              </CardTitle>
              <Computer className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeLoans.length}</div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={(activeLoans.length / totalChromebooks) * 100} className="h-2" />
                <span className="text-xs text-muted-foreground">
                  {((activeLoans.length / totalChromebooks) * 100).toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card stats-card-blue dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tempo Médio de Uso
              </CardTitle>
              <Clock className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(averageUsageTime)} min
              </div>
              <p className="text-xs text-muted-foreground">
                média {periodView === 'daily' ? 'do dia' : periodView === 'weekly' ? 'da semana' : 'do mês'}
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card stats-card-blue dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Devolução
              </CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
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
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Movimentações na Semana</CardTitle>
                  <CardDescription>
                    Últimos 7 dias
                  </CardDescription>
                </div>
                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
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
                  <CardTitle>Tendência de Uso</CardTitle>
                  <CardDescription>
                    Padrão semanal
                  </CardDescription>
                </div>
                <ChartLine className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="empréstimos" fill="#2563EB" fillOpacity={0.2} stroke="#2563EB" />
                    <Line type="monotone" dataKey="devoluções" stroke="#22C55E" />
                  </ComposedChart>
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
                  <CardTitle>Visão Mensal</CardTitle>
                  <CardDescription>
                    Últimos 30 dias
                  </CardDescription>
                </div>
                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(value, index) => index % 5 === 0 ? value : ''} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="empréstimos" stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.5} />
                    <Area type="monotone" dataKey="devoluções" stackId="2" stroke="#22C55E" fill="#22C55E" fillOpacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Distribuição por Usuários</CardTitle>
                  <CardDescription>
                    Perfil de empréstimos
                  </CardDescription>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#2563EB', '#3B82F6', '#60A5FA'][index % 3]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Empréstimos por Tipo de Usuário</CardTitle>
                  <CardDescription>
                    Distribuição total
                  </CardDescription>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#2563EB', '#3B82F6', '#60A5FA'][index % 3]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card dashboard-card">
              <CardHeader>
                <CardTitle>Estatísticas por Tipo de Usuário</CardTitle>
                <CardDescription>
                  Resumo geral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(loansByUserType).map(([type, count]) => {
                    const userTypeLoans = history.filter(loan => loan.userType === type);
                    const userTypeReturns = userTypeLoans.filter(loan => loan.returnRecord);
                    const returnRate = userTypeLoans.length > 0 
                      ? (userTypeReturns.length / userTypeLoans.length) * 100 
                      : 0;
                    
                    return (
                      <div key={type} className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium capitalize">{type}</h3>
                          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {count} empréstimos
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Taxa de Devolução</p>
                            <p className="font-medium">{returnRate.toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tempo Médio</p>
                            <p className="font-medium">
                              {averageLoanDurations[type] 
                                ? `${Math.round(averageLoanDurations[type].total / averageLoanDurations[type].count)} min` 
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(loansByUserType).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>Nenhum dado de usuário disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
          {activeLoans.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Computer className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>Nenhum empréstimo ativo no momento</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeLoans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 bg-blue-50 border-l-4 border-l-blue-500 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{loan.studentName}</p>
                    <p className="text-sm text-gray-600">ID: {loan.chromebookId}</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Pendente
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Retirada: {format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-4 right-4 sm:hidden">
        <Button
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full h-12 w-12 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
