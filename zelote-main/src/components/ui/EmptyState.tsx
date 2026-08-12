import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: 'purple' | 'amber' | 'blue' | 'gray' | 'green' | 'red';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const colorMap = {
  purple: {
    iconBg: 'bg-purple-300 dark:bg-purple-700',
    border: 'border-purple-500',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(168,85,247,0.3)]',
  },
  amber: {
    iconBg: 'bg-amber-300 dark:bg-amber-700',
    border: 'border-amber-500',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(245,158,11,0.3)]',
  },
  blue: {
    iconBg: 'bg-blue-300 dark:bg-blue-700',
    border: 'border-blue-500',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)]',
  },
  gray: {
    iconBg: 'bg-gray-300 dark:bg-gray-700',
    border: 'border-gray-500',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(107,114,128,0.3)]',
  },
  green: {
    iconBg: 'bg-green-300 dark:bg-green-700',
    border: 'border-green-500',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(34,197,94,0.3)]',
  },
  red: {
    iconBg: 'bg-red-300 dark:bg-red-700',
    border: 'border-red-500',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(239,68,68,0.3)]',
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  color = 'gray',
  action,
  className,
}: EmptyStateProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center py-12 px-6",
        "border-4 border-black dark:border-white bg-white dark:bg-zinc-900",
        "neo-pattern-dots",
        colors.shadow,
        className
      )}
    >
      {/* Icon Box */}
      <div
        className={cn(
          "p-4 border-4 border-black dark:border-white mb-6",
          "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]",
          colors.iconBg
        )}
      >
        <Icon className="h-10 w-10 text-black dark:text-white" strokeWidth={2.5} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-2 text-center">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground font-medium text-center max-w-sm">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-6 neo-btn bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}