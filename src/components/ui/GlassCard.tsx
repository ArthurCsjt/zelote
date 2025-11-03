import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

interface GlassCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  // Adicione props específicas se necessário
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "glass-card", // Classe CSS definida em index.css
        "rounded-lg p-0 border-border", // Usando border-border
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
);
GlassCard.displayName = "GlassCard";

// Exportando os subcomponentes para manter a compatibilidade
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };