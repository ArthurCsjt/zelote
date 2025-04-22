import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Badge } from "./ui/badge";
import { Computer, Download, ArrowLeft, Clock, Activity } from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isToday } from "date-fns";
import { Loan } from "./ActiveLoans";

interface MobileFriendlyDashboardProps {
  activeLoans: Loan[];
  history: Loan[];
  onBack: () => void;
}

export function MobileFriendlyDashboard({ activeLoans, history, onBack }: MobileFriendlyDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('visaogeral');
  const totalChromebooks = 50;
  const availableChromebooks = totalChromebooks - activeLoans.length;

  // Add useEffect for debugging
  useEffect(() => {
    console.log('MobileFriendlyDashboard mounted', {
      activeLoans: activeLoans.length,
      history: history.length,
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    // Force update of UI
    const timeout = setTimeout(() => {
      console.log('Forcing UI update');
      setActiveTab(prev => prev === 'visaogeral' ? 'visaogeral' : 'visaogeral');
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [activeLoans.length, history.length]);

  // Simplified data processing for mobile
  const pieData = [
    { name: "Em Uso", value: activeLoans.length },
    { name: "Disponíveis", value: availableChromebooks },
  ];

  const COLORS = ["#2563EB", "#22C55E"];
  
  // Simplified bar chart data
  const barData = [
    { name: "Hoje", emprestimos: history.filter(loan => isToday(loan.timestamp)).length, devolucoes: history.filter(loan => loan.returnRecord && isToday(loan.returnRecord.returnTime)).length },
    { name: "Total", emprestimos: history.length, devolucoes: history.filter(loan => loan.returnRecord).length }
  ];

  const todayLoans = history.filter(loan => isToday(loan.timestamp));
  const todayReturns = todayLoans.filter(loan => loan.returnRecord);
  
  // Simplified average calculation
  const averageUsageTime = todayReturns.length > 0 ? 
    todayReturns.reduce((acc, loan) => {
      if (loan.returnRecord) {
        return acc + (loan.returnRecord.returnTime.getTime() - loan.timestamp.getTime());
      }
      return acc;
    }, 0) / todayReturns.length / (1000 * 60) : 0;
  
  const completedLoansCount = history.filter(loan => loan.returnRecord).length;
  const completionRate = history.length > 0 ? (completedLoansCount / history.length) * 100 : 0;

  const generatePDFContent = (pdf: jsPDF) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    pdf.setFontSize(18);
    pdf.text("Relatório de Chromebooks", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy")}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    pdf.setFontSize(14);
    pdf.text("Resumo", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    const stats = [
      `Total de Chromebooks: ${totalChromebooks}`,
      `Em uso: ${activeLoans.length}`,
      `Disponíveis: ${availableChromebooks}`,
      `Empréstimos hoje: ${todayLoans.length}`,
      `Devoluções hoje: ${todayReturns.length}`
    ];

    stats.forEach(stat => {
      pdf.text(`• ${stat}`, 25, yPosition);
      yPosition += 7;
    });

    return pdf;
  };

  const handleDownloadPDF = () => {
    try {
      const pdf = new jsPDF();
      generatePDFContent(pdf);
      pdf.save("relatorio-simplificado.pdf");
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o relatório",
        variant: "destructive",
      });
    }
  };

  console.log('Rendering MobileFriendlyDashboard content');

  // Simplified Mobile UI
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Dashboard</h2>
        <div className="flex gap-2 w-full sm:w-auto justify-start">
          <Button 
            variant="outline" 
            onClick={onBack}
            size="sm"
            className="flex items-center gap-1 hover:bg-blue-50 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">
              Empréstimos Hoje
            </CardTitle>
            <Computer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-xl font-bold">{todayLoans.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayReturns.length} devoluções
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">
              Chromebooks
            </CardTitle>
            <Computer className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-xl font-bold">{activeLoans.length}</div>
            <p className="text-xs text-muted-foreground">
              em uso de {totalChromebooks}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Empréstimos Ativos</CardTitle>
          <CardDescription className="text-xs">
            {activeLoans.length} Chromebooks em uso
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-y-auto py-2">
          {activeLoans.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Computer className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum empréstimo ativo</p>
            </div>
          )}
          
          {activeLoans.map((loan) => (
            <div
              key={loan.id}
              className="mb-2 p-3 bg-blue-50 border border-blue-100 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{loan.studentName}</p>
                  <p className="text-xs text-gray-600">ID: {loan.chromebookId}</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  Pendente
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Retirada: {format(loan.timestamp, "dd/MM HH:mm")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
