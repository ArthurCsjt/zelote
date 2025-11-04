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
import { AlertTriangle, CheckCircle, Download, TrendingUp, FileText, Printer, AlertCircle } from 'lucide-react';
import type { AuditReport } from '@/types/database';
import jsPDF from 'jspdf';
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard
import { toast } from "@/hooks/use-toast";

interface AuditReportProps {
  report: AuditReport | null;
  auditName: string;
}

export const AuditReportComponent: React.FC<AuditReportProps> = ({ report, auditName }) => {
  if (!report) {
    return (
      <div className="text-center py-8">
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
    const headers = ['ID', 'Modelo', 'Localização Esperada', 'Localização Encontrada', 'Condição Esperada', 'Condição Encontrada', 'Método de Scan', 'Horário'];
    
    const allItems = statistics.byLocation.flatMap(locStat => 
      // Esta lógica é falha, pois statistics.byLocation não contém os itens detalhados.
      // Para exportar CSV detalhado, precisaríamos dos 'countedItems' originais.
      // Se o usuário quiser detalhes, ele deve usar a auditoria ativa.
      []
    );
    
    const csvContent = [
      ['Localização', 'Contados', 'Esperados', 'Discrepância'].join(','),
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
      {/* Resumo */}
      <GlassCard className="border-menu-teal/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-menu-teal">
            <CheckCircle className="h-5 w-5" />
            Resumo da Auditoria
          </CardTitle>
          <CardDescription>
            {auditName} - Concluída em {summary.duration !== '0m' ? summary.duration : 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.totalCounted}</div>
              <div className="text-sm text-muted-foreground">Itens Contados</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.completionRate}</div>
              <div className="text-sm text-muted-foreground">Taxa de Conclusão</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{summary.duration}</div>
              <div className="text-sm text-muted-foreground">Duração</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{summary.itemsPerHour}</div>
              <div className="text-sm text-muted-foreground">Itens/Hora</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV (Localização)
            </Button>
          </div>
        </CardContent>
      </GlassCard>

      {/* Discrepâncias */}
      {(discrepancies.missing.length > 0 || discrepancies.locationMismatches.length > 0 || discrepancies.conditionIssues.length > 0) && (
        <GlassCard className="border-red-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Discrepâncias ({discrepancies.missing.length + discrepancies.locationMismatches.length + discrepancies.conditionIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {discrepancies.missing.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">
                  Itens Faltantes ({discrepancies.missing.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {discrepancies.missing.slice(0, 10).map((item, index) => (
                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="font-medium">{item.chromebook_id}</div>
                      <div className="text-sm text-muted-foreground">
                        Local Esperado: {item.expected_location ?? 'N/D'}
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
                <Separator />
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">
                    Localizações Incorretas ({discrepancies.locationMismatches.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {discrepancies.locationMismatches.map((item, index) => (
                      <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-medium">{item.chromebook_id}</div>
                        <div className="text-sm text-muted-foreground">
                          Esperado: {item.expected_location} | Encontrado: {item.location_found ?? 'N/D'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {discrepancies.conditionIssues.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">
                    Problemas de Condição ({discrepancies.conditionIssues.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {discrepancies.conditionIssues.map((item, index) => (
                      <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-medium">{item.chromebook_id}</div>
                        <div className="text-sm text-muted-foreground">
                          Esperado: {item.condition_expected} | Encontrado: {item.condition_found}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </GlassCard>
      )}
      
      {/* Estatísticas por Localização */}
      {statistics.byLocation.length > 0 && (
        <GlassCard>
          <CardHeader>
            <CardTitle>Estatísticas por Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-right">Contados</TableHead>
                  <TableHead className="text-right">Esperados</TableHead>
                  <TableHead className="text-right">Discrepância</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics.byLocation.map((location) => (
                  <TableRow key={location.location}>
                    <TableCell className="font-medium">{location.location}</TableCell>
                    <TableCell className="text-right">{location.counted}</TableCell>
                    <TableCell className="text-right">{location.expected}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={location.discrepancy === 0 ? 'default' : location.discrepancy > 0 ? 'destructive' : 'secondary'}>
                        {location.discrepancy > 0 ? '+' : ''}{location.discrepancy}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </GlassCard>
      )}

      {/* Estatísticas por Condição */}
      {statistics.byCondition.length > 0 && (
        <GlassCard>
          <CardHeader>
            <CardTitle>Condições dos Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {statistics.byCondition.map((condition) => (
                <div key={condition.condition} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold">{condition.count}</div>
                  <div className="text-sm text-muted-foreground">{condition.condition}</div>
                  <div className="text-xs text-gray-600">{condition.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </GlassCard>
      )}
    </div>
  );
};