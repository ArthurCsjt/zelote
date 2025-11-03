import * as React from "react"
import { toast as sonnerToast } from 'sonner';

// Tipos simplificados para compatibilidade
type ToastVariant = 'default' | 'destructive' | 'success' | 'info';

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
};

// Função toast que mapeia para o Sonner
function toast({ title, description, variant = 'default', duration = 4000 }: ToastProps) {
  const options: any = {
    description: description,
    duration: duration,
    // Sonner já lida com richColors, mas podemos forçar estilos para 'destructive'
    style: {
      // Estilo para Destructive (vermelho)
      ...(variant === 'destructive' && {
        // Usando a cor Destructive do Tailwind (0 84.2% 60.2%)
        backgroundColor: 'hsl(0 84.2% 60.2%)', 
        color: 'white',
        border: '1px solid hsl(0 84.2% 60.2%)',
      }),
      // Estilo para Success (verde)
      ...(variant === 'success' && {
        // Usando a cor menu-green (142 76% 36%)
        backgroundColor: 'hsl(142 76% 36%)', 
        color: 'white',
        border: '1px solid hsl(142 76% 36%)',
      }),
    }
  };

  switch (variant) {
    case 'destructive':
      // Usamos sonnerToast.error para destructive
      return sonnerToast.error(title, options);
    case 'success':
      // Usamos sonnerToast.success para success
      return sonnerToast.success(title, options);
    case 'info':
      // Usamos sonnerToast.info para info
      return sonnerToast.info(title, options);
    case 'default':
    default:
      // Usamos sonnerToast para default
      return sonnerToast(title, options);
  }
}

// Hook de compatibilidade
function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [], 
  }
}

export { useToast, toast }