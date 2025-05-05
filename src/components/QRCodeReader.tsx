
import { useState, useEffect, useCallback, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "./ui/use-toast";
import { Loader2, ScanLine, Camera, CameraOff, RefreshCcw } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

interface QRCodeReaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}

// Extended types to handle torch property
interface ExtendedCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

interface ExtendedConstraints extends MediaTrackConstraintSet {
  torch?: boolean;
}

export function QRCodeReader({ open, onOpenChange, onScan }: QRCodeReaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [activeCamera, setActiveCamera] = useState<'environment' | 'user'>('environment');
  const { isMobile } = useMobile();
  
  const streamRef = useRef<MediaStream | null>(null);
  
  // Cleanup function for camera resources
  const cleanupCamera = useCallback(() => {
    console.log("Cleaning up camera resources");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Track stopped:", track.label);
      });
      streamRef.current = null;
    }
    
    if (torchEnabled) {
      setTorchEnabled(false);
    }
    
    setScanning(false);
  }, [torchEnabled]);
  
  // Camera initialization
  const requestCameraAccess = useCallback(async () => {
    try {
      setError(null);
      
      // Clean up previous stream if exists
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const constraints = {
        video: {
          facingMode: activeCamera,
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 720 : 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Check if device has torch capability with proper type assertion
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as ExtendedCapabilities;
        setHasFlash(!!capabilities.torch);
      }
      
      setCameraPermission('granted');
      setScanning(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Acesso à câmera foi negado. Por favor, permita o acesso à câmera nas configurações do seu navegador.");
          setCameraPermission('denied');
        } else {
          setError(`Erro ao acessar a câmera: ${err.message}`);
        }
      } else {
        setError("Erro ao acessar a câmera");
      }
    }
  }, [activeCamera, isMobile]);
  
  // Toggle camera (front/back)
  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    const newCamera = activeCamera === 'environment' ? 'user' : 'environment';
    setActiveCamera(newCamera);
    
    toast({
      title: "Trocando câmera",
      description: newCamera === 'environment' ? "Usando câmera traseira" : "Usando câmera frontal"
    });
  }, [activeCamera]);
  
  // Toggle flashlight with proper type handling
  const toggleTorch = async () => {
    try {
      if (!streamRef.current) return;
      
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        // Use type assertion for the constraints
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as ExtendedConstraints]
        });
        
        setTorchEnabled(!torchEnabled);
        
        toast({
          title: torchEnabled ? "Lanterna desligada" : "Lanterna ligada",
        });
      }
    } catch (err) {
      console.error("Error toggling torch:", err);
      toast({
        title: "Erro",
        description: "Não foi possível ativar a lanterna",
        variant: "destructive",
      });
    }
  };
  
  // Handle QR code scan result
  const handleScan = (result: any) => {
    if (result) {
      try {
        const scanData = result.text || result;
        onScan(scanData);
        onOpenChange(false);
        setScanning(false);
        
        toast({
          title: "Sucesso",
          description: "QR Code lido com sucesso",
        });
      } catch (err) {
        console.error("Error processing scan result:", err);
      }
    }
  };
  
  // Initialize camera when dialog opens
  useEffect(() => {
    if (open) {
      setScanning(true);
      setError(null);
      
      const timer = setTimeout(() => {
        requestCameraAccess();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      cleanupCamera();
    }
  }, [open, requestCameraAccess, cleanupCamera]);
  
  // Handle camera change
  useEffect(() => {
    if (open && cameraPermission !== 'denied') {
      requestCameraAccess();
    }
  }, [activeCamera, open, cameraPermission, requestCameraAccess]);
  
  return (
    <Dialog open={open} onOpenChange={(state) => {
      if (!state) cleanupCamera();
      onOpenChange(state);
    }}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escaneie o QR Code</DialogTitle>
          <DialogDescription>
            Posicione o QR Code dentro da área demarcada
          </DialogDescription>
        </DialogHeader>
        
        {error ? (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{error}</AlertDescription>
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={requestCameraAccess} 
                className="w-full"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          </Alert>
        ) : (
          <div className="relative">
            {scanning && cameraPermission === 'granted' && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2">
                  <ScanLine className="w-full h-1 text-green-500 animate-pulse" />
                </div>
              </div>
            )}
            
            <div className="w-full max-w-sm mx-auto rounded-md overflow-hidden shadow-inner bg-black">
              {cameraPermission === 'pending' && (
                <div className="h-64 flex flex-col items-center justify-center bg-gray-800 text-white">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="text-sm">Aguardando permissão da câmera...</p>
                </div>
              )}
              
              {cameraPermission === 'denied' && (
                <div className="h-64 flex flex-col items-center justify-center bg-gray-800 text-white p-4">
                  <CameraOff className="h-12 w-12 text-red-400 mb-4" />
                  <p className="text-center mb-4">Permissão da câmera negada.</p>
                  <Button 
                    onClick={() => {
                      setCameraPermission('pending');
                      requestCameraAccess();
                    }} 
                    variant="default"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Permitir Acesso à Câmera
                  </Button>
                </div>
              )}
              
              {cameraPermission === 'granted' && scanning && (
                <div style={{ height: "320px", width: "100%" }}>
                  <QrReader
                    onResult={handleScan}
                    constraints={{ 
                      facingMode: activeCamera,
                      aspectRatio: 1,
                    }}
                    videoId="qr-video-element"
                    className="w-full h-full"
                    scanDelay={300}
                    videoStyle={{ 
                      objectFit: 'cover', 
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
              )}
              
              <div className="border-4 border-white opacity-70 absolute inset-0 m-auto w-2/3 h-2/3 z-20 pointer-events-none"></div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            {cameraPermission === 'granted' && isMobile && (
              <Button 
                type="button" 
                onClick={toggleCamera}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Camera className="mr-2 h-4 w-4" />
                Trocar Câmera
              </Button>
            )}
            
            {hasFlash && cameraPermission === 'granted' && (
              <Button 
                type="button" 
                onClick={toggleTorch}
                variant={torchEnabled ? "default" : "outline"}
                className="flex-1 sm:flex-none"
              >
                {torchEnabled ? "Desligar Lanterna" : "Ligar Lanterna"}
              </Button>
            )}
          </div>
          
          <Button 
            type="button" 
            variant="destructive" 
            onClick={() => {
              cleanupCamera();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

