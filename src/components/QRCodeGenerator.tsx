
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size = 200 }) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <QRCodeSVG 
        value={value} 
        size={size}
        level="M"
        includeMargin={true}
        className="border border-gray-200 rounded-lg"
      />
      <p className="text-sm text-gray-600 font-mono">{value}</p>
    </div>
  );
};

export default QRCodeGenerator;
