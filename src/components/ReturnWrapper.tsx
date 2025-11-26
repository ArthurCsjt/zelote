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
      <div className="flex items-center justify-center mb-4">
        {/* CORREÇÃO: Usando text-foreground para garantir alto contraste no modo escuro */}
        <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
          <RotateCcw className="h-7 w-7 text-menu-amber" />
          Registrar Devolução
        </h1>
      </div>
      <ReturnForm 
        initialChromebookId={initialChromebookId} 
        onReturnSuccess={onReturnSuccess} 
      />
    </div>
  );
};