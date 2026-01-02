import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  className,
}) => {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-3">
        {/* Ícone maior (h-8 w-8) */}
        <Icon className={cn("h-8 w-8", iconColor)} />
        {/* Título maior (text-2xl) */}
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800 dark:text-foreground drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-11">
          {description}
        </p>
      )}
    </div>
  );
};