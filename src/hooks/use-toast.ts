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
    // Remove custom styles here, relying on Sonner's richColors and theme="system"
  };

  switch (variant) {
    case 'destructive':
      // Mapeia 'destructive' para 'error' do Sonner
      return sonnerToast.error(title, options);
    case 'success':
      return sonnerToast.success(title, options);
    case 'info':
      return sonnerToast.info(title, options);
    case 'default':
    default:
      // Mapeia 'default' para 'message' do Sonner
      return sonnerToast.message(title, options);
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