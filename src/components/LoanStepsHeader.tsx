import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, User, Computer, BookOpen, Sparkles } from 'lucide-react';

interface LoanStepsHeaderProps {
  currentStep: 1 | 2 | 3 | 4;
  isUserSelected: boolean;
  isDevicesAdded: boolean;
  isPurposeDefined: boolean;
}

const steps = [
  {
    id: 1,
    title: 'Solicitante',
    icon: User,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected,
    color: 'text-violet-500',
    progressColor: 'bg-gradient-to-r from-violet-500 to-violet-600',
    glowColor: 'shadow-violet-500/50',
  },
  {
    id: 2,
    title: 'Finalidade',
    icon: BookOpen,
    check: (props: LoanStepsHeaderProps) => props.isPurposeDefined,
    color: 'text-blue-500',
    progressColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
    glowColor: 'shadow-blue-500/50',
  },
  {
    id: 3,
    title: 'Equipamento',
    icon: Computer,
    check: (props: LoanStepsHeaderProps) => props.isDevicesAdded,
    color: 'text-amber-500',
    progressColor: 'bg-gradient-to-r from-amber-500 to-amber-600',
    glowColor: 'shadow-amber-500/50',
  },
  {
    id: 4,
    title: 'Confirmação',
    icon: CheckCircle,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined && props.isDevicesAdded,
    color: 'text-green-500',
    progressColor: 'bg-gradient-to-r from-green-500 to-green-600',
    glowColor: 'shadow-green-500/50',
  },
];

export const LoanStepsHeader: React.FC<LoanStepsHeaderProps> = (props) => {
  const totalSteps = steps.length;
  const progressPercentage = (props.currentStep - 1) / (totalSteps - 1) * 100;
  const currentStepData = steps.find(s => s.id === props.currentStep) || steps[0];

  return (
    <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-top-3 duration-500">
      {/* Título com gradiente */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
          Novo Empréstimo
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Passo {props.currentStep} de {totalSteps}
        </p>
      </div>

      {/* Linha do Tempo Visual */}
      <div className="flex justify-between items-center relative px-4">

        {/* Barra de Progresso (Fundo) */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-muted/30 dark:bg-muted/20 -translate-y-1/2 mx-12 rounded-full" />

        {/* Barra de Progresso (Preenchimento com gradiente) */}
        <div
          className={cn(
            "absolute top-1/2 left-12 h-2 -translate-y-1/2 transition-all duration-700 ease-out rounded-full",
            currentStepData.progressColor,
            "shadow-lg",
            currentStepData.glowColor
          )}
          style={{ width: `calc(${progressPercentage}% - 48px)` }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isPastCompleted = step.check(props) && step.id < props.currentStep;
          const isActive = props.currentStep === step.id;

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center text-center z-10 transition-all duration-500 w-1/4 px-2",
                isActive && 'scale-110'
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Círculo do Passo com animação */}
              <div className={cn(
                "relative h-10 w-10 rounded-full flex items-center justify-center mb-3 transition-all duration-500",
                "ring-4 ring-offset-2 ring-offset-background",
                isActive
                  ? cn(
                    'bg-gradient-to-br from-primary to-primary/80',
                    'ring-primary/30 dark:ring-primary/20',
                    'shadow-lg',
                    currentStepData.glowColor,
                    'animate-pulse'
                  )
                  : isPastCompleted
                    ? cn(
                      'bg-gradient-to-br from-green-500 to-green-600',
                      'ring-green-500/30 dark:ring-green-500/20',
                      'shadow-md shadow-green-500/30'
                    )
                    : 'bg-muted ring-muted/30 dark:ring-muted/20'
              )}>
                {isPastCompleted ? (
                  <CheckCircle className="h-5 w-5 text-white animate-in zoom-in duration-300" />
                ) : isActive ? (
                  <Icon className={cn("h-5 w-5 text-white")} />
                ) : (
                  <span className="font-bold text-sm text-muted-foreground">{step.id}</span>
                )}

                {/* Efeito de brilho para passo ativo */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                )}
              </div>

              {/* Título */}
              <h4 className={cn(
                "text-sm font-semibold whitespace-nowrap transition-colors duration-300",
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step.title}
              </h4>

              {/* Status com ícone */}
              <div className={cn(
                "flex items-center gap-1 text-xs mt-1 font-medium transition-colors duration-300",
                isActive ? step.color : isPastCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}>
                {isPastCompleted && <CheckCircle className="h-3 w-3" />}
                <span>
                  {isActive ? 'Em andamento' : isPastCompleted ? 'Concluído' : 'Pendente'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};