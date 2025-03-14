
import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "./ui/use-toast";
import { Loader2, ScanLine } from "lucide-react";

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

  // Check if device has a flash/torch
  const checkTorchAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length > 0) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: cameras[0].deviceId }
        });
        
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
        
        setHasFlash(!!capabilities.torch);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Error checking torch availability:", err);
      setHasFlash(false);
    }
  };

  const toggleTorch = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      const track = stream.getVideoTracks()[0];
      
      // Toggle torch with type assertion
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as ExtendedMediaTrackConstraintSet]
      });
      
      setTorchEnabled(!torchEnabled);
      
      // Don't stop the stream as it's being used by QrReader
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
    setError("Erro ao acessar a câmera. Verifique as permissões.");
    setScanning(false);
  };

  // When dialog opens, start scanning and check for torch
  const handleDialogOpen = (open: boolean) => {
    if (open) {
      setScanning(true);
      setError(null);
      checkTorchAvailability();
    } else {
      setScanning(false);
      // If torch was enabled, disable it when closing
      if (torchEnabled) {
        setTorchEnabled(false);
      }
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escaneie o QR Code</DialogTitle>
        </DialogHeader>
        
        {error ? (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="relative">
            {scanning && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2">
                  <ScanLine className="w-full h-1 text-green-500 animate-pulse" />
                </div>
              </div>
            )}
            
            <div className="w-full max-w-sm mx-auto rounded-md overflow-hidden shadow-inner bg-black">
              {scanning ? (
                <QrReader
                  onResult={handleScan}
                  constraints={{ 
                    facingMode: 'environment',
                    aspectRatio: 1,
                    width: { min: 360, ideal: 720 },
                    height: { min: 360, ideal: 720 },
                  }}
                  videoId="qr-video-element"
                  className="w-full"
                  scanDelay={300}
                  videoStyle={{ 
                    objectFit: 'cover', 
                    width: '100%',
                    height: '100%'
                  }}
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-800">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              <div className="border-4 border-white opacity-70 absolute inset-0 m-auto w-2/3 h-2/3 z-20 pointer-events-none"></div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex sm:justify-between">
          <div className="flex gap-2">
            {hasFlash && (
              <Button 
                type="button" 
                onClick={toggleTorch}
                variant={torchEnabled ? "default" : "outline"}
              >
                {torchEnabled ? "Desligar Lanterna" : "Ligar Lanterna"}
              </Button>
            )}
          </div>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
