// src/components/QRCodeReader.tsx
// SOLUÇÃO DEFINITIVA - html5-qrcode + Correções PWA + HUD Contador em Tempo Real
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "@/hooks/use-toast";
import { CameraOff, Loader2, Keyboard, QrCode, CheckCircle2, AlertTriangle, Check } from "lucide-react";
import { soundEffects } from "@/utils/audioFeedback";
import { cn } from "@/lib/utils";

interface QRCodeReaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
  initialCount?: number;
  existingCodes?: string[];
  title?: string;
}

const QR_SCANNER_ELEMENT_ID = 'qr-code-scanner-container';

export function QRCodeReader({
  open,
  onOpenChange,
  onScan,
  initialCount = 0,
  existingCodes = [],
  title = "Escanear QR Code"
}: QRCodeReaderProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasCamera, setHasCamera] = useState(true);

  // Histórico de escaneamento da sessão
  const [sessionScannedList, setSessionScannedList] = useState<string[]>([]);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const scannedCodesSetRef = useRef<Set<string>>(new Set());
  const [lastScannedText, setLastScannedText] = useState<string>('');
  const [alreadyScannedAlert, setAlreadyScannedAlert] = useState<string>('');
  const [justScannedAnim, setJustScannedAnim] = useState(false);

  // Detectar iOS para mensagens de erro específicas
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Iniciar e parar o scanner
  useEffect(() => {
    let isMounted = true;

    const cleanupScanner = () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            if (isMounted) {
              scannerRef.current = null;
            }
          }).catch(() => {
            if (isMounted) {
              scannerRef.current = null;
            }
          });
        } else {
          scannerRef.current = null;
        }
      }
    };

    if (open) {
      startScanning();
    } else {
      setSessionScannedList([]);
    }

    return () => {
      isMounted = false;
      cleanupScanner();
    };
  }, [open]);

  const startScanning = async () => {
    setIsLoading(true);
    setError('');
    setShowManualInput(false);
    lastScannedCodeRef.current = '';
    lastScannedTimeRef.current = 0;
    scannedCodesSetRef.current.clear();
    
    // Inicializa o conjunto com os códigos já existentes na lista para evitar duplicatas
    if (existingCodes && existingCodes.length > 0) {
      existingCodes.forEach(code => scannedCodesSetRef.current.add(code.trim()));
    }
    
    setSessionScannedList([]);
    setLastScannedText('');
    setAlreadyScannedAlert('');

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
      fps: 12,
      qrbox: { width: 250, height: 250 },
    };

    const onScanSuccess = (decodedText: string) => {
      const now = Date.now();
      const cleanCode = decodedText.trim();
      const isAlreadyInSession = scannedCodesSetRef.current.has(cleanCode);
      const isSameCode = cleanCode === lastScannedCodeRef.current;
      const timeSinceLastScan = now - lastScannedTimeRef.current;

      // Se o QR Code já foi lido anteriormente
      if (isAlreadyInSession || isSameCode) {
        if (timeSinceLastScan < 1800) {
          return;
        }

        lastScannedTimeRef.current = now;
        setAlreadyScannedAlert(cleanCode);

        // Feedback sonoro e vibratório de aviso/repetido
        soundEffects.triggerWarningFeedback();

        toast({
          title: '⚠️ Já foi lido!',
          description: `O código ${cleanCode} já está registrado.`,
          variant: 'destructive',
          duration: 2000,
        });

        return;
      }

      // NOVO CÓDIGO LIDO COM SUCESSO:
      scannedCodesSetRef.current.add(cleanCode);
      lastScannedCodeRef.current = cleanCode;
      lastScannedTimeRef.current = now;
      setLastScannedText(cleanCode);
      setAlreadyScannedAlert('');
      
      setSessionScannedList(prev => [cleanCode, ...prev]);

      // Efeito de animação do contador
      setJustScannedAnim(true);
      setTimeout(() => setJustScannedAnim(false), 600);

      // Feedback sonoro (Beep) e háptico (vibração) de sucesso
      soundEffects.triggerSuccessFeedback();

      // Envia os dados lidos para o componente pai
      onScan(cleanCode);
      toast({
        title: '✓ QR Code lido!',
        description: `Código: ${cleanCode}`,
        variant: 'default',
        duration: 2000,
      });
    };

    const onScanFailure = () => {
      // Erro silencioso durante a busca por frames
    };

    try {
      await scanner.start(
        { facingMode: "environment" },
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
      const cleanCode = manualCode.trim();
      scannedCodesSetRef.current.add(cleanCode);
      setSessionScannedList(prev => [cleanCode, ...prev]);
      setLastScannedText(cleanCode);
      setAlreadyScannedAlert('');
      
      onScan(cleanCode);
      toast({
        title: 'Código inserido!',
        description: `Código: ${cleanCode}`,
      });
      setManualCode('');
    }
  };

  const handleRetry = () => {
    setError('');
    setShowManualInput(false);
    startScanning();
  };

  const totalCount = initialCount + sessionScannedList.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-950 p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {title}
            </DialogTitle>
            <span className="text-[11px] bg-green-500/10 text-green-700 dark:text-green-400 font-black uppercase px-2.5 py-0.5 border-2 border-green-600/40">
              Leitura Contínua
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Aponte a câmera para os QR Codes sucessivamente sem fechar o leitor.
          </p>
        </DialogHeader>

        {!showManualInput && !error && (
          <div className="relative border-4 border-black dark:border-white bg-black overflow-hidden shadow-[4px_4px_0px_0px_#000]">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
                <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                <span className="text-xs text-white font-bold uppercase tracking-wider">Iniciando câmera...</span>
              </div>
            )}

            {/* OVERLAY SUPERIOR: STATUS DO ÚLTIMO LIDO + CONTADOR EM TEMPO REAL */}
            <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between gap-2 pointer-events-none">
              {/* Lado Esquerdo: Último Lido / Alerta */}
              <div className="flex-1 min-w-0">
                {alreadyScannedAlert ? (
                  <div className="bg-amber-400 text-black text-[11px] font-black px-2.5 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 animate-bounce">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate uppercase">JÁ LIDO: {alreadyScannedAlert}</span>
                  </div>
                ) : lastScannedText ? (
                  <div className="bg-green-500 text-white text-[11px] font-black px-2.5 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 animate-in slide-in-from-top-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate uppercase">LIDO: {lastScannedText}</span>
                  </div>
                ) : (
                  <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 border border-white/30 flex items-center gap-1">
                    <QrCode className="h-3 w-3 animate-pulse" />
                    <span>Aguardando QR Code...</span>
                  </div>
                )}
              </div>

              {/* Lado Direito: BADGE CONTADOR DE QR CODES (HUD) - mostra apenas leituras da sessão atual */}
              <div
                className={cn(
                  "shrink-0 bg-blue-600 text-white border-2 border-black font-black shadow-[3px_3px_0px_0px_#000]",
                  "px-3 py-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide transition-all duration-300",
                  justScannedAnim && "scale-110 bg-green-500 shadow-[4px_4px_0px_0px_#000]"
                )}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>
                  <strong>{sessionScannedList.length}</strong> {sessionScannedList.length === 1 ? 'LIDO' : 'LIDOS'}
                </span>
              </div>
            </div>

            {/* HUD VIEWFINDER COM 4 PONTAS ULTRA DESTACADAS */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div
                className={cn(
                  "relative w-[230px] h-[230px] sm:w-[250px] sm:h-[250px] transition-all duration-200",
                  justScannedAnim && "scale-105"
                )}
              >
                {/* 1. CANTO SUPERIOR ESQUERDO */}
                <div
                  className={cn(
                    "absolute -top-1 -left-1 w-9 h-9 border-t-[6px] border-l-[6px] transition-all duration-200",
                    justScannedAnim
                      ? "border-green-400 drop-shadow-[0_0_18px_#22c55e]"
                      : alreadyScannedAlert
                      ? "border-amber-400 drop-shadow-[0_0_18px_#f59e0b]"
                      : "border-white/90 drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]"
                  )}
                />

                {/* 2. CANTO SUPERIOR DIREITO */}
                <div
                  className={cn(
                    "absolute -top-1 -right-1 w-9 h-9 border-t-[6px] border-r-[6px] transition-all duration-200",
                    justScannedAnim
                      ? "border-green-400 drop-shadow-[0_0_18px_#22c55e]"
                      : alreadyScannedAlert
                      ? "border-amber-400 drop-shadow-[0_0_18px_#f59e0b]"
                      : "border-white/90 drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]"
                  )}
                />

                {/* 3. CANTO INFERIOR ESQUERDO */}
                <div
                  className={cn(
                    "absolute -bottom-1 -left-1 w-9 h-9 border-b-[6px] border-l-[6px] transition-all duration-200",
                    justScannedAnim
                      ? "border-green-400 drop-shadow-[0_0_18px_#22c55e]"
                      : alreadyScannedAlert
                      ? "border-amber-400 drop-shadow-[0_0_18px_#f59e0b]"
                      : "border-white/90 drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]"
                  )}
                />

                {/* 4. CANTO INFERIOR DIREITO */}
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-9 h-9 border-b-[6px] border-r-[6px] transition-all duration-200",
                    justScannedAnim
                      ? "border-green-400 drop-shadow-[0_0_18px_#22c55e]"
                      : alreadyScannedAlert
                      ? "border-amber-400 drop-shadow-[0_0_18px_#f59e0b]"
                      : "border-white/90 drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]"
                  )}
                />

                {/* FLASH DE SUCESSO / LEITURA NO CENTRO DA MIRA */}
                {justScannedAnim && (
                  <div className="absolute inset-0 bg-green-500/25 border-2 border-green-400 shadow-[0_0_30px_#22c55e,inset_0_0_20px_#22c55e] flex items-center justify-center animate-in zoom-in-75 duration-200">
                    <div className="bg-green-500 text-black p-3 rounded-full border-2 border-black shadow-[0_0_20px_#22c55e]">
                      <Check className="h-8 w-8 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CONTAINER DA CÂMERA */}
            <div id={QR_SCANNER_ELEMENT_ID} className="w-full min-h-[290px] sm:min-h-[320px] bg-zinc-900" />

            {/* OVERLAY INFERIOR: HISTÓRICO VISUAL DOS ÚLTIMOS LIDOS NA SESSÃO */}
            {sessionScannedList.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 z-10 bg-black/80 backdrop-blur-sm p-2 border-2 border-white/40 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-black uppercase text-zinc-400 shrink-0">Sessão:</span>
                <div className="flex items-center gap-1.5">
                  {sessionScannedList.map((code, idx) => (
                    <span
                      key={code + idx}
                      className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 border text-white shrink-0",
                        idx === 0
                          ? "bg-green-600 border-white shadow-[1px_1px_0px_0px_#fff]"
                          : "bg-zinc-800 border-zinc-600 opacity-80"
                      )}
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-none">
            <div className="flex items-start gap-3">
              <CameraOff className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-destructive">Erro de Câmera</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {showManualInput && (
          <div className="space-y-4 p-4 border-2 border-black dark:border-white bg-zinc-50 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Keyboard className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase">Entrada Manual de Código</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-code" className="text-xs font-black uppercase">Código do Chromebook (Ex: CHR025)</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-code"
                  placeholder="Ex: CHR001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
                  className="font-bold border-2 border-black dark:border-white"
                  autoFocus
                />
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualCode.trim()}
                  className="neo-btn bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          {error && hasCamera && (
            <Button
              variant="outline"
              onClick={handleRetry}
              className="w-full sm:w-auto neo-btn font-bold uppercase text-xs"
            >
              Tentar Novamente
            </Button>
          )}

          {!showManualInput && !error && (
            <Button
              variant="outline"
              onClick={() => setShowManualInput(true)}
              className="w-full sm:w-auto neo-btn font-bold uppercase text-xs border-2 border-black dark:border-white"
            >
              <Keyboard className="h-3.5 w-3.5 mr-1.5" />
              Digitar Código
            </Button>
          )}

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto neo-btn bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs px-5 shadow-[3px_3px_0px_0px_#000]"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Concluir Leitura ({totalCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}