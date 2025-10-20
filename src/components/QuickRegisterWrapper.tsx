import React from 'react';
import { IntelligentChromebookForm } from './IntelligentChromebookForm';
import { Button } from './ui/button';
import { ArrowLeft, QrCode } from 'lucide-react';

interface QuickRegisterWrapperProps {
  onBack: () => void;
  onRegistrationSuccess: (newChromebook: any) => void;
}

export const QuickRegisterWrapper: React.FC<QuickRegisterWrapperProps> = ({ onBack, onRegistrationSuccess }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <QrCode className="h-6 w-6 text-menu-teal" />
          Re-Cadastro Rápido (QR Code)
        </h1>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Menu
        </Button>
      </div>
      <IntelligentChromebookForm onRegistrationSuccess={onRegistrationSuccess} />
    </div>
  );
};