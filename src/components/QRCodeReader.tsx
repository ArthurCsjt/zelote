// src/components/QRCodeReader.tsx
// SOLUÇÃO DEFINITIVA - html5-qrcode + Correções PWA
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "@/hooks/use-toast";
import { CameraOff, Loader2, Keyboard } from "lucide-react";

interface QRCodeReaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}

const QR_SCANNER_ELEMENT_ID = 'qr-code-scanner-container';

export function QRCodeReader({ open, onOpenChange, onScan }: QRCodeReaderProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasCamera, setHasCamera] = useState(true);

  // Detectar iOS para mensagens de erro específicas
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Iniciar e parar o scanner
  useEffect(() => {
    let isMounted = true;
    
    const cleanupScanner = () => {
      if (scannerRef.current) {
        // Check if scanner is running before attempting to stop
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            if (isMounted) {
              console.log("Scanner parado com sucesso.");
              scannerRef.current = null; // Clear reference after successful stop
            }
          }).catch(err => {
            if (isMounted) {
              console.error("Falha ao parar scanner no cleanup.", err);
              // We still clear the reference even if stop fails, to prevent future attempts
              scannerRef.current = null; 
            }
          });
        } else {
             // If not scanning, just clear the reference if it exists
             scannerRef.current = null;
        }
      }
    };

    if (open) {
      // Only start scanning if the dialog is opening
      startScanning();
    }

    // Cleanup function runs when component unmounts or 'open' changes to false
    return () => {
      isMounted = false;
      cleanupScanner();
    };
  }, [open]); // Dependency array only needs 'open'

  const startScanning = async () => {
    setIsLoading(true);
    setError('');
    setShowManualInput(false); 

    // Verificar se tem câmera disponível
    try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
            setHasCamera(false);
            setError('Nenhuma câmera encontrada. Use a entrada manual.');
            setShowManualInput(true);
            setIsLoading(false);
            return;
        }
        setHasCamera(true);
    } catch (err) {
        console.error('Erro ao verificar câmeras:', err);
        setHasCamera(false);
        setError('Erro ao acessar permissões da câmera. Use a entrada manual.');
        setShowManualInput(true);
        setIsLoading(false);
        return;
    }


    const scanner = new Html5Qrcode(QR_SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    const onScanSuccess = (decodedText: string) => {
      // Stop scanning immediately upon success
      if (scannerRef.current) {
        scannerRef.current.stop().catch(e => console.error("Error stopping scanner after success:", e));
        scannerRef.current = null;
      }
      
      onScan(decodedText);
      toast({
        title: 'QR Code lido!',
        description: `Código: ${decodedText}`,
      });
      onOpenChange(false);
    };

    const onScanFailure = (errorMessage: string) => {
      // Erro silencioso, normal durante o scan
    };

    try {
      await scanner.start(
        { facingMode: "environment" }, // Pedido simples pela câmera traseira
        config,
        onScanSuccess,
        onScanFailure
      );
      setIsLoading(false);
    } catch (err: any) {
      console.error('Erro ao iniciar scanner:', err);
      setIsLoading(false);
      let errorMsg = `Erro ao acessar câmera: ${err.message || 'Desconhecido'}`;
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Permissão de câmera negada. Por favor, permita o acesso nas configurações do navegador.';
      } else if (isIOS || isSafari) {
        errorMsg = 'No Safari/iOS, certifique-se de que o site está sendo acessado via HTTPS e que a permissão de câmera foi concedida.';
      }
      setError(errorMsg);
      setShowManualInput(true);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      toast({
        title: 'Código inserido!',
        description: `Código: ${manualCode}`,
      });
      setManualCode('');
      onOpenChange(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setShowManualInput(false);
    startScanning();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear QR Code</DialogTitle>
        </DialogHeader>
        
        {!showManualInput && !error && (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <div id={QR_SCANNER_ELEMENT_ID} className="w-full min-h-[300px] rounded-md overflow-hidden bg-gray-200" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start gap-3">
              <CameraOff className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Erro de Câmera</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {showManualInput && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Keyboard className="h-4 w-4" />
              <span className="text-sm">Ou digite o código manualmente</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-code">Código do Chromebook</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-code"
                  placeholder="Digite o código"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
                  autoFocus
                />
                <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>OK</Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          {error && hasCamera && (
            <Button variant="outline" onClick={handleRetry} className="w-full sm:w-auto">Tentar Novamente</Button>
          )}
          {!showManualInput && !error && (
            <Button variant="outline" onClick={() => setShowManualInput(true)} className="w-full sm:w-auto">
              <Keyboard className="h-4 w-4 mr-2" />
              Entrada Manual
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}