import React from 'react';
import { ReturnForm } from './ReturnForm';
import { Button } from './ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface ReturnWrapperProps {
  onBack: () => void;
  initialChromebookId?: string;
  onReturnSuccess: () => void;
}

export const ReturnWrapper: React.FC<ReturnWrapperProps> = ({ onBack, initialChromebookId, onReturnSuccess }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <RotateCcw className="h-6 w-6 text-menu-amber" />
          Registrar Devolução
        </h1>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Menu
        </Button>
      </div>
      <ReturnForm 
        initialChromebookId={initialChromebookId} 
        onReturnSuccess={onReturnSuccess} 
      />
    </div>
  );
};