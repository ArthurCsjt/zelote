import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, User, Computer, BookOpen } from 'lucide-react';

interface LoanStepsHeaderProps {
  currentStep: 1 | 2 | 3;
  isUserSelected: boolean;
  isDevicesAdded: boolean;
  isPurposeDefined: boolean;
}

const steps = [
  {
    id: 1,
    title: 'Solicitante',
    icon: User,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined,
    color: 'text-violet-500',
  },
  {
    id: 2,
    title: 'Dispositivos',
    icon: Computer,
    check: (props: LoanStepsHeaderProps) => props.isDevicesAdded,
    color: 'text-blue-500',
  },
  {
    id: 3,
    title: 'Revisar e Emprestar',
    icon: CheckCircle,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isDevicesAdded && props.isPurposeDefined,
    color: 'text-green-500',
  },
];

export const LoanStepsHeader: React.FC<LoanStepsHeaderProps> = (props) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = step.check(props);
        const isActive = props.currentStep === step.id;
        
        return (
          <div 
            key={step.id} 
            className={cn(
              "flex flex-col items-center text-center p-3 rounded-xl transition-all duration-300 border-2",
              "bg-card shadow-md",
              isActive 
                ? `border-primary dark:border-primary/50 shadow-lg ${step.color}`
                : isCompleted 
                  ? "border-success/50 dark:border-success/30"
                  : "border-border dark:border-border-strong opacity-60"
            )}
          >
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center mb-1 transition-all duration-300",
              isActive 
                ? `bg-primary text-primary-foreground scale-110`
                : isCompleted 
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
            )}>
              {isCompleted && !isActive ? <CheckCircle className="h-4 w-4" /> : <span className="font-bold text-sm">{step.id}</span>}
            </div>
            <h4 className="text-sm font-semibold text-foreground/90">{step.title}</h4>
            <p className={cn(
              "text-xs mt-0.5",
              isActive ? step.color : "text-muted-foreground"
            )}>
              {isActive ? 'Atual' : isCompleted ? 'Completo' : 'Pendente'}
            </p>
          </div>
        );
      })}
    </div>
  );
};