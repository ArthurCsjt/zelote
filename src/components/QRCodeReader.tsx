
import { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "./ui/use-toast";
import { Loader2, ScanLine, Camera, CameraOff } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

interface QRCodeReaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}

// Custom interface for MediaTrackCapabilities with torch
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

// Custom interface for MediaTrackConstraintSet with torch
interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

export function QRCodeReader({ open, onOpenChange, onScan }: QRCodeReaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [activeCamera, setActiveCamera] = useState<'environment' | 'user'>('environment');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  
  const isMobile = useMobile();

  // Check camera permission status
  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state as 'granted' | 'denied' | 'pending');
      
      // Listen for permission changes
      result.addEventListener('change', () => {
        setCameraPermission(result.state as 'granted' | 'denied' | 'pending');
      });
    } catch (err) {
      // Browser might not support permissions API, try direct access
      requestCameraAccess();
    }
  };

  // Request camera access explicitly
  const requestCameraAccess = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: activeCamera,
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 720 : 720 },
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      setCameraPermission('granted');
      
      // Now check for torch capability
      checkTorchAvailability(stream);
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraPermission('denied');
      setError("Acesso à câmera negado. Por favor, verifique as permissões do navegador.");
    }
  };

  // Toggle between front and back cameras (for mobile devices)
  const toggleCamera = async () => {
    if (videoStream) {
      // Stop current stream
      videoStream.getTracks().forEach(track => track.stop());
    }
    
    // Toggle camera
    const newCamera = activeCamera === 'environment' ? 'user' : 'environment';
    setActiveCamera(newCamera);
    
    // Request new stream with toggled camera
    try {
      const constraints = {
        video: { 
          facingMode: newCamera,
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 720 : 720 },
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      
      // Check torch availability for the new camera
      setTorchEnabled(false);
      checkTorchAvailability(stream);
    } catch (err) {
      console.error("Error switching camera:", err);
      setError("Erro ao trocar de câmera. Tente novamente.");
    }
  };

  // Check if device has a flash/torch
  const checkTorchAvailability = async (stream?: MediaStream) => {
    try {
      const mediaStream = stream || await navigator.mediaDevices.getUserMedia({
        video: { facingMode: activeCamera }
      });
      
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
        setHasFlash(!!capabilities.torch);
        
        // Don't stop the stream if it was passed as an argument
        if (!stream) {
          mediaStream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (err) {
      console.error("Error checking torch availability:", err);
      setHasFlash(false);
    }
  };

  const toggleTorch = async () => {
    try {
      if (!videoStream) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: activeCamera }
        });
        setVideoStream(stream);
      }
      
      if (videoStream) {
        const track = videoStream.getVideoTracks()[0];
        if (track) {
          // Toggle torch
          await track.applyConstraints({
            advanced: [{ torch: !torchEnabled } as ExtendedMediaTrackConstraintSet]
          });
          
          setTorchEnabled(!torchEnabled);
        }
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

  const handleScan = (result: any) => {
    setError(null);
    
    if (result) {
      try {
        // Try to parse as JSON first
        JSON.parse(result?.text);
        
        setScanning(false);
        onScan(result?.text);
        onOpenChange(false);
        
        toast({
          title: "Sucesso",
          description: "QR Code lido com sucesso",
        });
      } catch (err) {
        // If it's not valid JSON, but we still have text
        if (result?.text && typeof result.text === 'string') {
          setScanning(false);
          onScan(result.text);
          onOpenChange(false);
          
          toast({
            title: "QR Code lido",
            description: "Formato não reconhecido, mas texto extraído",
          });
        }
      }
    }
  };

  const handleError = (err: any) => {
    console.error("QR Code Scanner Error:", err);
    setError("Erro ao usar a câmera. Verifique as permissões.");
    setScanning(false);
  };

  // Handle dialog open/close
  useEffect(() => {
    if (open) {
      setScanning(true);
      setError(null);
      checkCameraPermission();
    } else {
      setScanning(false);
      // Clean up video stream when dialog closes
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      
      // Reset torch when closing
      if (torchEnabled) {
        setTorchEnabled(false);
      }
    }
  }, [open]);

  // Retry camera access after permission granted
  useEffect(() => {
    if (cameraPermission === 'granted' && open && !videoStream) {
      requestCameraAccess();
    }
  }, [cameraPermission, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escaneie o QR Code</DialogTitle>
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
                    onClick={requestCameraAccess} 
                    variant="outline" 
                    className="bg-white text-gray-800"
                  >
                    Permitir Acesso à Câmera
                  </Button>
                </div>
              )}
              
              {cameraPermission === 'granted' && scanning && (
                <QrReader
                  key={`qr-reader-${activeCamera}`}
                  onResult={handleScan}
                  constraints={{ 
                    facingMode: activeCamera,
                    aspectRatio: 1,
                    width: { min: 360, ideal: isMobile ? 720 : 1280 },
                    height: { min: 360, ideal: isMobile ? 720 : 720 },
                  }}
                  videoId="qr-video-element"
                  className="w-full"
                  scanDelay={300}
                  videoStyle={{ 
                    objectFit: 'cover', 
                    width: '100%',
                    height: '100%',
                    minHeight: '250px'
                  }}
                />
              )}
              
              {!scanning && (
                <div className="h-64 flex items-center justify-center bg-gray-800">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              
              <div className="border-4 border-white opacity-70 absolute inset-0 m-auto w-2/3 h-2/3 z-20 pointer-events-none"></div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
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
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
