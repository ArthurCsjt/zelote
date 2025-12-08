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
      {/* Título */}
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-black dark:text-white" />
          Novo Empréstimo
        </h2>
        <p className="text-sm font-mono text-muted-foreground mt-1 uppercase">
          Passo {props.currentStep} de {totalSteps}
        </p>
      </div>

      {/* Linha do Tempo Visual */}
      <div className="flex justify-between items-center relative px-4">

        {/* Barra de Progresso (Fundo) */}
        <div className="absolute top-1/2 left-0 right-0 h-4 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white -translate-y-1/2 mx-12 z-0" />

        {/* Barra de Progresso (Preenchimento) */}
        <div
          className={cn(
            "absolute top-1/2 left-12 h-4 -translate-y-1/2 transition-all duration-700 ease-out z-0 border-y-2 border-l-2 border-black dark:border-white bg-black dark:bg-white",
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
            >
              {/* Círculo do Passo (Quadrado Brutalista agora) */}
              <div className={cn(
                "relative h-12 w-12 flex items-center justify-center mb-3 transition-all duration-500 border-4 border-black dark:border-white bg-white dark:bg-zinc-900",
                isActive
                  ? 'bg-yellow-300 dark:bg-yellow-600 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]'
                  : isPastCompleted
                    ? 'bg-green-500 dark:bg-green-700 text-white'
                    : 'bg-gray-200 dark:bg-zinc-800'
              )}>
                {isPastCompleted ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : isActive ? (
                  <Icon className="h-6 w-6 text-black dark:text-white" />
                ) : (
                  <span className="font-bold text-lg text-gray-500">{step.id}</span>
                )}
              </div>

              {/* Título */}
              <h4 className={cn(
                "text-sm font-black uppercase whitespace-nowrap transition-colors duration-300 bg-white dark:bg-black px-1 border-2 border-transparent",
                isActive ? 'border-black dark:border-white text-black dark:text-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]' : 'text-muted-foreground'
              )}>
                {step.title}
              </h4>
            </div>
          );
        })}
      </div>
    </div>
  );
};