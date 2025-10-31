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
        "p-2 border border-gray-300 rounded-md flex flex-col items-center text-center bg-white shadow-sm",
        "w-[150px] h-[180px] print:w-[4cm] print:h-[4.5cm] print:p-1 print:border-dashed print:border-gray-500 print:break-inside-avoid",
        className
      )}
    >
      <div className="flex-shrink-0">
        <QRCodeSVG 
          value={qrData}
          size={100}
          level="H"
          includeMargin={false}
          bgColor="#FFFFFF"
          fgColor="#000000"
          style={{ width: '100px', height: '100px' }}
        />
      </div>
      
      <div className="mt-1 flex-1 flex flex-col justify-center min-h-0">
        <h3 className="text-sm font-bold text-gray-900 truncate w-full">
          {item.chromebook_id}
        </h3>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate w-full">
          {item.model}
        </p>
        <p className="text-[9px] text-gray-600 leading-tight mt-0.5 truncate w-full">
          S/N: {item.serial_number || 'N/A'}
        </p>
      </div>
    </div>
  );
};