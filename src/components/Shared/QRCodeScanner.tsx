// src/components/shared/QRCodeScanner.tsx
// VERSÃO OTIMIZADA PARA PWA

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast'; // Usaremos para os alertas

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

// Funções de controle de orientação da tela
const lockOrientation = async () => {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('portrait');
    }
  } catch (error) {
    console.warn('Não foi possível travar a orientação da tela:', error);
  }
};

const unlockOrientation = () => {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (error) {
    console.warn('Não foi possível destravar a orientação da tela:', error);
  }
};


export const QRCodeScanner = ({ open, onOpenChange, onScanSuccess }: QRCodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Função para parar a câmera e destravar a tela
  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    unlockOrientation();
  };

  const handleClose = () => {
    stopScanner();
    onOpenChange(false);
  };

  useEffect(() => {
    const startScanner = async () => {
      try {
        await lockOrientation();

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'environment', // Padrão para câmera traseira
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => console.error("Erro ao dar play no vídeo: ", err));
          };
        }
        // A lógica de DECODIFICAÇÃO do QR code será adicionada no próximo passo

      } catch (error: any) {
        console.error("Erro detalhado da câmera:", error);
        if (error.name === 'NotAllowedError') {
          toast({ title: "Erro de Permissão", description: "A permissão da câmera foi negada. Por favor, ative nas configurações do navegador.", variant: "destructive"});
        } else if (error.name === 'NotReadableError') {
          toast({ title: "Erro na Câmera", description: "A câmera já está em uso por outro aplicativo.", variant: "destructive"});
        } else {
          toast({ title: "Erro Inesperado", description: `Não foi possível iniciar a câmera: ${error.message}`, variant: "destructive"});
        }
        handleClose();
      }
    };

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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 gap-0 max-w-[90vw] w-full sm:max-w-md rounded-lg overflow-hidden">
        <DialogHeader className="flex-row items-center justify-between p-4 border-b">
          <DialogTitle>Aponte para o QR Code</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="relative w-full bg-black" style={{ aspectRatio: '1 / 1' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover" // A classe que resolve o enquadramento!
          />
          
          {/* Moldura de escaneamento (overlay) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="w-[70%] h-[70%] border-4 border-white/80 rounded-lg"
              style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}
            />
          </div>
        </div>
        
        <div className="p-4 text-center border-t bg-gray-50">
          <Button onClick={handleClose} variant="outline" className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};