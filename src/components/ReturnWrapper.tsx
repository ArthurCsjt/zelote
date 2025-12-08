import React from 'react';
import { ReturnForm } from './ReturnForm';
import { RotateCcw } from 'lucide-react';
import { SectionHeader } from './Shared/SectionHeader';

interface ReturnWrapperProps {
  onBack: () => void;
  initialChromebookId?: string;
  onReturnSuccess: () => void;
}

export const ReturnWrapper: React.FC<ReturnWrapperProps> = ({ onBack, initialChromebookId, onReturnSuccess }) => {
  return (
    <div className="min-h-screen relative py-[30px]">
      { /* Background grid pattern */}
      <div className="absolute inset-0 -z-10 bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto p-4 max-w-5xl relative z-10">
        <div className="mb-8 text-center p-6 border-4 border-black dark:border-white bg-amber-300 dark:bg-amber-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
          <SectionHeader
            title="REGISTRAR DEVOLUÇÃO"
            description="DEVOLUÇÃO DE EQUIPAMENTOS E ACESSÓRIOS"
            icon={RotateCcw}
            iconColor="text-black dark:text-white"
            className="flex flex-col items-center uppercase tracking-tight font-black"
          />
        </div>

        <div className="p-6 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
          <ReturnForm
            initialChromebookId={initialChromebookId}
            onReturnSuccess={onReturnSuccess}
          />
        </div>
      </div>
    </div>
  );
};