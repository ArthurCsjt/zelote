import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// Re-exportando os subcomponentes para manter a API familiar do shadcn/ui
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

interface GlassCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  // Adicione props específicas se necessário
}

/**
 * Um componente Card que aplica automaticamente o estilo 'glass-morphism'
 * para consistência visual em toda a aplicação.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "glass-card transition-all duration-300 hover:shadow-xl",
        className
      )}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";