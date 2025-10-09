// src/components/shared/QRCodeScanner.tsx
// VERSÃO CORRIGIDA USANDO html5-qrcode COM ASPECT RATIO

import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (data: string) => void;
}

const QR_SCANNER_ELEMENT_ID = 'qr-code-reader-container';

export const QRCodeScanner = ({ open, onOpenChange, onScanSuccess }: QRCodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    // Garante que o scanner só seja criado uma vez
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(QR_SCANNER_ELEMENT_ID, false);
    }
    const scanner = scannerRef.current;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0, // A CORREÇÃO PRINCIPAL!
    };

    const handleSuccess = (decodedText: string) => {
      // Garante que o scanner ainda está ativo para evitar múltiplas chamadas
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        toast({ title: "Sucesso!", description: "QR Code lido." });
        onScanSuccess(decodedText);
        onOpenChange(false); // Fecha o modal após o sucesso
      }
    };

    const handleError = (errorMessage: string) => {
      // Ignora o erro comum de "QR code not found"
    };

    scanner.start(
      { facingMode: "environment" }, // Usa a câmera traseira
      config,
      handleSuccess,
      handleError
    ).catch(err => {
      console.error("Falha ao iniciar a câmera com html5-qrcode:", err);
      toast({
        title: "Erro de Câmera",
        description: "Não foi possível iniciar a câmera. Verifique as permissões do navegador.",
        variant: "destructive"
      });
      onOpenChange(false);
    });

    // Função de limpeza para parar a câmera quando o componente for desmontado ou o modal for fechado
    return () => {
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.stop().catch(err => {
          console.error("Falha ao parar o scanner.", err);
        });
      }
    };
  }, [open, onScanSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 w-full max-w-md">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Escaneie o QR Code</DialogTitle>
          <DialogDescription>
            Posicione o código na área destacada.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full bg-black">
          {/* O contêiner onde a biblioteca vai renderizar a câmera */}
          <div id={QR_SCANNER_ELEMENT_ID} className="w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
};