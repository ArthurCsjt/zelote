import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Download, Printer, X } from "lucide-react";
import { toast } from "./ui/use-toast";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chromebookId: string;
  chromebookData?: {
    id: string;
    model: string;
    series: string;
    patrimonyNumber?: string;
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
  
  // Prepare QR Code data
  const getQRCodeData = () => {
    if (chromebookData) {
      const essentialData = {
        id: chromebookData.id,
        model: chromebookData.model,
        series: chromebookData.series,
        ...(chromebookData.patrimonyNumber ? { pat: chromebookData.patrimonyNumber } : {})
      };
      return JSON.stringify(essentialData);
    }
    return chromebookId;
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
        canvas.width = img.width;
        canvas.height = img.height;
        
        // White background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0);
        
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
              }
              .qr-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .qr-id {
                font-size: 14px;
                margin-top: 10px;
                background: #3b82f6;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-title">QR Code para o Chromebook ${chromebookId}</div>
              ${svgData}
              <div class="qr-id">ID: ${chromebookId}</div>
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
        className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
      >
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <QRCodeSVG 
                value="qr" 
                size={16} 
                bgColor="transparent" 
                fgColor="white"
              />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            QR Code Gerado
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            QR Code para o Chromebook {chromebookId}
          </DialogDescription>
        </DialogHeader>

        {/* QR Code Container */}
        <div className="flex flex-col items-center py-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <QRCodeSVG 
              id="qr-code-modal-svg"
              value={getQRCodeData()}
              size={180}
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
          <div className="mt-4">
            <span className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
              ID: {chromebookId}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 pb-2">
          <Button
            onClick={handleDownloadPNG}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PNG
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
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