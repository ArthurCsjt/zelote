// src/components/shared/QRCodeScanner.tsx

import { useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

const QR_SCANNER_ELEMENT_ID = 'qr-code-reader';

export const QRCodeScanner = ({ open, onOpenChange, onScanSuccess }: QRCodeScannerProps) => {
  useEffect(() => {
    if (!open) return;

    const scanner = new Html5QrcodeScanner(
      QR_SCANNER_ELEMENT_ID,
      { qrbox: { width: 250, height: 250 }, fps: 10 },
      false
    );

    const handleScanSuccess = (decodedText: string) => {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        onScanSuccess(decodedText);
      }
    };

    scanner.render(handleScanSuccess, undefined);

    return () => {
      scanner.clear().catch((error) => {
        console.error("Falha ao limpar o Html5QrcodeScanner.", error);
      });
    };
  }, [open, onScanSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aponte para o QR Code</DialogTitle>
        </DialogHeader>
        <div id={QR_SCANNER_ELEMENT_ID} />
      </DialogContent>
    </Dialog>
  );
};