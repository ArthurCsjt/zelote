import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Download, TrendingUp, FileText, Printer, AlertCircle, MapPin, Monitor } from 'lucide-react';
import type { AuditReport } from '@/types/database';
import jsPDF from 'jspdf';
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard
import { toast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

interface AuditReportProps {
  report: AuditReport | null;
  auditName: string;
}

export const AuditReportComponent: React.FC<AuditReportProps> = ({ report, auditName }) => {
  if (!report) {
    return (
      <div className="text-center py-8 neo-card">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          Não foi possível carregar os dados detalhados do relatório.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Tente novamente ou verifique se a auditoria foi concluída corretamente.
        </p>
      </div>
    );
  }
  
  const { summary, discrepancies, statistics } = report;

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Título
    doc.setFontSize(20);
    doc.text(`Relatório de Auditoria: ${auditName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Concluída em: ${summary.duration !== '0m' ? summary.duration : 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Resumo
    doc.setFontSize(16);
    doc.text('Resumo da Auditoria', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Itens Contados: ${summary.totalCounted}`, 20, yPos);
    doc.text(`Taxa de Conclusão: ${summary.completionRate}`, 100, yPos);
    yPos += 7;
    doc.text(`Duração: ${summary.duration}`, 20, yPos);
    doc.text(`Eficiência: ${summary.itemsPerHour} itens/hora`, 100, yPos);
    yPos += 15;

    // Estatísticas por método
    if (statistics.byMethod.qr_code > 0 || statistics.byMethod.manual > 0) {
      doc.setFontSize(14);
      doc.text('Estatísticas por Método', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`QR Code: ${statistics.byMethod.qr_code} (${statistics.byMethod.percentage_qr.toFixed(1)}%)`, 20, yPos);
      doc.text(`Manual: ${statistics.byMethod.manual} (${statistics.byMethod.percentage_manual.toFixed(1)}%)`, 100, yPos);
      yPos += 15;
    }

    // Discrepâncias
    const hasDiscrepancies = discrepancies.locationMismatches.length > 0 || discrepancies.conditionIssues.length > 0 || discrepancies.missing.length > 0;
    
    if (hasDiscrepancies) {
      doc.setFontSize(14);
      doc.text('Discrepâncias Encontradas', 20, yPos);
      yPos += 10;

      if (discrepancies.missing.length > 0) {
        doc.setFontSize(12);
        doc.text(`Itens Faltantes (${discrepancies.missing.length}):`, 20, yPos);
        yPos += 7;
        discrepancies.missing.slice(0, 10).forEach(item => {
          doc.setFontSize(10);
          doc.text(`- ${item.chromebook_id} (Local Esperado: ${item.expected_location ?? 'N/D'})` , 25, yPos);
          yPos += 5;
        });
        if (discrepancies.missing.length > 10) {
            doc.setFontSize(10);
            doc.text(`... e mais ${discrepancies.missing.length - 10} itens.`, 25, yPos);
            yPos += 5;
        }
        yPos += 5;
      }

      if (discrepancies.locationMismatches.length > 0) {
        doc.setFontSize(12);
        doc.text(`Localizações Incorretas (${discrepancies.locationMismatches.length}):`, 20, yPos);
        yPos += 7;

        discrepancies.locationMismatches.slice(0, 10).forEach(item => {
          doc.setFontSize(10);
          doc.text(`- ${item.chromebook_id} | Esperado: ${item.expected_location} | Encontrado: ${item.location_found ?? 'N/D'}` , 25, yPos);
          yPos += 5;
        });
        yPos += 5;
      }

      if (discrepancies.conditionIssues.length > 0) {
        doc.setFontSize(12);
        doc.text(`Problemas de Condição (${discrepancies.conditionIssues.length}):`, 20, yPos);
        yPos += 7;

        discrepancies.conditionIssues.slice(0, 10).forEach(item => {
          doc.setFontSize(10);
          doc.text(`- ${item.chromebook_id} | Esperado: ${item.condition_expected} | Encontrado: ${item.condition_found}`, 25, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
    }

    // Salvar PDF
    doc.save(`relatorio-auditoria-${auditName.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Sucesso",
      description: "Relatório PDF gerado!",
    });
  };

  const exportToCSV = () => {
    const headers = ['Localização', 'Contados', 'Esperados', 'Discrepância'];
    
    const csvContent = [
      headers.join(','),
      ...statistics.byLocation.map(location => [
        location.location,
        location.counted,
        location.expected,
        location.discrepancy
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatisticas-localizacao-${auditName.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Sucesso",
      description: "Estatísticas de localização exportadas para CSV.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Resumo - NEO-BRUTALISM */}
      <div className="neo-container">
        <CardHeader className="border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
          <CardTitle className="flex items-center gap-2 text-black dark:text-white font-black uppercase tracking-tight">
            <CheckCircle className="h-5 w-5 text-menu-teal" />
            Resumo da Auditoria
          </CardTitle>
          <CardDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
            {auditName} - Concluída em {summary.duration !== '0m' ? summary.duration : 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{summary.totalCounted}</div>
              <div className="text-sm text-muted-foreground font-mono uppercase">Contados</div>
            </div>
            <div className="text-center p-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-2xl font-black text-green-600 dark:text-green-400">{summary.completionRate}</div>
              <div className="text-sm text-muted-foreground font-mono uppercase">Conclusão</div>
            </div>
            <div className="text-center p-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{summary.duration}</div>
              <div className="text-sm text-muted-foreground font-mono uppercase">Duração</div>
            </div>
            <div className="text-center p-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{summary.itemsPerHour}</div>
              <div className="text-sm text-muted-foreground font-mono uppercase">Itens/Hora</div>
            </div>
          </div>

          <Separator className="my-6 bg-black dark:bg-white h-1" />

          <div className="flex flex-wrap gap-3">
            <Button onClick={exportToPDF} variant="outline" className="neo-btn bg-white hover:bg-gray-100 text-black border-2 border-black h-10">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="neo-btn bg-white hover:bg-gray-100 text-black border-2 border-black h-10">
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV (Localização)
            </Button>
          </div>
        </CardContent>
      </div>

      {/* Discrepâncias - NEO-BRUTALISM */}
      {(discrepancies.missing.length > 0 || discrepancies.locationMismatches.length > 0 || discrepancies.conditionIssues.length > 0) && (
        <div className="neo-container border-4 border-red-600 dark:border-red-500 shadow-[8px_8px_0px_0px_rgba(255,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] bg-red-100 dark:bg-red-900/50">
          <CardHeader className="border-b-4 border-black dark:border-white p-6">
            <CardTitle className="flex items-center gap-2 text-black dark:text-white font-black uppercase tracking-tight">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Discrepâncias ({discrepancies.missing.length + discrepancies.locationMismatches.length + discrepancies.conditionIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {discrepancies.missing.length > 0 && (
              <div>
                <h4 className="font-black uppercase text-sm text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Itens Faltantes ({discrepancies.missing.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {discrepancies.missing.slice(0, 10).map((item, index) => (
                    <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-none flex justify-between items-center">
                      <div className="font-mono font-bold text-sm">{item.chromebook_id}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Esperado: {item.expected_location ?? 'N/D'}
                      </div>
                    </div>
                  ))}
                  {discrepancies.missing.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">... e mais {discrepancies.missing.length - 10} itens faltantes.</p>
                  )}
                </div>
              </div>
            )}
            
            {discrepancies.locationMismatches.length > 0 && (
              <>
                <Separator className="bg-black dark:bg-white h-px" />
                <div>
                  <h4 className="font-black uppercase text-sm text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localizações Incorretas ({discrepancies.locationMismatches.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {discrepancies.locationMismatches.map((item, index) => (
                      <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-none text-sm">
                        <div className="font-mono font-bold">{item.chromebook_id}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">Esperado:</span> {item.expected_location} | <span className="font-bold">Encontrado:</span> {item.location_found ?? 'N/D'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {discrepancies.conditionIssues.length > 0 && (
              <>
                <Separator className="bg-black dark:bg-white h-px" />
                <div>
                  <h4 className="font-black uppercase text-sm text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Problemas de Condição ({discrepancies.conditionIssues.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {discrepancies.conditionIssues.map((item, index) => (
                      <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-none text-sm">
                        <div className="font-mono font-bold">{item.chromebook_id}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">Esperado:</span> {item.condition_expected} | <span className="font-bold">Encontrado:</span> {item.condition_found}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </div>
      )}
      
      {/* Estatísticas por Localização - NEO-BRUTALISM */}
      {statistics.byLocation.length > 0 && (
        <div className="neo-container p-0">
          <CardHeader className="border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
              <MapPin className="h-5 w-5" />
              Estatísticas por Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-zinc-800">
                    <TableHead className="font-black text-black dark:text-white uppercase text-xs">Localização</TableHead>
                    <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Contados</TableHead>
                    <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Esperados</TableHead>
                    <TableHead className="text-right font-black text-black dark:text-white uppercase text-xs">Discrepância</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.byLocation.map((location) => (
                    <TableRow key={location.location} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors border-b border-black/10 dark:border-white/10">
                      <TableCell className="font-medium text-sm">{location.location}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm">{location.counted}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm">{location.expected}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={location.discrepancy === 0 ? 'default' : location.discrepancy > 0 ? 'destructive' : 'secondary'}
                          className={cn(
                            "rounded-none border-2 border-black text-xs font-bold uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                            location.discrepancy === 0 && 'bg-green-200 text-green-900',
                            location.discrepancy > 0 && 'bg-red-200 text-red-900',
                            location.discrepancy < 0 && 'bg-blue-200 text-blue-900'
                          )}
                        >
                          {location.discrepancy > 0 ? '+' : ''}{location.discrepancy}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </div>
      )}

      {/* Estatísticas por Condição - NEO-BRUTALISM */}
      {statistics.byCondition.length > 0 && (
        <div className="neo-container">
          <CardHeader className="border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
              <Monitor className="h-5 w-5" />
              Condições dos Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {statistics.byCondition.map((condition) => (
                <div key={condition.condition} className="text-center p-4 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-2xl font-black text-foreground">{condition.count}</div>
                  <div className="text-sm text-muted-foreground font-mono uppercase">{condition.condition}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold mt-1">{condition.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      )}
    </div>
  );
};