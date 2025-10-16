import * as React from "react"
import { toast as sonnerToast } from 'sonner';

// Tipos simplificados para compatibilidade
type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'info';
  duration?: number;
  id?: string | number; // Adicionando ID para controle de duplicação
};

// Função toast que mapeia para o Sonner
function toast({ title, description, variant = 'default', duration = 4000, id }: ToastProps) {
  const options: any = {
    description: description,
    duration: duration,
    id: id, // Passa o ID para o Sonner
    // Mapeamento de variantes para cores ricas do Sonner
    style: {
      backgroundColor: variant === 'destructive' ? 'hsl(0 84.2% 60.2%)' : undefined,
      color: variant === 'destructive' ? 'white' : undefined,
    }
  };

  switch (variant) {
    case 'destructive':
      return sonnerToast.error(title, options);
    case 'success':
      return sonnerToast.success(title, options);
    case 'info':
      return sonnerToast.info(title, options);
    case 'default':
    default:
      return sonnerToast(title, options);
  }
}

// Hook de compatibilidade (não precisa de estado interno, apenas retorna a função toast)
function useToast() {
  // Retorna a função toast e um objeto vazio para compatibilidade com a desestruturação
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [], // Mock para evitar erros de desestruturação
  }
}

const dismiss = sonnerToast.dismiss;

export { useToast, toast, dismiss }