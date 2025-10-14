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
import { AlertTriangle, CheckCircle, Download, TrendingUp, FileText, Printer } from 'lucide-react';
import type { AuditReport } from '@/types/database';
import jsPDF from 'jspdf';

interface AuditReportProps {
  report: AuditReport;
  onExport?: () => void;
}

export const AuditReportComponent: React.FC<AuditReportProps> = ({ report, onExport }) => {
  const { summary, discrepancies, statistics } = report;

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Auditoria de Inventário', 20, 30);

    // Resumo
    doc.setFontSize(16);
    doc.text('Resumo da Auditoria', 20, 50);

    doc.setFontSize(12);
    doc.text(`Itens Contados: ${summary.totalCounted}`, 20, 65);
    doc.text(`Taxa de Conclusão: ${summary.completionRate}`, 20, 75);
    doc.text(`Duração: ${summary.duration}`, 20, 85);
    doc.text(`Eficiência: ${summary.itemsPerHour} itens/hora`, 20, 95);

    // Estatísticas por método
    doc.setFontSize(14);
    doc.text('Estatísticas por Método', 20, 115);

    doc.setFontSize(10);
    doc.text(`QR Code: ${statistics.byMethod.qr_code} (${statistics.byMethod.percentage_qr.toFixed(1)}%)`, 20, 125);
    doc.text(`Manual: ${statistics.byMethod.manual} (${statistics.byMethod.percentage_manual.toFixed(1)}%)`, 20, 135);

    // Discrepâncias
    if (discrepancies.locationMismatches.length > 0 || discrepancies.conditionIssues.length > 0) {
      doc.setFontSize(14);
      doc.text('Discrepâncias Encontradas', 20, 155);

      let yPos = 165;
      if (discrepancies.locationMismatches.length > 0) {
        doc.setFontSize(12);
        doc.text(`Localizações Incorretas (${discrepancies.locationMismatches.length}):`, 20, yPos);
        yPos += 10;

        discrepancies.locationMismatches.forEach(item => {
          doc.setFontSize(10);
          doc.text(`${item.chromebook_id} - Esperado: ${item.expected_location} | Encontrado: ${item.location_found ?? 'N/D'}` , 25, yPos);
          yPos += 8;
        });
      }

      if (discrepancies.conditionIssues.length > 0) {
        yPos += 5;
        doc.setFontSize(12);
        doc.text(`Problemas de Condição (${discrepancies.conditionIssues.length}):`, 20, yPos);
        yPos += 10;

        discrepancies.conditionIssues.forEach(item => {
          doc.setFontSize(10);
          doc.text(`${item.chromebook_id} - Esperado: ${item.condition_expected} | Encontrado: ${item.condition_found}`, 25, yPos);
          yPos += 8;
        });
      }
    }

    // Salvar PDF
    doc.save(`relatorio-auditoria-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Modelo', 'Localização', 'Status', 'Método', 'Horário'];
    const csvContent = [
      headers.join(','),
      ...statistics.byLocation.map(location => [
        location.location,
        location.counted,
        location.expected,
        location.discrepancy
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatisticas-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Relatório de Auditoria
          </CardTitle>
          <CardDescription>
            Resumo completo da auditoria realizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.totalCounted}</div>
              <div className="text-sm text-muted-foreground">Itens Contados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.completionRate}</div>
              <div className="text-sm text-muted-foreground">Taxa de Conclusão</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.duration}</div>
              <div className="text-sm text-muted-foreground">Duração</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.itemsPerHour}</div>
              <div className="text-sm text-muted-foreground">Itens/Hora</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{summary.averageTimePerItem}</div>
              <div className="text-sm text-muted-foreground">Tempo Médio/Item</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex gap-2">
            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            {onExport && (
              <Button onClick={onExport}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Método */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estatísticas por Método
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{statistics.byMethod.qr_code}</div>
              <div className="text-sm text-blue-800">QR Code</div>
              <div className="text-xs text-blue-600">{statistics.byMethod.percentage_qr.toFixed(1)}%</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statistics.byMethod.manual}</div>
              <div className="text-sm text-green-800">Manual</div>
              <div className="text-xs text-green-600">{statistics.byMethod.percentage_manual.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Localização */}
      {statistics.byLocation.length > 0 && (
        <Card>
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
        </Card>
      )}

      {/* Discrepâncias */}
      {(discrepancies.locationMismatches.length > 0 || discrepancies.conditionIssues.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Discrepâncias Encontradas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {discrepancies.locationMismatches.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">
                  Localizações Incorretas ({discrepancies.locationMismatches.length})
                </h4>
                <div className="space-y-2">
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
            )}

            {discrepancies.conditionIssues.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">
                    Problemas de Condição ({discrepancies.conditionIssues.length})
                  </h4>
                  <div className="space-y-2">
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
        </Card>
      )}

      {/* Estatísticas por Condição */}
      {statistics.byCondition.length > 0 && (
        <Card>
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
        </Card>
      )}
    </div>
  );
};
