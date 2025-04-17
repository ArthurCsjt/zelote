
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

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

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
  const [attemptingRetry, setAttemptingRetry] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const maxInitAttempts = 3;
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrReaderContainerRef = useRef<HTMLDivElement | null>(null);
  
  const isMobile = useMobile();
  
  // Function to determine optimal camera constraints based on device
  const getCameraConstraints = useCallback(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /android/i.test(navigator.userAgent);
    
    // Base constraints with reasonable defaults
    const baseConstraints: MediaTrackConstraints = {
      facingMode: activeCamera,
      width: { 
        min: 320,
        ideal: isMobile ? 640 : 1280,
        max: 1920
      },
      height: { 
        min: 320, 
        ideal: isMobile ? 480 : 720,
        max: 1080
      },
    };
    
    // iOS-specific optimizations
    if (isIOS) {
      return {
        video: {
          ...baseConstraints,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false
      };
    }
    
    // Android-specific optimizations
    if (isAndroid) {
      return {
        video: {
          ...baseConstraints,
          width: { ideal: 720 },
          height: { ideal: 720 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false
      };
    }
    
    // Default constraints for other devices
    return {
      video: baseConstraints,
      audio: false
    };
  }, [activeCamera, isMobile]);

  const checkCameraPermission = useCallback(async () => {
    try {
      setError(null);
      
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(result.state as 'granted' | 'denied' | 'pending');
          
          result.addEventListener('change', () => {
            setCameraPermission(result.state as 'granted' | 'denied' | 'pending');
          });
          
          if (result.state === 'granted') {
            requestCameraAccess();
          }
        } catch (err) {
          // Some browsers don't support permission API for camera
          console.log("Permission API not fully supported, trying direct camera access");
          requestCameraAccess();
        }
      } else {
        console.log("Permission API not supported, trying direct camera access");
        requestCameraAccess();
      }
    } catch (err) {
      console.log("Error checking camera permission:", err);
      requestCameraAccess();
    }
  }, []);

  const requestCameraAccess = useCallback(async () => {
    try {
      setAttemptingRetry(true);
      setError(null);
      console.log("Requesting camera access with facing mode:", activeCamera);
      
      // Clean up previous stream if exists
      if (streamRef.current) {
        console.log("Stopping previous video stream");
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("Track stopped:", track.label);
        });
        streamRef.current = null;
        setVideoStream(null);
      }
      
      // Get optimal constraints
      const constraints = getCameraConstraints();
      console.log("Camera constraints:", constraints);
      
      // Timeout for camera access
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Camera access timeout")), 12000);
      });
      
      // Try to get camera stream with timeout
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        timeoutPromise
      ]) as MediaStream;
      
      console.log("Camera access granted, stream:", stream);
      streamRef.current = stream;
      setVideoStream(stream);
      setCameraPermission('granted');
      
      // On success, reset attempts counter
      setInitAttempts(0);
      
      // Check for torch capability
      checkTorchAvailability(stream);
      
      // Everything succeeded
      setError(null);
      setScanning(true);
      setAttemptingRetry(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      
      // Increment attempt counter
      const newAttemptCount = initAttempts + 1;
      setInitAttempts(newAttemptCount);
      
      // Set permission denied if we've reached max attempts
      if (newAttemptCount >= maxInitAttempts) {
        setCameraPermission('denied');
      }
      
      // Provide detailed error message based on error type
      if (err instanceof Error) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);
        
        if (err.name === "NotAllowedError") {
          setError("Acesso à câmera foi negado. Por favor, permita o acesso à câmera nas configurações do seu navegador.");
        } else if (err.name === "NotReadableError") {
          if (isIOS) {
            setError("Não foi possível acessar a câmera no iOS. Tente fechar outras abas ou aplicativos que possam estar usando a câmera.");
          } else if (isAndroid) {
            setError("Não foi possível acessar a câmera no Android. Verifique se outro aplicativo não está usando a câmera e tente novamente.");
          } else {
            setError("Não foi possível acessar a câmera. A câmera pode estar sendo usada por outro aplicativo ou guia do navegador.");
          }
        } else if (err.name === "NotFoundError") {
          setError("Nenhuma câmera encontrada no dispositivo.");
        } else if (err.message === "Camera access timeout") {
          setError("Tempo esgotado ao tentar acessar a câmera. Tente novamente.");
        } else {
          setError(`Erro ao acessar a câmera: ${err.message || "Erro desconhecido"}`);
        }
      } else {
        setError("Acesso à câmera negado. Por favor, verifique as permissões do navegador.");
      }
      
      setAttemptingRetry(false);
      
      // If not at max attempts, try again with different camera
      if (newAttemptCount < maxInitAttempts && isMobile) {
        const newCamera = activeCamera === 'environment' ? 'user' : 'environment';
        console.log(`Attempt ${newAttemptCount}: Trying with different camera: ${newCamera}`);
        setTimeout(() => {
          setActiveCamera(newCamera);
        }, 1000);
      }
    }
  }, [activeCamera, initAttempts, getCameraConstraints, isMobile]);

  const toggleCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setVideoStream(null);
    }
    
    const newCamera = activeCamera === 'environment' ? 'user' : 'environment';
    setActiveCamera(newCamera);
    
    toast({
      title: "Trocando câmera",
      description: newCamera === 'environment' ? "Usando câmera traseira" : "Usando câmera frontal"
    });
    
    setScanning(false);
    setInitAttempts(0); // Reset attempts when manually switching camera
    
    // Camera will be requested in the useEffect triggered by changing activeCamera
  }, [activeCamera]);

  const checkTorchAvailability = async (stream?: MediaStream) => {
    try {
      const mediaStream = stream || streamRef.current;
      if (!mediaStream) return;
      
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
        setHasFlash(!!capabilities.torch);
      }
    } catch (err) {
      console.error("Error checking torch availability:", err);
      setHasFlash(false);
    }
  };

  const toggleTorch = async () => {
    try {
      if (!streamRef.current) {
        toast({
          title: "Erro",
          description: "Sem acesso à câmera",
          variant: "destructive",
        });
        return;
      }
      
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as ExtendedMediaTrackConstraintSet]
        });
        
        setTorchEnabled(!torchEnabled);
        
        toast({
          title: torchEnabled ? "Lanterna desligada" : "Lanterna ligada",
          description: "",
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

  const handleScan = (result: any) => {
    setError(null);
    
    if (result) {
      try {
        console.log("QR code scanned successfully:", result);
        JSON.parse(result?.text);
        
        setScanning(false);
        onScan(result?.text);
        onOpenChange(false);
        
        toast({
          title: "Sucesso",
          description: "QR Code lido com sucesso",
        });
      } catch (err) {
        if (result?.text && typeof result.text === 'string') {
          console.log("QR code text (not JSON):", result.text);
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
    // We'll handle errors via our own system instead
  };

  const cleanupCamera = useCallback(() => {
    console.log("Cleaning up camera resources");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Track stopped:", track.label);
      });
      streamRef.current = null;
      setVideoStream(null);
    }
    
    if (torchEnabled) {
      setTorchEnabled(false);
    }
    
    setScanning(false);
  }, [torchEnabled]);

  // Effect for initializing camera when dialog opens
  useEffect(() => {
    if (open) {
      console.log("Dialog opened, initializing camera");
      setScanning(true);
      setError(null);
      setInitAttempts(0);
      
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        checkCameraPermission();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      console.log("Dialog closed, cleaning up");
      cleanupCamera();
    }
  }, [open, checkCameraPermission, cleanupCamera]);

  // Effect for handling active camera change
  useEffect(() => {
    if (open && cameraPermission !== 'denied') {
      requestCameraAccess();
    }
  }, [activeCamera, open, cameraPermission, requestCameraAccess]);

  return (
    <Dialog open={open} onOpenChange={(state) => {
      if (!state) {
        cleanupCamera();
      }
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
            <div className="mt-4 flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={requestCameraAccess} 
                className="w-full"
                disabled={attemptingRetry}
              >
                {attemptingRetry ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tentando novamente...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                  </>
                )}
              </Button>
              
              {isMobile && (
                <div className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                  <strong>Dica:</strong> Em dispositivos móveis, certifique-se de que:
                  <ul className="list-disc pl-4 mt-1">
                    <li>As permissões de câmera estão habilitadas nas configurações do navegador</li>
                    <li>Feche outros aplicativos ou guias que possam estar usando a câmera</li>
                    <li>Tente usar o navegador Chrome ou Safari que têm melhor suporte para câmera</li>
                    <li>Se estiver no iOS, permita acesso à câmera nas configurações do Safari</li>
                  </ul>
                </div>
              )}
            </div>
          </Alert>
        ) : (
          <div className="relative" ref={qrReaderContainerRef}>
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
                      setInitAttempts(0);
                      setCameraPermission('pending');
                      requestCameraAccess();
                    }} 
                    variant="default"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={attemptingRetry}
                  >
                    {attemptingRetry ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Acessando...
                      </>
                    ) : (
                      "Permitir Acesso à Câmera"
                    )}
                  </Button>
                </div>
              )}
              
              {cameraPermission === 'granted' && scanning && videoStream && (
                <div className="camera-container" style={{ minHeight: "250px" }}>
                  <QrReader
                    key={`qr-reader-${activeCamera}-${Date.now()}`}
                    onResult={handleScan}
                    constraints={{ 
                      facingMode: activeCamera,
                      aspectRatio: 1,
                      width: { min: 320, ideal: isMobile ? 640 : 1280 },
                      height: { min: 320, ideal: isMobile ? 480 : 720 },
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
                </div>
              )}
              
              {cameraPermission === 'granted' && (!scanning || !videoStream) && (
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
