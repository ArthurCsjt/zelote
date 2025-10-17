import * as React from "react"
import { toast as sonnerToast } from 'sonner';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'; // Importando ícones

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
  
  let icon: React.ReactNode;
  let className = '';
  
  switch (variant) {
    case 'destructive':
      icon = <XCircle className="h-5 w-5 text-white" />;
      className = 'bg-destructive text-destructive-foreground border-destructive/50';
      break;
    case 'success':
      icon = <CheckCircle className="h-5 w-5 text-green-600" />;
      className = 'bg-white text-foreground border-green-200';
      break;
    case 'info':
      icon = <Info className="h-5 w-5 text-blue-600" />;
      className = 'bg-white text-foreground border-blue-200';
      break;
    case 'default':
    default:
      icon = <Info className="h-5 w-5 text-gray-600" />;
      className = 'bg-white text-foreground border-gray-200';
      break;
  }
  
  const options: any = {
    description: description,
    duration: duration,
    id: id, // Passa o ID para o Sonner
    icon: icon,
    className: className,
    // Forçando o estilo para destructive para garantir que o texto seja branco
    style: variant === 'destructive' ? { backgroundColor: 'hsl(0 84.2% 60.2%)', color: 'white' } : undefined,
  };

  // Usamos sonnerToast.custom para ter controle total sobre o estilo e ícone
  return sonnerToast(title, options);
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