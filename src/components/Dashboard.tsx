import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes } from "date-fns";
import { Loan } from "./ActiveLoans";
import { Badge } from "./ui/badge";
import { 
  Computer, 
  Download, 
  ArrowLeft, 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Clock, 
  Users, 
  CalendarRange, 
  Activity 
} from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileFriendlyDashboard } from "./MobileFriendlyDashboard";
import { useMobile } from "@/hooks/use-mobile";

interface DashboardProps {
  activeLoans: Loan[];
  history: Loan[];
  onBack: () => void;
}

export function Dashboard({ activeLoans, history, onBack }: DashboardProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return <MobileFriendlyDashboard activeLoans={activeLoans} history={history} onBack={onBack} />;
  }

  const { toast } = useToast();
  const totalChromebooks = 50;
  const availableChromebooks = totalChromebooks - activeLoans.length;

  const pieData = [
    { name: "Em Uso", value: activeLoans.length },
    { name: "Disponíveis", value: availableChromebooks },
  ];

  const COLORS = ["#2563EB", "#22C55E"];

  const today = startOfDay(new Date());
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, i);
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
  }).reverse();

  const todayLoans = history.filter(loan => isToday(loan.timestamp));
  const todayReturns = todayLoans.filter(loan => loan.returnRecord);
  
  const averageUsageTime = todayReturns.reduce((acc, loan) => {
    if (loan.returnRecord) {
      const duration = loan.returnRecord.returnTime.getTime() - loan.timestamp.getTime();
      return acc + duration;
    }
    return acc;
  }, 0) / (todayReturns.length || 1);

  const loansByUserType = history.reduce((acc, loan) => {
    const userType = loan.userType || 'aluno';
    acc[userType] = (acc[userType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userTypeData = Object.entries(loansByUserType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }));

  const completedLoans = history.filter(loan => loan.returnRecord);
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

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, i);
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
  }).reverse();

  const totalLoans = history.length;
  const completedLoansCount = history.filter(loan => loan.returnRecord).length;
  const completionRate = totalLoans > 0 ? (completedLoansCount / totalLoans) * 100 : 0;

  const generatePDFContent = (pdf: jsPDF) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    pdf.setFontSize(20);
    pdf.text("Relatório de Uso dos Chromebooks", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    pdf.setFontSize(16);
    pdf.text("Estatísticas do Dia", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    const dailyStats = [
      `Empréstimos hoje: ${todayLoans.length}`,
      `Devoluções hoje: ${todayReturns.length}`,
      `Chromebooks ativos: ${activeLoans.length} de ${totalChromebooks}`,
      `Tempo médio de uso: ${Math.round(averageUsageTime / (1000 * 60))} minutos`
    ];

    dailyStats.forEach(stat => {
      pdf.text(`• ${stat}`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 13;

    pdf.setFontSize(16);
    pdf.text("Histórico dos Últimos 7 Dias", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    last7Days.forEach(day => {
      pdf.text(`${day.date}: ${day.empréstimos} empréstimos, ${day.devoluções} devoluções`, 25, yPosition);
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
      pdf.save("relatorio-chromebooks.pdf");
      
      toast({
        title: "Sucesso",
        description: "Relatório PDF gerado com sucesso!",
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Dashboard</h2>
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
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-blue-50 px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="whitespace-nowrap">Voltar ao Menu</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="stats-card stats-card-blue dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empréstimos Hoje
            </CardTitle>
            <Computer className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayLoans.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayReturns.length} devoluções
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
            <p className="text-xs text-muted-foreground">
              de {totalChromebooks} total
            </p>
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
              {Math.round(averageUsageTime / (1000 * 60))} min
            </div>
            <p className="text-xs text-muted-foreground">
              média do dia
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
            <p className="text-xs text-muted-foreground">
              {completedLoansCount} de {totalLoans} empréstimos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visaogeral" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="visaogeral">Visão Geral</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visaogeral" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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

            <Card className="glass-card dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Movimentações por Dia</CardTitle>
                  <CardDescription>
                    Últimos 7 dias
                  </CardDescription>
                </div>
                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
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
          </div>

          <Card className="glass-card dashboard-card">
            <CardHeader>
              <CardTitle>Empréstimos Ativos</CardTitle>
              <CardDescription>
                {activeLoans.length} Chromebooks em uso
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="mb-3 p-4 bg-blue-50 border border-blue-100 rounded-lg hover:shadow-md transition-all"
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
              
              {activeLoans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Computer className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum empréstimo ativo no momento</p>
                </div>
              )}
            </CardContent>
          </Card>
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
