import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, QrCode, AlertTriangle, ListChecks } from 'lucide-react';
import { usePrintContext } from '@/contexts/PrintContext';
import { useNavigate } from 'react-router-dom';
import { QRCodeSticker } from '@/components/QRCodeSticker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/GlassCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout'; // Importando Layout

export const PrintPreviewPage: React.FC = () => {
  const { printItems, clearPrintItems } = usePrintContext();
  const navigate = useNavigate();
  const [columns, setColumns] = useState<'2' | '3' | '4'>('4'); // Estado para o número de colunas

  useEffect(() => {
    // Redireciona se não houver itens para imprimir
    if (printItems.length === 0) {
      // Navega para a rota raiz se não houver itens
      navigate('/', { replace: true });
    }
  }, [printItems.length, navigate]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleBack = () => {
    clearPrintItems(); // Limpa a seleção ao voltar
    navigate('/inventory'); // Volta para o inventário
  };

  if (printItems.length === 0) {
    return (
      <Layout title="Pré-visualização" subtitle="Carregando..." showBackButton onBack={handleBack}>
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Carregando itens para impressão...</p>
        </div>
      </Layout>
    );
  }
  
  const gridClass = `grid-cols-${columns}`;
  const printGridClass = `print:grid-cols-${columns}`;

  return (
    <Layout 
      title="Pré-visualização de Impressão" 
      subtitle={`Etiquetas para ${printItems.length} Chromebooks`} 
      showBackButton 
      onBack={handleBack} // Usando o handler que limpa o contexto e navega
    >
      {/* O conteúdo principal da página de impressão deve ser renderizado sem o padding padrão do Layout */}
      <div className="p-0 -mt-6 sm:-mt-8"> {/* Remove o padding superior do main do Layout */}
        
        {/* Área de Controle (Não Imprimível) */}
        <GlassCard className="no-print max-w-4xl mx-auto mb-8 p-4 sm:p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <QrCode className="h-6 w-6" />
              Configurações de Impressão
            </CardTitle>
            <CardDescription>
              {printItems.length} Chromebooks selecionados. Ajuste as configurações de impressão do seu navegador (margens, cabeçalhos/rodapés) para melhor resultado.
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
                Imprimir Etiquetas
              </Button>
            </div>
          </CardContent>
        </GlassCard>

        {/* Área de Impressão */}
        <div id="print-area" className="max-w-4xl mx-auto bg-white p-4 sm:p-8"> {/* Adicionando fundo branco e padding para a área de visualização */}
          <div className={cn("grid gap-4 print:gap-2", gridClass, printGridClass)}>
            {printItems.map((item) => (
              <QRCodeSticker key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};