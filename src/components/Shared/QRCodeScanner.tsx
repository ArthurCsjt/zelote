import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (data: string) => void;
}

const QR_SCANNER_ELEMENT_ID = 'qr-code-scanner-mobile';

export const QRCodeScanner = ({ open, onOpenChange, onScanSuccess }: QRCodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const startScanner = () => {
      if (scannerRef.current) {
        return;
      }
      
      const scanner = new Html5Qrcode(QR_SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          toast({ title: "Sucesso", description: "QR Code lido com sucesso" });
          onScanSuccess(decodedText);
          onOpenChange(false);
        },
        (errorMessage) => {
          // Ignora erros de "QR code not found"
        }
      ).catch(err => {
        console.error("Erro ao iniciar o scanner:", err);
        toast({ 
          title: "Erro de Câmera", 
          description: "Não foi possível iniciar a câmera. Verifique as permissões.", 
          variant: "destructive" 
        });
        onOpenChange(false);
      });
    }

    const timerId = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timerId);
      if (scannerRef.current && (scannerRef.current as any).isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch(err => console.error("Erro ao parar o scanner.", err));
      } else if (scannerRef.current) {
        scannerRef.current = null;
      }
    };
  }, [open, onScanSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 w-full max-w-md">
        <DialogHeader className="p-4 border-b bg-white">
          <DialogTitle>Escaneie o QR Code</DialogTitle>
          <DialogDescription>
            Posicione o QR Code na área destacada
          </DialogDescription>
        </DialogHeader>

        <div className="w-full bg-black">
          <div 
            id={QR_SCANNER_ELEMENT_ID} 
            className="w-full aspect-square flex items-center justify-center"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
