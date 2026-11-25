import React from 'react';
import { Loader2 } from 'lucide-react';

interface FullScreenLoaderProps {
  message?: string;
}

/**
 * Tela de carregamento centralizada em viewport inteira com identidade Neo-Brutalist do Zelote.
 */
export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Carregando...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[100dvh] w-full flex items-center justify-center bg-background text-foreground relative overflow-hidden p-4"
    >
      {/* Grade sutil de fundo */}
      <div
        className="absolute inset-0 neo-brutal-grid opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{ backgroundSize: '60px 60px' }}
      />

      {/* Card centralizado */}
      <div className="relative z-10 w-full max-w-[280px] bg-card border-3 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)] p-6 flex flex-col items-center gap-5 text-center">
        {/* Badge da marca sobre fundo primário para contraste garantido */}
        <div className="bg-primary border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] px-4 py-2">
          <img
            src="/logo-header.svg"
            alt="Zelote"
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Indicador de progresso */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          <Loader2 className="h-7 w-7 animate-spin motion-reduce:animate-none text-primary stroke-[2.5]" />
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
