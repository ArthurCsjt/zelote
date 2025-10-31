import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, QrCode, AlertTriangle } from 'lucide-react';
import { usePrintContext } from '@/contexts/PrintContext';
import { useNavigate } from 'react-router-dom';
import { QRCodeSticker } from '@/components/QRCodeSticker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/GlassCard';

export const PrintPreviewPage: React.FC = () => {
  const { printItems } = usePrintContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona se não houver itens para imprimir
    if (printItems.length === 0) {
      navigate('/inventory', { replace: true });
    }
  }, [printItems.length, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (printItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando itens para impressão...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      
      {/* Área de Controle (Não Imprimível) */}
      <GlassCard className="no-print max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <QrCode className="h-6 w-6" />
            Pré-visualização de Impressão em Lote
          </CardTitle>
          <CardDescription>
            {printItems.length} Chromebooks selecionados. Ajuste as configurações de impressão do seu navegador (margens, cabeçalhos/rodapés) para melhor resultado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={() => navigate('/inventory')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Inventário
          </Button>
          <Button onClick={handlePrint} className="bg-menu-green hover:bg-menu-green-hover">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Etiquetas
          </Button>
        </CardContent>
      </GlassCard>

      {/* Área de Impressão */}
      <div id="print-area" className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:gap-2">
          {printItems.map((item) => (
            <QRCodeSticker key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};