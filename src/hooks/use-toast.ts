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
    // Removemos os estilos inline e confiamos no richColors do Sonner
  };

  switch (variant) {
    case 'destructive':
      // Usamos sonnerToast.error para destructive (Sonner usa a cor vermelha/destructive)
      return sonnerToast.error(title, options);
    case 'success':
      // Usamos sonnerToast.success para success (Sonner usa a cor verde/success)
      return sonnerToast.success(title, options);
    case 'info':
      // Usamos sonnerToast.info para info (Sonner usa a cor azul/info)
      return sonnerToast.info(title, options);
    case 'default':
    default:
      // Usamos sonnerToast para default (Sonner usa a cor padrão/neutra)
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