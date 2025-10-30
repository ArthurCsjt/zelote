import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Download, Printer, X, QrCode } from "lucide-react";
import { toast } from "./ui/use-toast";
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

      const svgData = new XMLSerializer().serializeToString(element);
      const img = new Image();
      
      img.onload = () => {
        const padding = 20; // 0.5cm aproximadamente
        canvas.width = img.width + (padding * 2);
        canvas.height = img.height + 60 + (padding * 2);
        
        // White background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw dashed border for cutting guide
        ctx.strokeStyle = "#666666";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Draw QR code with padding
        ctx.drawImage(img, padding, padding);
        
        // Add ID text below QR code with closer spacing
        ctx.fillStyle = "#000000";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`ID: ${chromebookId}`, canvas.width / 2, img.height + padding + 25);
        
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

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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
        className="max-w-sm mx-auto bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
      >
        <DialogHeader className="text-center">
          {/* NOVO: Ícone de QR Code mais discreto e alinhado */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            QR Code Gerado
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            QR Code para o Chromebook {resolved?.chromebook_id ?? chromebookData?.chromebook_id ?? chromebookId}
          </DialogDescription>
        </DialogHeader>

        {/* QR Code Container */}
        <div className="flex flex-col items-center py-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
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
                borderRadius: '8px',
              }}
            />
          </div>
          
          {/* ID Badge */}
          <div className="mt-3">
            <span className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-xs font-medium">
              ID: {resolved?.chromebook_id ?? chromebookData?.chromebook_id ?? chromebookId}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 pb-2">
          <Button
            onClick={handleDownloadPNG}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" // Usando azul mais escuro
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PNG
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 bg-menu-green hover:bg-menu-green-hover text-white" // Usando verde do menu
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-center text-sm text-gray-500 px-6 pb-4">
          Cole este QR Code no equipamento
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg mx-6 mb-4">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Chromebook cadastrado com sucesso!</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </DialogContent>
    </Dialog>
  );
}