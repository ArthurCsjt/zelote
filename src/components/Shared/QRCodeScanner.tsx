// src/components/shared/QRCodeScanner.tsx
// VERSÃO FINAL - OTIMIZAÇÃO DE CENTRALIZAÇÃO E LAYOUT MOBILE

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

// ... (declaração global e interface permanecem iguais) ...

// ... (funções lockOrientation e unlockOrientation permanecem iguais) ...

export const QRCodeScanner = ({ open, onOpenChange, onScanSuccess }: QRCodeScannerProps) => {
  // ... (todos os hooks e funções internas como stopScanner, handleClose, etc., permanecem iguais) ...

  // O corpo do seu componente, com as funções, está perfeito.
  // A única mudança é no JSX retornado.

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/* MODIFICAÇÃO 1: Modal em tela cheia no mobile */}
      <DialogContent className="p-0 gap-0 w-full h-full sm:h-auto sm:max-w-md rounded-none sm:rounded-lg">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {error ? <CameraOff className="w-5 h-5 text-red-500" /> : '📷'}
            {error ? 'Erro na Câmera' : 'Escaneie o QR Code'}
          </DialogTitle>
          <button onClick={handleClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {!error && !isUnsupported ? (
            <div className="w-full">
              <div
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: '1 / 1' }}
              >
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                    <div className="text-white text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Iniciando câmera...</p>
                    </div>
                  </div>
                )}

                {/* MODIFICAÇÃO 2: A nova técnica de centralização do vídeo */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
                />

                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay e moldura (seu código já está perfeito) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div
                    className="border-4 border-white rounded-lg relative"
                    style={{
                      width: '250px',
                      height: '250px',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                    }}
                  >
                    {/* ... (cantos verdes) ... */}
                  </div>
                </div>
                
                {/* ... (resto do seu JSX permanece igual) ... */}
                
              </div>
            </div>
          ) : (
            // ... (seu código de erro permanece igual)
          )}
          
          {/* ... (resto do seu JSX permanece igual) ... */}
        </div>
      </DialogContent>
    </Dialog>
  );
};