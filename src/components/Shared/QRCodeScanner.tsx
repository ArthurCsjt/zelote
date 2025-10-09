// src/components/shared/QRCodeScanner.tsx
// VERSÃO FINAL - CORRIGIDA E OTIMIZADA PARA PWA

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

// Declaração de tipo para o BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

// Funções de controle de orientação
const lockOrientation = async () => { /* ...código original... */ };
const unlockOrientation = () => { /* ...código original... */ };

export const QRCodeScanner = ({ open, onOpenChange, onScanSuccess }: QRCodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Inicia como true
  const [error, setError] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const stopScanner = () => { /* ...código original... */ };
  const handleClose = () => { /* ...código original... */ };
  const handleManualSubmit = () => { /* ...código original... */ };
  const scanFrame = async () => { /* ...código original... */ };

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    const startScanner = async () => {
        // ... (todo o seu código da função startScanner permanece igual) ...
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {error ? <CameraOff className="w-5 h-5 text-red-500" /> : '📷'}
            {error ? 'Erro na Câmera' : 'Escaneie o QR Code'}
          </DialogTitle>
          <button onClick={handleClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Área da câmera ou erro */}
          {!error && !isUnsupported ? (
            <div className="w-full"> {/* <<--- CORREÇÃO 1: DIV DE ISOLAMENTO */}
              <div
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: '1 / 1' }} /* <<--- CORREÇÃO 2: ASPECT RATIO */
              >
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                    <div className="text-white text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Iniciando câmera...</p>
                    </div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  // A linha style com transform: scaleX(-1) foi removida <<--- CORREÇÃO 3
                />

                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="border-4 border-white rounded-lg relative"
                    style={{
                      width: '250px',
                      height: '250px',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                    }}
                  >
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                  </div>
                </div>

                {!isLoading && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Procurando QR Code...
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center" style={{ minHeight: '300px' }}>
              <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error || 'Scanner não disponível'}</p>
              <p className="text-sm text-gray-500">Use a entrada manual abaixo</p>
            </div>
          )}

          <p className="text-sm text-gray-600 text-center !mt-2">
            Posicione o QR Code dentro da moldura
          </p>

          {showManualInput && (
            <div className="space-y-3 pt-4 border-t">
              <label className="text-sm font-medium text-gray-700">
                Ou digite o código manualmente:
              </label>
              <div className="flex gap-2">
                <Input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Digite o código..."
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>OK</Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 !mt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            {!showManualInput && !isUnsupported && (
              <Button variant="secondary" onClick={() => setShowManualInput(true)} className="flex-1">
                Digitar Manual
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};