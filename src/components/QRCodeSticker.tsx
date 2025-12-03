import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Chromebook } from '@/types/database';
import { cn } from '@/lib/utils';

interface QRCodeStickerProps {
  item: Chromebook;
  className?: string;
}

export const QRCodeSticker: React.FC<QRCodeStickerProps> = ({ item, className }) => {
  // Dados essenciais para o QR Code (JSON string)
  const qrData = JSON.stringify({
    id: item.chromebook_id,
    model: item.model,
    serial: item.serial_number,
    pat: item.patrimony_number,
  });

  return (
    <div
      className={cn(
        // Estilos de tela
        "p-2 border border-gray-300 rounded-md flex flex-col items-center text-center bg-white shadow-sm",
        // Estilos de impressão: Fundo branco, texto preto, borda tracejada, dimensões fixas
        "print:w-[5cm] print:h-[5.5cm] print:p-2 print:border-dashed print:border-gray-500 print:break-inside-avoid print:bg-white print:text-black",
        className
      )}
      // Adicionando dimensões fixas para a visualização em tela para simular o tamanho de impressão
      style={{ width: '100%', maxWidth: '190px', height: '208px' }}
    >
      <div className="flex-shrink-0">
        <QRCodeSVG
          value={qrData}
          // Tamanho otimizado para leitura confiável por câmeras (120px)
          size={120}
          level="H"
          includeMargin={false}
          bgColor="#FFFFFF"
          fgColor="#000000"
          style={{ width: '120px', height: '120px' }}
        />
      </div>

      <div className="mt-1 flex-1 flex flex-col justify-center min-h-0">
        <h3 className="text-sm font-bold text-gray-900 truncate w-full print:text-black">
          {item.chromebook_id}
        </h3>
        <p className="text-[9px] text-gray-600 leading-tight mt-0.5 truncate w-full print:text-black/80">
          S/N: {item.serial_number || 'N/A'}
        </p>
      </div>
    </div>
  );
};