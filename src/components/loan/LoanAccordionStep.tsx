import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Check, ChevronDown } from 'lucide-react';

interface LoanAccordionStepProps {
  stepNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor: 'violet' | 'blue' | 'amber' | 'green';
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const colorConfig = {
  violet: {
    accent: 'bg-violet-500',
    accentDark: 'bg-violet-600',
    border: 'border-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    gradient: 'from-violet-500/10 to-transparent',
  },
  blue: {
    accent: 'bg-blue-500',
    accentDark: 'bg-blue-600',
    border: 'border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    gradient: 'from-blue-500/10 to-transparent',
  },
  amber: {
    accent: 'bg-amber-500',
    accentDark: 'bg-amber-600',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    gradient: 'from-amber-500/10 to-transparent',
  },
  green: {
    accent: 'bg-green-500',
    accentDark: 'bg-green-600',
    border: 'border-green-500',
    text: 'text-green-600 dark:text-green-400',
    glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]',
    gradient: 'from-green-500/10 to-transparent',
  },
};

export const LoanAccordionStep: React.FC<LoanAccordionStepProps> = ({
  stepNumber,
  title,
  subtitle,
  icon: Icon,
  accentColor,
  isActive,
  isCompleted,
  isDisabled,
  onClick,
  children,
}) => {
  const colors = colorConfig[accentColor];
  
  return (
    <div 
      className={cn(
        "accordion-step-wrapper",
        isActive && "accordion-step-active",
        isDisabled && "accordion-step-disabled"
      )}
      style={{
        // 3D stacking effect - each card has slight offset
        zIndex: isActive ? 50 : (4 - stepNumber) * 10,
      }}
    >
      {/* Card Container with 3D Transform */}
      <div
        className={cn(
          "accordion-step-card",
          "group relative overflow-hidden",
          // Base styles
          "bg-card border-2 border-border",
          "transition-all duration-500 ease-out",
          // Active state - elevated with glow
          isActive && [
            "accordion-step-card-active",
            colors.border,
            colors.glow,
            "border-3",
          ],
          // Completed state
          isCompleted && !isActive && "border-green-500/50",
          // Disabled state
          isDisabled && "opacity-40 saturate-50"
        )}
      >
        {/* Accent bar on left */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300",
            isActive ? colors.accent : isCompleted ? "bg-green-500" : "bg-muted"
          )} 
        />
        
        {/* Gradient overlay when active */}
        {isActive && (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-50 pointer-events-none",
            colors.gradient
          )} />
        )}

        {/* Header - Always visible, clickable */}
        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          className={cn(
            "accordion-step-header",
            "w-full flex items-center gap-4 p-4 md:p-5",
            "text-left transition-all duration-300",
            !isDisabled && "cursor-pointer hover:bg-accent/30",
            isDisabled && "cursor-not-allowed"
          )}
        >
          {/* Step number badge with 3D effect */}
          <div className={cn(
            "accordion-step-badge",
            "relative flex items-center justify-center",
            "w-12 h-12 md:w-14 md:h-14 rounded-xl",
            "border-2 transition-all duration-300",
            "font-black text-lg",
            isCompleted 
              ? "bg-green-500 border-green-600 text-white" 
              : isActive 
                ? [colors.accent, colors.border, "text-white border-3"]
                : "bg-muted border-border text-muted-foreground"
          )}>
            {isCompleted ? (
              <Check className="h-6 w-6 stroke-[3]" />
            ) : (
              <span>{stepNumber}</span>
            )}
            
            {/* Floating ring animation when active */}
            {isActive && !isCompleted && (
              <div className={cn(
                "absolute inset-0 rounded-xl border-2 animate-ping opacity-50",
                colors.border
              )} />
            )}
          </div>

          {/* Title and subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? colors.text : "text-muted-foreground"
              )} />
              <h3 className={cn(
                "font-black text-base md:text-lg uppercase tracking-tight truncate",
                "transition-colors duration-300",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {title}
              </h3>
            </div>
            <p className={cn(
              "text-xs md:text-sm mt-0.5 truncate",
              "text-muted-foreground transition-opacity",
              isActive ? "opacity-100" : "opacity-60"
            )}>
              {subtitle}
            </p>
          </div>

          {/* Expand indicator */}
          <div className={cn(
            "flex items-center gap-2 shrink-0"
          )}>
            {isCompleted && !isActive && (
              <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase hidden sm:inline">
                Completo
              </span>
            )}
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform duration-300 text-muted-foreground",
              isActive && "rotate-180"
            )} />
          </div>
        </button>

        {/* Content - Expandable with smooth animation */}
        <div className={cn(
          "accordion-step-content",
          "overflow-hidden transition-all duration-500 ease-out",
          isActive ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className={cn(
            "p-4 md:p-6 pt-0 md:pt-0 pl-6 md:pl-8",
            "border-t border-border/50",
            "animate-in fade-in-50 slide-in-from-top-2 duration-300"
          )}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
