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
        <Icon className={cn("h-6 w-6", iconColor)} />
        <h2 className="text-xl font-bold text-gray-800 dark:text-foreground">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground ml-9">
          {description}
        </p>
      )}
    </div>
  );
};