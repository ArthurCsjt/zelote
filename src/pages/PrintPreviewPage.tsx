import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, QrCode, AlertTriangle, ListChecks, Loader2 } from 'lucide-react';
import type { Chromebook } from '@/types/database';
import { QRCodeSticker } from '@/components/QRCodeSticker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/GlassCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Este componente não deve usar useNavigate ou usePrintContext, pois está em uma nova aba.

export const PrintPreviewPage: React.FC = () => {
  const [printItems, setPrintItems] = useState<Chromebook[]>([]);
  const [columns, setColumns] = useState<'2' | '3' | '4'>('4');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Recuperação de Dados e Auto-Print
  useEffect(() => {
    try {
      const queue = localStorage.getItem('print_queue');
      const data: Chromebook[] = queue ? JSON.parse(queue) : [];
      setPrintItems(data);
    } catch (e) {
      console.error("Erro ao carregar fila de impressão:", e);
      setPrintItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Auto-Print com Delay
  useEffect(() => {
    if (printItems.length > 0) {
      // Espera 500ms para o QR Code gerar antes de chamar o print
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printItems]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleBack = () => {
    // Limpa o localStorage e fecha a aba
    localStorage.removeItem('print_queue');
    window.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Preparando etiquetas...</p>
      </div>
    );
  }

  // 3. Verificação de Dados (Debug Visual)
  if (printItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <GlassCard className="w-full max-w-md text-center p-8 space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Nenhum Item Selecionado</h1>
          <p className="text-muted-foreground">
            A fila de impressão está vazia. Por favor, volte ao inventário e selecione os itens.
          </p>
          <Button onClick={handleBack} className="w-full bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Fechar Janela
          </Button>
        </GlassCard>
      </div>
    );
  }
  
  const gridClass = columns === '2' 
    ? 'grid-cols-2 sm:grid-cols-2' 
    : columns === '3' 
      ? 'grid-cols-2 sm:grid-cols-3' 
      : 'grid-cols-2 sm:grid-cols-4';
      
  const printGridClass = `print:grid-cols-${columns}`;

  return (
    // Container principal com estilos de fundo limpos
    <div className="bg-white text-black min-h-screen p-8">
      
      {/* Área de Controle (Não Imprimível) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-print">
        
        {/* Cabeçalho de Navegação (no-print) */}
        <div className="flex items-center justify-between mb-6 no-print">
            <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Fechar Janela
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
                Pré-visualização de Impressão ({printItems.length} itens)
            </h1>
            <Button onClick={handlePrint} className="bg-menu-green hover:bg-menu-green-hover">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Etiquetas
            </Button>
        </div>
        
        <GlassCard className="no-print max-w-4xl mx-auto mb-8 p-4 sm:p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <QrCode className="h-6 w-6" />
              Configurações de Impressão
            </CardTitle>
            <CardDescription>
              Ajuste o layout antes de imprimir. A impressão será acionada automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 p-0">
            
            {/* Seletor de Colunas */}
            <div className="flex items-center gap-3">
              <Label htmlFor="columns" className="text-sm font-medium flex items-center gap-1">
                  <ListChecks className="h-4 w-4" /> Layout:
              </Label>
              <Select value={columns} onValueChange={(v) => setColumns(v as '2' | '3' | '4')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Colunas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Colunas</SelectItem>
                  <SelectItem value="3">3 Colunas</SelectItem>
                  <SelectItem value="4">4 Colunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-4 mt-2 sm:mt-0">
              <Button onClick={handlePrint} className="bg-menu-green hover:bg-menu-green-hover">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Agora
              </Button>
            </div>
          </CardContent>
        </GlassCard>

        {/* Área de Impressão (Visualização em Tela) */}
        <div className="max-w-4xl mx-auto bg-white p-2 sm:p-4 border rounded-lg shadow-lg"> 
          <div className={cn("grid gap-2", gridClass)}>
            {printItems.map((item) => (
              <QRCodeSticker key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
      
      {/* ÁREA DE IMPRESSÃO REAL (print-only) */}
      {/* Este div só aparece na impressão e contém apenas os adesivos */}
      <div id="print-area" className={cn("hidden print:block print:w-full print:max-w-none print:p-0 print:m-0 print:bg-white", printGridClass)}>
        <div className={cn("grid gap-2 print:gap-2", printGridClass)}>
          {printItems.map((item) => (
            <QRCodeSticker key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};