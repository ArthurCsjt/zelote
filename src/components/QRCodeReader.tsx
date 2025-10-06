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

    // A CORREÇÃO ESTÁ AQUI:
    // Nós só tentamos criar o scanner DEPOIS que a div existe.
    // Usamos um setTimeout para dar ao Dialog tempo de renderizar.
    const startScanner = () => {
      if (scannerRef.current) {
        return; // Evita criar múltiplos scanners
      }
      
      const scanner = new Html5Qrcode(QR_SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          toast({ title: "Sucesso", description: "QR Code lido com sucesso" });
          onScan(decodedText);
          onOpenChange(false);
        },
        (errorMessage) => {
          // Ignora erros de "QR code not found"
        }
      ).catch(err => {
        console.error("Erro ao iniciar o scanner:", err);
        toast({ title: "Erro de Câmera", description: "Não foi possível iniciar a câmera. Verifique as permissões.", variant: "destructive" });
        onOpenChange(false);
      });
    }

    // Um pequeno atraso para garantir que o elemento do DOM esteja pronto
    const timerId = setTimeout(startScanner, 100);

    // Função de limpeza
    return () => {
      clearTimeout(timerId); // Limpa o timer
      if (scannerRef.current && (scannerRef.current as any).isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
            console.log("Scanner parado com sucesso.");
          })
          .catch(err => console.error("Erro ao parar o scanner.", err));
      } else if (scannerRef.current) {
        // Se não estiver escaneando, apenas limpe a referência
        scannerRef.current = null;
      }
    };
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[800px] md:max-w-[900px] overflow-auto select-text">
        <div className="min-w-[600px]">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Posicione o QR Code na área da câmera
            </DialogDescription>
          </DialogHeader>

          <div className="w-full overflow-auto">
            <div id={QR_SCANNER_ELEMENT_ID} className="w-full rounded-md overflow-hidden" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}