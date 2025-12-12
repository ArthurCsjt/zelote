import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, User, Computer, BookOpen } from 'lucide-react';

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
  },
  {
    id: 2,
    title: 'Finalidade',
    icon: BookOpen,
    check: (props: LoanStepsHeaderProps) => props.isPurposeDefined,
  },
  {
    id: 3,
    title: 'Equipamento',
    icon: Computer,
    check: (props: LoanStepsHeaderProps) => props.isDevicesAdded,
  },
  {
    id: 4,
    title: 'Confirmação',
    icon: CheckCircle,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined && props.isDevicesAdded,
  },
];

export const LoanStepsHeader: React.FC<LoanStepsHeaderProps> = (props) => {
  const totalSteps = steps.length;
  const progressPercentage = (props.currentStep - 1) / (totalSteps - 1) * 100;

  return (
    <div className="sticky top-0 z-50 mb-6 animate-in fade-in duration-300 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-sm py-3 -mx-4 px-4 border-b-2 border-zinc-200 dark:border-zinc-800">
      {/* Linha do Tempo Visual Compacta */}
      <div className="flex justify-between items-center relative px-4 max-w-4xl mx-auto">

        {/* Barra de Progresso (Fundo) */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 mx-12 z-0" />

        {/* Barra de Progresso (Preenchimento com Gradiente) */}
        <div
          className={cn(
            "absolute top-1/2 left-12 h-1 -translate-y-1/2 transition-all duration-700 ease-out z-0",
            "bg-gradient-to-r from-violet-500 via-blue-500 to-green-500"
          )}
          style={{ width: `calc(${progressPercentage}% - 48px)` }}
        />

        {steps.map((step) => {
          const Icon = step.icon;
          const isPastCompleted = step.check(props) && step.id < props.currentStep;
          const isActive = props.currentStep === step.id;

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center text-center z-10 transition-all duration-300 w-1/4 px-1"
              )}
            >
              {/* Círculo do Passo - Compacto */}
              <div className={cn(
                "relative h-12 w-12 flex items-center justify-center mb-2 transition-all duration-300 border-2",
                isActive && 'animate-pulse',
                isActive
                  ? 'bg-yellow-300 dark:bg-yellow-500 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]'
                  : isPastCompleted
                    ? 'bg-green-500 dark:bg-green-600 text-white border-green-700 dark:border-green-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
              )}>
                {isPastCompleted ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : isActive ? (
                  <Icon className="h-6 w-6 text-black dark:text-black" />
                ) : (
                  <span className="font-bold text-lg text-zinc-400 dark:text-zinc-600">{step.id}</span>
                )}
              </div>

              {/* Título - Compacto */}
              <div className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-300",
                isActive
                  ? 'text-black dark:text-white'
                  : isPastCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-zinc-400 dark:text-zinc-600'
              )}>
                {step.title}
              </div>

              {/* Badge do Passo Atual */}
              {isActive && (
                <div className="mt-1 px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-wider">
                  Passo {props.currentStep}/4
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};