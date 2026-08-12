import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, QrCode, AlertTriangle, ListChecks, Loader2, X, Download } from 'lucide-react';
import type { Chromebook } from '@/types/database';
import { QRCodeSticker } from '@/components/QRCodeSticker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/GlassCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';
import JSZip from 'jszip';

// Este componente não deve usar useNavigate ou usePrintContext, pois está em uma nova aba.

export const PrintPreviewPage: React.FC = () => {
  const [printItems, setPrintItems] = useState<Chromebook[]>([]);
  // Alterando o tipo de estado para 2 ou 4, conforme solicitado
  const [columns, setColumns] = useState<2 | 4>(4);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Recuperação de Dados (Sem Auto-Print)
  useEffect(() => {
    try {
      const queue = localStorage.getItem('print_queue');
      const data: Chromebook[] = queue ? JSON.parse(queue) : [];
      setPrintItems(data);
    } catch (e) {
      logger.error('Erro ao carregar fila de impressão', e);
      setPrintItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNGs = async () => {
    if (printItems.length === 0 || isDownloading) return;
    setIsDownloading(true);

    try {
      const zip = new JSZip();

      for (const item of printItems) {
        // Encontra o elemento do adesivo correspondente
        const container = document.querySelector(`[data-sticker-id="${item.chromebook_id}"]`);
        if (!container) continue;

        const svgElement = container.querySelector('svg');
        if (!svgElement) continue;

        // Cria um canvas em alta resolução (aspecto 4:3, ex: 1600x1200)
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        // 1. Fundo Branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Renderizar QR Code SVG (escalado)
        await new Promise<void>((resolve, reject) => {
          try {
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = () => {
              // Posiciona e escala o QR Code (850x850px, centralizado verticalmente na esquerda com margem de 80px)
              ctx.drawImage(img, 80, 175, 850, 850);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = (e) => {
              URL.revokeObjectURL(url);
              reject(e);
            };
            img.src = url;
          } catch (err) {
            reject(err);
          }
        });

        // 3. Renderizar Textos no lado direito
        // Centralizado no espaço restante: X = 1265
        const centerX = 1265;

        // Título (ID do Chromebook)
        ctx.fillStyle = '#111827'; // gray-900
        ctx.font = '900 140px Inter, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const hasSerial = !!item.serial_number;
        const titleY = hasSerial ? 545 : 600;
        ctx.fillText(item.chromebook_id, centerX, titleY);

        // Número de Série (menor e mais claro)
        if (hasSerial && item.serial_number) {
          ctx.fillStyle = '#6B7280'; // gray-500

          let serialFontSize = 70;
          ctx.font = `bold ${serialFontSize}px Inter, system-ui, -apple-system, sans-serif`;

          // Ajusta a escala da fonte caso o texto seja muito longo
          const maxTextWidth = 480; // Margem segura
          const serialText = item.serial_number;
          let textWidth = ctx.measureText(serialText).width;

          if (textWidth > maxTextWidth) {
            serialFontSize = Math.floor(serialFontSize * (maxTextWidth / textWidth));
            ctx.font = `bold ${serialFontSize}px Inter, system-ui, -apple-system, sans-serif`;
          }

          ctx.fillText(serialText, centerX, 690);
        }

        // Converte o canvas para Blob PNG
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });

        if (blob) {
          zip.file(`qrcode_${item.chromebook_id}.png`, blob);
        }
      }

      // Gera o arquivo ZIP e faz o download
      const content = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(content);

      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `qrcodes_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);

    } catch (error) {
      logger.error('Erro ao gerar PNGs de alta resolução', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
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

  // 2. Verificação de Dados (Debug Visual)
  if (printItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <GlassCard className="w-full max-w-md text-center p-8 space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Nenhum Item Selecionado</h1>
          <p className="text-muted-foreground">
            A fila de impressão está vazia. Por favor, volte ao inventário e selecione os itens.
          </p>
          <Button onClick={handleClose} className="w-full bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Fechar Janela
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Classes dinâmicas para o grid
  const gridClass = columns === 2
    ? 'grid-cols-2'
    : 'grid-cols-4';

  const printGridClass = columns === 2 ? 'print:grid-cols-2' : 'print:grid-cols-4';

  return (
    // Container principal com estilos de fundo limpos
    <div className="min-h-screen bg-gray-50 text-black p-8 print:p-0 print:bg-white">

      {/* --- CONTROLES (Não aparecem na impressão) --- */}
      <div className="max-w-5xl mx-auto mb-8 bg-gray-900 text-white p-6 rounded-xl shadow-lg print:hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Printer size={24} /> Configuração de Impressão
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {printItems.length} itens selecionados. Ajuste as colunas antes de imprimir.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Seletor de Colunas */}
          <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setColumns(2)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${columns === 2 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              2 Colunas
            </button>
            <button
              onClick={() => setColumns(4)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${columns === 4 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              4 Colunas
            </button>
          </div>

          <button
            onClick={handleDownloadPNGs}
            disabled={isDownloading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-75"
          >
            {isDownloading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Gerando ZIP...
              </>
            ) : (
              <>
                <Download size={18} /> Baixar PNGs
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Printer size={18} /> Imprimir Agora
          </button>

          <button
            onClick={handleClose} // Fecha a aba
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors"
            title="Fechar Janela"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* --- ÁREA DE IMPRESSÃO --- */}
      {/* Usando max-w-none para garantir que o container ocupe a largura total do papel na impressão */}
      <div id="print-area" className="max-w-5xl mx-auto bg-white p-4 shadow-sm print:shadow-none print:m-0 print:w-full">
        {/* O segredo está aqui: classes dinâmicas que funcionam no print */}
        <div
          className={cn(
            "grid gap-4",
            gridClass,
            // Aplicando as classes de impressão diretamente no container
            "print:grid print:gap-2",
            printGridClass
          )}
        >
          {printItems.map((item) => (
            <QRCodeSticker key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* CSS Global para forçar o layout de impressão */}
      <style>{`
        @media print {
          @page { margin: 0.5cm; size: auto; }
          body { -webkit-print-color-adjust: exact; }
          
          /* Força o reset do layout principal do SPA */
          body, html, #root {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
          
          /* Garante que o conteúdo da área de impressão seja visível */
          #print-area, #print-area * {
            visibility: visible;
          }
          
          /* Remove margens e padding do corpo na impressão */
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};