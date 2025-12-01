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
    progressColor: 'bg-violet-500',
  },
  {
    id: 2,
    title: 'Dispositivos',
    icon: Computer,
    check: (props: LoanStepsHeaderProps) => props.isDevicesAdded,
    color: 'text-blue-500',
    progressColor: 'bg-blue-500',
  },
  {
    id: 3,
    title: 'Emprestar',
    icon: CheckCircle,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isDevicesAdded && props.isPurposeDefined,
    color: 'text-green-500',
    progressColor: 'bg-green-500',
  },
];

export const LoanStepsHeader: React.FC<LoanStepsHeaderProps> = (props) => {
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.check(props)).length;
  const progressPercentage = (props.currentStep - 1) / (totalSteps - 1) * 100;
  
  // Determina a cor da barra de progresso com base no passo atual
  const currentStepData = steps.find(s => s.id === props.currentStep) || steps[0];
  const progressColorClass = currentStepData.progressColor;

  return (
    <div className="mb-8 space-y-4">
      {/* Linha do Tempo Visual */}
      <div className="flex justify-between items-center relative">
        
        {/* Barra de Progresso (Fundo) */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-border dark:bg-border-strong -translate-y-1/2 mx-10" />
        
        {/* Barra de Progresso (Preenchimento) */}
        <div 
          className={cn(
            "absolute top-1/2 left-10 h-1 -translate-y-1/2 transition-all duration-500 ease-in-out rounded-full",
            progressColorClass
          )}
          style={{ width: `calc(${progressPercentage}% - 40px)` }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.check(props);
          const isActive = props.currentStep === step.id;
          
          return (
            <div 
              key={step.id} 
              className={cn(
                "flex flex-col items-center text-center z-10 transition-all duration-300 w-1/3 px-2",
                isActive ? 'scale-105' : 'opacity-70'
              )}
            >
              {/* Círculo do Passo */}
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ring-4",
                isActive 
                  ? `bg-primary text-primary-foreground ring-primary/30 dark:ring-primary/20`
                  : isCompleted 
                    ? "bg-success text-success-foreground ring-success/30 dark:ring-success/20"
                    : "bg-muted text-muted-foreground ring-muted/30 dark:ring-muted/20"
              )}>
                {isCompleted && !isActive ? <CheckCircle className="h-5 w-5" /> : <span className="font-bold text-base">{step.id}</span>}
              </div>
              
              {/* Título */}
              <h4 className={cn(
                "text-sm font-semibold whitespace-nowrap",
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step.title}
              </h4>
              
              {/* Status */}
              <p className={cn(
                "text-xs mt-0.5",
                isActive ? currentStepData.color : isCompleted ? 'text-success' : 'text-muted-foreground'
              )}>
                {isActive ? 'Atual' : isCompleted ? 'Completo' : 'Pendente'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};