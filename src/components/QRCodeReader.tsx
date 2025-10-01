import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { toast } from "./ui/use-toast";

interface QRCodeReaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}

const QR_SCANNER_ELEMENT_ID = 'qr-code-reader-container';

export function QRCodeReader({ open, onOpenChange, onScan }: QRCodeReaderProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const scanner = new Html5Qrcode(QR_SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" }, // Pede a câmera traseira por padrão
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        toast({ title: "Sucesso", description: "QR Code lido com sucesso" });
        onScan(decodedText);
        onOpenChange(false);
      },
      (errorMessage) => {
        // Ignora erros de "QR code not found" que acontecem a cada frame
      }
    ).catch(err => {
      console.error("Erro ao iniciar o scanner:", err);
      toast({ title: "Erro de Câmera", description: "Não foi possível iniciar a câmera. Verifique as permissões.", variant: "destructive" });
      onOpenChange(false);
    });

    // Função de limpeza para parar a câmera quando o modal fechar
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .catch(err => console.error("Erro ao parar o scanner.", err));
      }
    };
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escaneie o QR Code</DialogTitle>
          <DialogDescription>
            Posicione o QR Code na área da câmera
          </DialogDescription>
        </DialogHeader>
        
        {/* Container onde a nova biblioteca vai renderizar o vídeo */}
        <div id={QR_SCANNER_ELEMENT_ID} className="w-full rounded-md overflow-hidden" />
      </DialogContent>
    </Dialog>
  );
}