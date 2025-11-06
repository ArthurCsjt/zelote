import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

// Re-exportando os componentes do Card para uso fácil
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass-card", // Classe CSS global para o efeito
        "shadow-md", // Usando a nova classe de sombra
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCard.displayName = 'GlassCard';