import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { X, Camera, Maximize2 } from 'lucide-react';

interface QRCodeScannerPWAProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}

// Verifica se está rodando como PWA
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Controla orientação da tela
const lockOrientation = async () => {
  try {
    if (screen.orientation && (screen.orientation as any).lock) {
      await (screen.orientation as any).lock('portrait');
    }
  } catch (error) {
    console.log('Não foi possível travar orientação:', error);
  }
};

const unlockOrientation = () => {
  try {
    if (screen.orientation && (screen.orientation as any).unlock) {
      (screen.orientation as any).unlock();
    }
  } catch (error) {
    console.log('Não foi possível destravar orientação:', error);
  }
};

export const QRCodeScannerPWA = ({ open, onOpenChange, onScan }: QRCodeScannerPWAProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Função para pedir permissão de câmera
  const requestCameraPermission = async (): Promise<MediaStream | null> => {
    try {
      if (isPWA()) {
        console.log('🔵 Rodando como PWA - Verificando permissões...');
      }

      // Configuração otimizada para PWA mobile
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 24, max: 30 } // Reduzido para economizar bateria
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasPermission(true);
      return stream;

    } catch (error: any) {
      setHasPermission(false);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "❌ Permissão Negada",
          description: "Vá em Configurações do app e ative a câmera.",
          variant: "destructive"
        });
      } else if (error.name === 'NotFoundError') {
        toast({
          title: "❌ Sem Câmera",
          description: "Nenhuma câmera encontrada no dispositivo.",
          variant: "destructive"
        });
      } else if (error.name === 'NotReadableError') {
        toast({
          title: "❌ Câmera em Uso",
          description: "Feche outros apps que usam câmera e tente novamente.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Erro de Câmera",
          description: error.message || "Erro desconhecido ao acessar câmera.",
          variant: "destructive"
        });
      }
      
      return null;
    }
  };

  // Decoder QR Code básico (você pode usar uma biblioteca como jsQR)
  const decodeQRCode = (imageData: ImageData): string | null => {
    // Implementação simplificada - na prática use jsQR ou similar
    // Por ora, retorna null para teste
    return null;
  };

  // Escaneia frame por frame
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = decodeQRCode(imageData);

    if (qrCode) {
      toast({
        title: "✅ QR Code Detectado",
        description: "Código lido com sucesso!",
      });
      onScan(qrCode);
      stopScanner();
    }
  };

  // Inicia o scanner
  const startScanner = async () => {
    try {
      setIsScanning(true);
      await lockOrientation();

      const stream = await requestCameraPermission();
      if (!stream) {
        setIsScanning(false);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });

        await videoRef.current.play();

        // Inicia escaneamento contínuo
        scanIntervalRef.current = window.setInterval(scanFrame, 300);
      }

    } catch (error) {
      console.error('Erro ao iniciar scanner:', error);
      setIsScanning(false);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o scanner.",
        variant: "destructive"
      });
    }
  };

  // Para o scanner
  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
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
    setIsScanning(false);
  };

  // Efeito para controlar abertura/fechamento do dialog
  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) stopScanner();
        onOpenChange(isOpen);
      }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-card">
            <div>
              <DialogTitle className="text-foreground">Escaneie o QR Code</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isPWA() ? '📱 Modo PWA Ativo' : '🌐 Modo Web'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Camera View */}
          <div className="relative bg-black overflow-hidden" style={{ height: '400px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Espelhar câmera frontal
            />

            {/* Canvas oculto para processamento */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Frame overlay - Moldura do QR */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="border-4 border-white rounded-lg relative"
                style={{ 
                  width: '250px', 
                  height: '250px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                }}
              >
                {/* Cantos da moldura */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>

            {/* Status indicator */}
            {isScanning && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                🎯 Procurando QR Code...
              </div>
            )}

            {/* Ícone de zoom (decorativo) */}
            <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full">
              <Maximize2 className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Footer - Instructions and Actions */}
          <div className="p-4 border-t bg-card space-y-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Camera className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Posicione o QR Code dentro da moldura branca. 
                A leitura será automática.
              </p>
            </div>

            {hasPermission === false && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
                <strong>Sem permissão de câmera.</strong>
                <br />
                Ative a câmera nas configurações do seu dispositivo.
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  onOpenChange(false);
                  // Aqui você pode abrir um modal de input manual
                }}
                className="flex-1"
              >
                Digitar Manual
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
