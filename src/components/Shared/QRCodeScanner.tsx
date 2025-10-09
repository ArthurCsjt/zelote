// src/components/shared/QRCodeScanner.tsx
// VERSÃO FINAL - NATIVA E OTIMIZADA PARA PWA
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
const lockOrientation = async () => {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('portrait');
    }
  } catch (error) {
    console.warn('Não foi possível travar a orientação:', error);
  }
};

const unlockOrientation = () => {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (error) {
    console.warn('Não foi possível destravar a orientação:', error);
  }
};

export const QRCodeScanner = ({ open, onOpenChange, onScanSuccess }: QRCodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null); // CORRIGIDO: number ao invés de NodeJS.Timeout
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const stopScanner = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    unlockOrientation();
    setIsLoading(false);
  };

  const handleClose = () => {
    stopScanner();
    setError('');
    setShowManualInput(false);
    setManualInput('');
    onOpenChange(false);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
      handleClose();
    }
  };

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    try {
      // Configurar canvas com tamanho do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capturar frame do vídeo
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Detectar QR Code usando BarcodeDetector
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(canvas);

        if (barcodes.length > 0 && barcodes[0].rawValue) {
          const qrCode = barcodes[0].rawValue;
          stopScanner();
          onScanSuccess(qrCode);
          handleClose();
        }
      }
    } catch (error) {
      console.error('Erro ao escanear frame:', error);
    }
  };

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    const startScanner = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Verificar suporte ao BarcodeDetector
        if (!('BarcodeDetector' in window)) {
          console.warn('BarcodeDetector não suportado');
          setIsUnsupported(true);
          setShowManualInput(true);
          setIsLoading(false);
          toast({
            title: "⚠️ Scanner não suportado",
            description: "Use a entrada manual para inserir o código.",
            variant: "destructive",
          });
          return;
        }

        setIsUnsupported(false);

        // Travar orientação em portrait
        await lockOrientation();

        // Configurações otimizadas da câmera
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 1.0 } // CRÍTICO para evitar rotação
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Aguardar vídeo estar pronto
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => resolve();
            }
          });

          await videoRef.current.play();
          setIsLoading(false);

          // Iniciar scan automático a cada 300ms
          intervalRef.current = window.setInterval(scanFrame, 300);
        }

      } catch (err: any) {
        console.error('Erro ao acessar câmera:', err);
        setIsLoading(false);

        let errorMessage = 'Erro ao acessar a câmera';
        
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Permissão de câmera negada. Ative nas configurações.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Câmera em uso por outro aplicativo.';
        }

        setError(errorMessage);
        setShowManualInput(true);
        
        toast({
          title: "❌ Erro na câmera",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    startScanner();

    // Cleanup ao desmontar
    return () => {
      stopScanner();
    };
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {error ? <CameraOff className="w-5 h-5 text-red-500" /> : '📷'}
            {error ? 'Erro na Câmera' : 'Escaneie o QR Code'}
          </DialogTitle>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área da câmera ou erro */}
          {!error && !isUnsupported ? (
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '400px' }}>
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
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Canvas oculto para processamento */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Moldura do QR Code */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="border-4 border-white rounded-lg relative"
                  style={{
                    width: '250px',
                    height: '250px',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                  }}
                >
                  {/* Cantos destacados */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                </div>
              </div>

              {/* Indicador de scan */}
              {!isLoading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Procurando QR Code...
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center" style={{ height: '400px' }}>
              <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error || 'Scanner não disponível'}</p>
              <p className="text-sm text-gray-500">Use a entrada manual abaixo</p>
            </div>
          )}

          {/* Instruções */}
          <p className="text-sm text-gray-600 text-center">
            Posicione o QR Code dentro da moldura branca
          </p>

          {/* Entrada Manual */}
          {showManualInput && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
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
                <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                  OK
                </Button>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            {!showManualInput && !isUnsupported && (
              <Button 
                variant="secondary" 
                onClick={() => setShowManualInput(true)}
                className="flex-1"
              >
                Digitar Manual
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};