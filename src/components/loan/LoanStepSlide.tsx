import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface LoanStepSlideProps {
  stepNumber: 1 | 2 | 3 | 4;
  title: string;
  icon: LucideIcon;
  accentColor: 'violet' | 'blue' | 'amber' | 'green';
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  children: React.ReactNode;
}

const colorClasses = {
  violet: {
    border: 'border-l-violet-500',
    bg: 'bg-white dark:bg-zinc-950',
    ring: 'ring-violet-500',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
  },
  blue: {
    border: 'border-l-blue-500',
    bg: 'bg-zinc-50 dark:bg-zinc-900/50',
    ring: 'ring-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  amber: {
    border: 'border-l-amber-500',
    bg: 'bg-violet-50/30 dark:bg-violet-950/20',
    ring: 'ring-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  green: {
    border: 'border-l-green-500',
    bg: 'bg-green-50/30 dark:bg-green-950/20',
    ring: 'ring-green-500',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
  },
};

export const LoanStepSlide: React.FC<LoanStepSlideProps> = ({
  stepNumber,
  title,
  icon: Icon,
  accentColor,
  isActive,
  isCompleted,
  isDisabled,
  children,
}) => {
  const colors = colorClasses[accentColor];

  return (
    <div
      className={cn(
        // Base - Full width slide
        "loan-slide flex-[0_0_100%] min-w-0 px-4 md:px-0",
        // Animation
        "transition-all duration-300 ease-out"
      )}
    >
      <div
        className={cn(
          // Neo-brutal card styling
          "neo-slide-card h-full",
          colors.bg,
          colors.border,
          // Active state
          isActive && !isDisabled && "neo-slide-card-active",
          isActive && colors.ring,
          // Disabled state
          isDisabled && "opacity-40 grayscale pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="neo-slide-header">
          <div className="flex items-center gap-3">
            <div className={cn(
              "neo-slide-icon",
              colors.iconBg
            )}>
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <span className="neo-slide-step-badge">Passo {stepNumber}</span>
              <h3 className="neo-slide-title">{title}</h3>
            </div>
          </div>
          {isCompleted && (
            <div className="neo-slide-completed-badge">
              ✓ Completo
            </div>
          )}
        </div>

        {/* Content */}
        <div className="neo-slide-content">
          {children}
        </div>
      </div>
    </div>
  );
};
