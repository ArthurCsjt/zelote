import jsPDF from "jspdf";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import type { LoanHistoryItem, DashboardStats } from "@/types/database";

interface ExportData {
  history: LoanHistoryItem[];
  stats: DashboardStats | null;
  startDate: Date | null;
  endDate: Date | null;
  startHour: number;
  endHour: number;
}

export function useDashboardExport() {

  const generatePDFContent = (pdf: jsPDF, data: ExportData) => {
    const { history, stats, startDate, endDate, startHour, endHour } = data;
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;
    
    const periodText = startDate && endDate 
        ? `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')} (${startHour}h às ${endHour}h)`
        : 'Histórico Completo';

    // Título
    pdf.setFontSize(20);
    pdf.text(`Relatório de Uso dos Chromebooks`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.text(`Período: ${periodText}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    // Estatísticas do Período
    pdf.setFontSize(16);
    pdf.text(`Estatísticas Chave`, 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    
    const periodStats = [
      `Total de Equipamentos: ${stats?.totalChromebooks || 0}`,
      `Disponíveis: ${stats?.availableChromebooks || 0}`,
      `Empréstimos no Período: ${data.history.length || 0}`, 
      `Taxa de Ocupação Máxima: ${stats?.maxOccupancyRate.toFixed(0) || 0}%`,
      `Tempo médio de uso: ${Math.round(stats?.averageUsageTime || 0)} minutos`, 
      `Taxa de devolução: ${stats?.completionRate.toFixed(0) || 0}%`
    ];
    
    periodStats.forEach(stat => {
      pdf.text(`• ${stat}`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 13;

    // Empréstimos Ativos
    const activeLoans = history.filter(loan => !loan.return_date);
    pdf.setFontSize(16);
    pdf.text(`Empréstimos Ativos (${activeLoans.length})`, 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    
    activeLoans.forEach(loan => {
      if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.text(`Empréstimos Ativos (Continuação)`, 20, yPosition);
        yPosition += 10;
        pdf.setFontSize(10);
      }
      
      const loanDate = format(new Date(loan.loan_date), "dd/MM/yyyy HH:mm");
      const expectedReturn = loan.expected_return_date ? format(new Date(loan.expected_return_date), "dd/MM/yyyy HH:mm") : 'Sem Prazo';
      const status = loan.status === 'atrasado' ? ' (ATRASADO)' : '';
      
      pdf.text(`• ID: ${loan.chromebook_id} | Solicitante: ${loan.student_name} (${loan.user_type})`, 25, yPosition);
      pdf.text(`  Finalidade: ${loan.purpose}`, 25, yPosition + 4);
      pdf.text(`  Retirada: ${loanDate} | Prazo: ${expectedReturn}${status}`, 25, yPosition + 8);
      yPosition += 15;
    });
    
    return pdf;
  };

  const handleDownloadPDF = (data: ExportData) => {
    try {
      const pdf = new jsPDF();
      generatePDFContent(pdf, data);
      
      const dateStr = data.startDate && data.endDate 
        ? `${format(data.startDate, 'yyyyMMdd')}-${format(data.endDate, 'yyyyMMdd')}`
        : format(new Date(), 'yyyyMMdd');
        
      pdf.save(`relatorio-dashboard-${dateStr}.pdf`);
      
      toast({
        title: "Sucesso",
        description: `Relatório PDF gerado com sucesso!`
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

  return {
    handleDownloadPDF,
  };
}