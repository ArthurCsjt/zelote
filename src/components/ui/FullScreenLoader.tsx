import React from 'react';
import { Loader2 } from 'lucide-react';

interface FullScreenLoaderProps {
  message?: string;
}

/**
 * Tela de carregamento discreta e centralizada em viewport inteira.
 */
export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Carregando página...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center gap-3 bg-background text-foreground p-4"
    >
      <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none text-primary/80 stroke-[2]" />
      <span className="text-xs font-medium text-muted-foreground tracking-wide">
        {message}
      </span>
    </div>
  );
};
