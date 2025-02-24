
import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface QRCodeReaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}

export function QRCodeReader({ open, onOpenChange, onScan }: QRCodeReaderProps) {
  const handleScan = (result: any) => {
    if (result) {
      onScan(result?.text);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escaneie o QR Code</DialogTitle>
        </DialogHeader>
        <div className="w-full max-w-sm mx-auto">
          <QrReader
            onResult={handleScan}
            constraints={{ facingMode: 'environment' }}
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
