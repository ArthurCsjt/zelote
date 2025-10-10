// src/components/QRCodeReader.tsx
// SOLUÇÃO DEFINITIVA - Combina html5-qrcode + Correções PWA

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { CameraOff, Loader2, X } from "lucide-react";

interface QRCodeReaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}

const QR_SCANNER_ELEMENT_ID = 'qr-code-reader-container';

// Funções de controle de orientação (CRÍTICO PARA PWA)
const lockOrientation = async () => {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('portrait');
      console.log('✅ Orientação travada em portrait');
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível travar orientação:', error);
  }
};

const unlockOrientation = () => {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
      console.log('✅ Orientação destravada');
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível destravar orientação:', error);
  }
};

export function QRCodeReader({ open, onOpenChange, onScan }: QRCodeReaderProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const cleanupScanner = useCallback(async () => {
    if (!scannerRef.current) {
      return;
    }
    try {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
        console.log("✅ Scanner parado com sucesso.");
      }
    } catch (err) {
      console.error("⚠️ Erro ao parar o scanner durante o cleanup:", err);
    } finally {
      unlockOrientation();
      setIsLoading(false);
      setError('');
      setShowManualInput(false);
      setManualCode('');
    }
  }, []);

  useEffect(() => {
    if (!open) {
      cleanupScanner();
      return;
    }

    const initScanner = async () => {
      try {
        setIsLoading(true);
        setError('');
        await lockOrientation();
        await new Promise(resolve => setTimeout(resolve, 150));

        const element = document.getElementById(QR_SCANNER_ELEMENT_ID);
        if (!element) {
          throw new Error('Elemento do scanner não encontrado');
        }

        const scanner = new Html5Qrcode(QR_SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          // aspectRatio removido da config principal para maior flexibilidade
          formatsToSupport: [0],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };
        
        // --- INÍCIO DA CORREÇÃO ---
        // Constraints de câmera mais flexíveis para máxima compatibilidade móvel
        const constraints = {
            facingMode: 'environment',
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 }
            // A propriedade 'aspectRatio' foi removida para maior flexibilidade
        };
        // --- FIM DA CORREÇÃO ---

        const onScanSuccess = (decodedText: string) => {
          cleanupScanner();
          toast({ 
            title: "✅ QR Code Lido", 
            description: `Código: ${decodedText}` 
          });
          onScan(decodedText);
          onOpenChange(false);
        };

        const onScanError = (errorMessage: string) => {
          if (!errorMessage.includes('NotFoundException')) {
            console.warn('Scanner error:', errorMessage);
          }
        };

        await scanner.start(
          constraints as any, 
          config,
          onScanSuccess,
          onScanError
        );

        console.log('✅ Scanner iniciado com sucesso');
        setIsLoading(false);

      } catch (err: any) {
        console.error('❌ Erro ao iniciar scanner:', err);
        setIsLoading(false);

        let errorMsg = 'Erro ao acessar a câmera. Verifique as permissões.';
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
          errorMsg = 'Permissão de câmera negada. Ative nas configurações do navegador.';
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
        } else if (err.name === 'NotReadableError') {
          errorMsg = 'Câmera em uso por outro aplicativo. Feche outros apps.';
        } else if (err.name === 'OverconstrainedError') {
          errorMsg = 'O dispositivo não suporta as configurações de câmera solicitadas.';
        }
        setError(errorMsg);
        setShowManualInput(true);

        toast({
          title: "❌ Erro na Câmera",
          description: errorMsg,
          variant: "destructive",
        });

        unlockOrientation();
      }
    };

    initScanner();

    return () => {
      cleanupScanner();
    };
  }, [open, onScan, onOpenChange, cleanupScanner]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      toast({ 
        title: "✅ Código Inserido", 
        description: `Código: ${manualCode.trim()}` 
      });
      onScan(manualCode.trim());
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    cleanupScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-[95vw] sm:max-w-md overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {error ? (
              <>
                <CameraOff className="w-5 h-5 text-red-500" />
                Erro na Câmera
              </>
            ) : (
              <>
                📷 Escaneie o QR Code
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {error ? 
              'Use a entrada manual para continuar' : 
              'Posicione o QR Code na área destacada'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!error ? (
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '350px' }}>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
                  <p className="text-white text-sm">Iniciando câmera...</p>
                  <p className="text-gray-400 text-xs mt-1">Pode levar alguns segundos</p>
                </div>
              )}
              <div 
                id={QR_SCANNER_ELEMENT_ID}
                className="w-full"
                style={{
                  minHeight: '350px',
                  transform: 'scaleX(1)',
                }}
              />
              {!isLoading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Procurando QR Code...
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center" style={{ minHeight: '350px' }}>
              <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">Câmera Indisponível</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <Button
                onClick={() => setShowManualInput(!showManualInput)}
                variant="outline"
                className="mx-auto"
              >
                {showManualInput ? 'Ocultar' : 'Mostrar'} Entrada Manual
              </Button>
            </div>
          )}

          {showManualInput && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Label htmlFor="manualCode" className="text-sm font-medium">
                Digite o código manualmente:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manualCode"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Cole ou digite o código..."
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleManualSubmit} 
                  disabled={!manualCode.trim()}
                >
                  OK
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            {!error && !showManualInput && (
              <Button 
                variant="secondary"
                onClick={() => setShowManualInput(true)}
                className="flex-1"
              >
                Entrada Manual
              </Button>
            )}
          </div>
        </div>

        <style>{`
          #${QR_SCANNER_ELEMENT_ID} video {
            width: 100% !important;
            height: auto !important;
            max-height: 350px !important;
            object-fit: cover !important;
            border-radius: 8px;
            transform: scaleX(1) !important;
          }
          #${QR_SCANNER_ELEMENT_ID} {
            border-radius: 8px;
            overflow: hidden;
          }
          #${QR_SCANNER_ELEMENT_ID}__header_message {
            display: none !important;
          }
          #${QR_SCANNER_ELEMENT_ID} button {
            background-color: #2563eb !important;
            border: none !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            margin: 4px !important;
          }
          #${QR_SCANNER_ELEMENT_ID} button:hover {
            background-color: #1d4ed8 !important;
          }
          @media (max-width: 640px) {
            #${QR_SCANNER_ELEMENT_ID} video {
              max-height: 300px !important;
            }
          }
          @media screen and (orientation: landscape) and (max-width: 768px) {
            #${QR_SCANNER_ELEMENT_ID} video {
              transform: scaleX(1) rotate(0deg) !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}