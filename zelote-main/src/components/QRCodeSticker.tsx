import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Chromebook } from '@/types/database';
import { cn } from '@/lib/utils';

interface QRCodeStickerProps {
  item: Chromebook;
  className?: string;
}

export const QRCodeSticker: React.FC<QRCodeStickerProps> = ({ item, className }) => {
  // Para leitura ultra-rápida, usamos apenas o ID no QR Code. 
  // O sistema busca o restante dos dados no banco ao escanear.
  const qrData = item.chromebook_id;

  return (
    <div
      className={cn(
        // Estilos de tela (Simulação do tamanho real)
        "p-2 border border-gray-300 flex flex-row items-center justify-between bg-white shadow-sm overflow-hidden gap-2",
        // Estilos de impressão: 4x3cm, sem arredondamento, layout horizontal
        "print:w-[4cm] print:h-[3cm] print:p-2 print:border print:border-gray-400 print:rounded-none print:shadow-none print:break-inside-avoid print:bg-white print:text-black",
        className
      )}
      // Dimensões na tela proporcionais ao tamanho de impressão (4:3)
      style={{ width: '160px', height: '120px' }}
      data-sticker-id={item.chromebook_id}
    >
      {/* Lado Esquerdo: QR Code */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <QRCodeSVG
          value={qrData}
          size={85}
          level="M"
          includeMargin={false}
          bgColor="#FFFFFF"
          fgColor="#000000"
          style={{ width: '85px', height: '85px' }}
        />
      </div>

      {/* Lado Direito: Informações Texto */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 text-center">
        <h3 className="text-[14px] font-black text-gray-900 leading-tight print:text-black">
          {item.chromebook_id}
        </h3>
        {item.serial_number && (
          <p className="text-[7px] text-gray-500 font-bold mt-1 break-all print:text-black/70">
            {item.serial_number}
          </p>
        )}
      </div>
    </div>
  );
};