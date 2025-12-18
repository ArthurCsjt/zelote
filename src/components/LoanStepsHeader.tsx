import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, User, Computer, BookOpen } from 'lucide-react';

interface LoanStepsHeaderProps {
  currentStep: 1 | 2 | 3 | 4;
  isUserSelected: boolean;
  isDevicesAdded: boolean;
  isPurposeDefined: boolean;
  onStepClick?: (step: number) => void;
}

const steps = [
  {
    id: 1,
    title: 'Solicitante',
    icon: User,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected,
    canNavigate: () => true,
  },
  {
    id: 2,
    title: 'Finalidade',
    icon: BookOpen,
    check: (props: LoanStepsHeaderProps) => props.isPurposeDefined,
    canNavigate: (props: LoanStepsHeaderProps) => props.isUserSelected,
  },
  {
    id: 3,
    title: 'Equipamento',
    icon: Computer,
    check: (props: LoanStepsHeaderProps) => props.isDevicesAdded,
    canNavigate: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined,
  },
  {
    id: 4,
    title: 'Confirmar',
    icon: CheckCircle,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined && props.isDevicesAdded,
    canNavigate: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined && props.isDevicesAdded,
  },
];

export const LoanStepsHeader: React.FC<LoanStepsHeaderProps> = (props) => {
  const { onStepClick } = props;
  const totalSteps = steps.length;
  const progressPercentage = (props.currentStep - 1) / (totalSteps - 1) * 100;

  const handleStepClick = (stepId: number, canNav: boolean) => {
    if (onStepClick && canNav) {
      onStepClick(stepId);
    }
  };

  return (
    <div className="sticky top-0 z-50 mb-6 animate-in fade-in duration-300 bg-background/98 backdrop-blur-sm py-3 -mx-4 px-4 border-b-4 border-black dark:border-white">
      {/* Progress Timeline */}
      <div className="flex justify-between items-center relative px-4 max-w-4xl mx-auto">

        {/* Progress Bar (Background) */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-muted -translate-y-1/2 mx-12 z-0 border border-black/20 dark:border-white/20" />

        {/* Progress Bar (Fill) */}
        <div
          className={cn(
            "absolute top-1/2 left-12 h-1.5 -translate-y-1/2 transition-all duration-700 ease-out z-0",
            "bg-gradient-to-r from-violet-500 via-blue-500 to-green-500"
          )}
          style={{ width: `calc(${progressPercentage}% - 48px)` }}
        />

        {steps.map((step) => {
          const Icon = step.icon;
          const isPastCompleted = step.check(props) && step.id < props.currentStep;
          const isActive = props.currentStep === step.id;
          const canNavigate = step.canNavigate(props);
          const isClickable = !!onStepClick && canNavigate;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepClick(step.id, canNavigate)}
              disabled={!isClickable}
              className={cn(
                "flex flex-col items-center text-center z-10 transition-all duration-300 w-1/4 px-1",
                isClickable && "cursor-pointer hover:scale-105",
                !isClickable && "cursor-default"
              )}
            >
              {/* Step Circle */}
              <div className={cn(
                "relative h-12 w-12 flex items-center justify-center mb-2 transition-all duration-300 border-2",
                isActive && 'animate-pulse',
                isActive
                  ? 'bg-yellow-300 dark:bg-yellow-400 border-black dark:border-black shadow-[4px_4px_0px_0px_#000]'
                  : isPastCompleted
                    ? 'bg-green-500 text-white border-black shadow-[3px_3px_0px_0px_#000]'
                    : 'bg-background border-black/30 dark:border-white/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
              )}>
                {isPastCompleted ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : isActive ? (
                  <Icon className="h-6 w-6 text-black" />
                ) : (
                  <span className="font-black text-lg text-muted-foreground">{step.id}</span>
                )}
              </div>

              {/* Title */}
              <div className={cn(
                "px-2 py-0.5 text-[10px] font-black uppercase tracking-wide transition-all duration-300",
                isActive
                  ? 'text-foreground'
                  : isPastCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
              )}>
                {step.title}
              </div>

              {/* Current Step Badge */}
              {isActive && (
                <div className="mt-1 px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-wider border border-black dark:border-white">
                  Passo {props.currentStep}/4
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
