import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Chromebook } from '@/types/database';
import { cn } from '@/lib/utils';

interface QRCodeStickerProps {
  item: Chromebook;
  className?: string;
}

export const QRCodeSticker: React.FC<QRCodeStickerProps> = ({ item, className }) => {
  // Dados encurtados para diminuir a densidade do QR Code e facilitar a leitura
  const qrData = JSON.stringify({
    i: item.chromebook_id,
    m: item.model,
    s: item.serial_number,
    p: item.patrimony_number,
  });

  return (
    <div
      className={cn(
        // Estilos de tela (Simulação do tamanho real)
        "p-1 border border-gray-300 flex flex-col items-center justify-between bg-white shadow-sm overflow-hidden",
        // Estilos de impressão: Quadrado perfeito (4x3cm), sem arredondamento, borda sólida fina para corte
        "print:w-[4cm] print:h-[3cm] print:p-1 print:border print:border-gray-400 print:rounded-none print:shadow-none print:break-inside-avoid print:bg-white print:text-black",
        className
      )}
      // Dimensões na tela proporcionais ao tamanho de impressão (4:3)
      style={{ width: '150px', height: '112px' }}
    >
      <div className="flex-shrink-0 mt-1">
        <QRCodeSVG
          value={qrData}
          // Tamanho 75px com margem interna para facilitar o foco
          size={75}
          level="M"
          includeMargin={true}
          bgColor="#FFFFFF"
          fgColor="#000000"
          style={{ width: '75px', height: '75px' }}
        />
      </div>

      <div className="flex flex-col items-center justify-center w-full min-h-0 leading-none">
        <h3 className="text-[11px] font-bold text-gray-900 truncate w-full print:text-black text-center">
          {item.chromebook_id}
        </h3>
        {item.serial_number && (
          <p className="text-[7px] text-gray-500 truncate w-full print:text-black/70 text-center mt-0.5">
            S/N: {item.serial_number}
          </p>
        )}
      </div>
    </div>
  );
};