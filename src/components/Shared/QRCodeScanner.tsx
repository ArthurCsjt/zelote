// src/components/shared/QRCodeScanner.tsx
// VERSÃO FINAL "FORÇA BRUTA" COM CSS EMBUTIDO

import { useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (data: string) => void;
}

const QR_SCANNER_ELEMENT_ID = 'qr-reader-force';

export const QRCodeScanner = ({ open, onOpenChange, onScanSuccess }: QRCodeScannerProps) => {

  useEffect(() => {
    if (!open) return;

    const scanner = new Html5Qrcode(QR_SCANNER_ELEMENT_ID, false);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const handleSuccess = (decodedText: string) => {
      onScanSuccess(decodedText);
      onOpenChange(false);
    };

    scanner.start(
      { facingMode: "environment" },
      config,
      handleSuccess,
      () => {} // Ignore errors
    ).catch(err => {
      toast({
        title: "Erro de Câmera",
        description: "Não foi possível iniciar a câmera. Verifique as permissões.",
        variant: "destructive"
      });
      onOpenChange(false);
    });

    // Função de limpeza
    return () => {
      // Verifica se o scanner está realmente ativo antes de tentar parar
      scanner.getState() === Html5QrcodeScannerState.SCANNING &&
        scanner.stop().catch(err => {
          console.error("Falha ao parar o scanner.", err);
        });
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

        {/* CSS INJETADO DIRETAMENTE PARA MÁXIMA PRIORIDADE */}
        <style>{`
          #${QR_SCANNER_ELEMENT_ID} {
            width: 100%;
            border: none !important;
            padding: 0 !important;
            background-color: black;
          }
          #${QR_SCANNER_ELEMENT_ID}_anchor_scan_region {
             /* Esconde o quadrado padrão da biblioteca */
            display: none !important;
          }
          #${QR_SCANNER_ELEMENT_ID} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important; /* A REGRA MAIS IMPORTANTE */
          }
        `}</style>

        <div className="relative w-full bg-black" style={{ aspectRatio: '1 / 1' }}>
          {/* O contêiner onde a biblioteca vai renderizar a câmera */}
          <div id={QR_SCANNER_ELEMENT_ID} />

          {/* Nossa própria moldura customizada por cima */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[250px] h-[250px] border-4 border-white/80 rounded-lg"
              style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};