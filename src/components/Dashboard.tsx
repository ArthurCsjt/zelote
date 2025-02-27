
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, startOfDay, isToday, isWithinInterval, subDays } from "date-fns";
import { Loan } from "./ActiveLoans";
import { Badge } from "./ui/badge";
import { Computer, Download } from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "./ui/use-toast";

interface DashboardProps {
  activeLoans: Loan[];
  history: Loan[];
  onBack: () => void;
}

export function Dashboard({ activeLoans, history, onBack }: DashboardProps) {
  const { toast } = useToast();
  const totalChromebooks = 50;
  const availableChromebooks = totalChromebooks - activeLoans.length;

  const pieData = [
    { name: "Em Uso", value: activeLoans.length },
    { name: "Disponíveis", value: availableChromebooks },
  ];

  const COLORS = ["#F97316", "#22C55E"];

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

  const generatePDFContent = (pdf: jsPDF) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Cabeçalho
    pdf.setFontSize(20);
    pdf.text("Relatório de Uso dos Chromebooks", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    // Seção: Estatísticas do Dia
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

    // Seção: Histórico dos Últimos 7 Dias
    pdf.setFontSize(16);
    pdf.text("Histórico dos Últimos 7 Dias", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    last7Days.forEach(day => {
      pdf.text(`${day.date}: ${day.empréstimos} empréstimos, ${day.devoluções} devoluções`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 13;

    // Seção: Empréstimos Ativos
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Relatório
          </Button>
          <Button variant="outline" onClick={onBack}>
            Voltar ao Menu
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empréstimos Hoje
            </CardTitle>
            <Computer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayLoans.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayReturns.length} devoluções
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chromebooks Ativos
            </CardTitle>
            <Computer className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans.length}</div>
            <p className="text-xs text-muted-foreground">
              de {totalChromebooks} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio de Uso
            </CardTitle>
            <Computer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(averageUsageTime / (1000 * 60))} min
            </div>
            <p className="text-xs text-muted-foreground">
              média do dia
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Chromebooks</CardTitle>
            <CardDescription>
              Total de {totalChromebooks} equipamentos
            </CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>Movimentações por Dia</CardTitle>
            <CardDescription>
              Últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="empréstimos" fill="#F97316" />
                <Bar dataKey="devoluções" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
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
              className="mb-3 p-3 bg-orange-50 border border-orange-100 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{loan.studentName}</p>
                  <p className="text-sm text-gray-600">ID: {loan.chromebookId}</p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  Pendente
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Retirada: {format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
