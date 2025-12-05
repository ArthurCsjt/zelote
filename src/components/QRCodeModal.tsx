import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Download, Printer, X, QrCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chromebookId: string;
  chromebookData?: {
    id: string;
    chromebook_id: string;
    model: string;
    serial_number?: string;
    patrimony_number?: string;
  };
  showSuccess?: boolean;
}

export function QRCodeModal({
  open,
  onOpenChange,
  chromebookId,
  chromebookData,
  showSuccess = false
}: QRCodeModalProps) {
  const [resolved, setResolved] = useState<{ chromebook_id?: string; model?: string; serial_number?: string; patrimony_number?: string } | null>(null);
  const [resolving, setResolving] = useState(false);

  // When only a UUID is provided (DB id), try to fetch the full chromebook to prefer chromebook_id
  useEffect(() => {
    let mounted = true;
    const isUUID = (s: string) => /^[0-9a-fA-F-]{36}$/.test(s);
    const resolve = async () => {
      if (chromebookData) {
        setResolved({
          chromebook_id: chromebookData.chromebook_id,
          model: chromebookData.model,
          serial_number: chromebookData.serial_number,
          patrimony_number: chromebookData.patrimony_number,
        });
        return;
      }

      if (!chromebookId) {
        setResolved(null);
        return;
      }

      // If chromebookId looks like a UUID, fetch the record and prefer its friendly id
      if (isUUID(chromebookId)) {
        setResolving(true);
        try {
          const { data, error } = await supabase
            .from('chromebooks')
            .select('chromebook_id, model, serial_number, patrimony_number')
            .eq('id', chromebookId)
            .single();
          if (!mounted) return;
          if (error) {
            // keep fallback to raw string
            setResolved(null);
          } else if (data) {
            setResolved({
              chromebook_id: data.chromebook_id,
              model: data.model,
              serial_number: data.serial_number,
              patrimony_number: data.patrimony_number,
            });
          }
        } catch (e) {
          console.error('Erro ao buscar chromebook para QR code', e);
          setResolved(null);
        } finally {
          if (mounted) setResolving(false);
        }
      } else {
        // Provided string is likely already the friendly id
        setResolved({ chromebook_id: chromebookId });
      }
    };

    resolve();
    return () => { mounted = false; };
  }, [chromebookId, chromebookData]);

  // Prepare QR Code data
  const getQRCodeData = () => {
    const source = resolved ?? (chromebookData ? {
      chromebook_id: chromebookData.chromebook_id,
      model: chromebookData.model,
      serial_number: chromebookData.serial_number,
      patrimony_number: chromebookData.patrimony_number,
    } : null);

    if (source && source.chromebook_id) {
      const essentialData = {
        id: source.chromebook_id,
        model: source.model,
        ...(source.serial_number ? { serial: source.serial_number } : {}),
        ...(source.patrimony_number ? { pat: source.patrimony_number } : {})
      };
      return JSON.stringify(essentialData);
    }

    return chromebookId || '';
  };

  // Handle PNG download
  const handleDownloadPNG = () => {
    const element = document.getElementById("qr-code-modal-svg");
    if (!element) return;

    if (!(element instanceof SVGElement)) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();

      // 1. Cria um SVG temporário para garantir que o tamanho seja 140x140 para o canvas
      const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tempSvg.setAttribute('width', '140');
      tempSvg.setAttribute('height', '140');
      tempSvg.innerHTML = element.innerHTML;

      const svgDataString = new XMLSerializer().serializeToString(tempSvg); // Declaração única

      img.onload = () => {
        const padding = 20; // 0.5cm aproximadamente
        const qrSize = 140; // Tamanho do QR Code SVG
        const textHeight = 60; // Espaço para o texto

        canvas.width = qrSize + (padding * 2);
        canvas.height = qrSize + textHeight + (padding * 2);

        // White background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw dashed border for cutting guide
        ctx.strokeStyle = "#666666";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Draw QR code with padding
        ctx.drawImage(img, padding, padding, qrSize, qrSize);

        // Add ID text below QR code with closer spacing
        ctx.fillStyle = "#000000";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`ID: ${chromebookId}`, canvas.width / 2, qrSize + padding + 25);

        // Download PNG
        const link = document.createElement('a');
        link.download = `qrcode-chromebook-${chromebookId}.png`;
        link.href = canvas.toDataURL();
        link.click();

        toast({
          title: "Sucesso",
          description: "QR Code baixado como PNG!",
        });
      };

      // 2. Define a fonte da imagem (DEVE SER FEITO APÓS O ONLOAD)
      img.src = 'data:image/svg+xml;base64,' + btoa(svgDataString);

    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o PNG",
        variant: "destructive",
      });
    }
  };

  // Handle print
  const handlePrint = () => {
    const element = document.getElementById("qr-code-modal-svg");
    if (!element) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const svgData = element.outerHTML;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${chromebookId}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                font-family: Arial, sans-serif;
              }
              .qr-container {
                text-align: center;
                padding: 7px;
                border: 2px dashed #666;
                margin: 7px;
                position: relative;
              }
              .qr-id {
                font-size: 14px;
                margin-top: 2px;
                color: black;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div style="display: flex; flex-direction: column; align-items: center;">
                ${svgData}
                <div class="qr-id">ID: ${chromebookId}</div>
              </div>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.print();

      toast({
        title: "Sucesso",
        description: "QR Code enviado para impressão!",
      });
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast({
        title: "Erro",
        description: "Erro ao imprimir",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm mx-auto bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] rounded-none sm:rounded-none p-0 overflow-hidden"
      >
        <DialogHeader className="text-center bg-yellow-300 dark:bg-yellow-900/50 p-6 border-b-4 border-black dark:border-white">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 border-2 border-black dark:border-white bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <QrCode className="h-8 w-8 text-black dark:text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-black uppercase text-black dark:text-white tracking-tight">
            QR Code Gerado
          </DialogTitle>
          <DialogDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
            QR CODE PARA O CHROMEBOOK <br />
            <span className="bg-white dark:bg-black px-1 border border-black dark:border-white text-black dark:text-white mt-1 inline-block">
              {resolved?.chromebook_id ?? chromebookData?.chromebook_id ?? chromebookId}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* QR Code Container */}
        <div className="flex flex-col items-center py-6 bg-white dark:bg-zinc-900 border-b-4 border-black dark:border-white">
          <div className="bg-white p-4 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
            <QRCodeSVG
              id="qr-code-modal-svg"
              value={getQRCodeData()}
              size={140}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#000000"
              style={{
                display: 'block',
                borderRadius: '0px',
              }}
            />
          </div>

          {/* ID Badge */}
          <div className="mt-4">
            <span className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-transparent">
              ID: {resolved?.chromebook_id ?? chromebookData?.chromebook_id ?? chromebookId}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-zinc-950">
          <Button
            onClick={handleDownloadPNG}
            className="flex-1 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase text-xs"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PNG
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-green-500 hover:bg-green-600 text-white font-bold uppercase text-xs"
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-center text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 px-6 pb-2 pt-0 bg-gray-50 dark:bg-zinc-950">
          Cole este QR Code no equipamento
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="flex items-center justify-center gap-2 text-green-800 bg-green-100 border-2 border-green-800 p-2 mx-6 mb-4 font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle className="h-4 w-4" />
            <span>Chromebook cadastrado!</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-2 p-1 hover:bg-black/10 transition-colors border-2 border-transparent hover:border-black"
        >
          <X className="h-5 w-5 text-black dark:text-white" />
        </button>
      </DialogContent>
    </Dialog>
  );
}