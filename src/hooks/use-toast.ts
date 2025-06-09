
import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const toast = ({ title, description, variant = "default" }: ToastOptions) => {
  if (variant === "destructive") {
    return sonnerToast.error(title || description || "Erro");
  }
  
  if (title && description) {
    return sonnerToast(title, { description });
  }
  
  return sonnerToast(title || description || "Notificação");
};

export const useToast = () => ({
  toast,
  dismiss: (id?: string | number) => {
    if (id) {
      sonnerToast.dismiss(id);
    } else {
      sonnerToast.dismiss();
    }
  },
});
