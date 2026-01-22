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
    title: 'Equipamento',
    icon: Computer,
    check: (props: LoanStepsHeaderProps) => props.isDevicesAdded,
  },
  {
    id: 2,
    title: 'Solicitante',
    icon: User,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected,
  },
  {
    id: 3,
    title: 'Finalidade',
    icon: BookOpen,
    check: (props: LoanStepsHeaderProps) => props.isPurposeDefined,
  },
  {
    id: 4,
    title: 'Confirmação',
    icon: CheckCircle,
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined && props.isDevicesAdded,
  },
];

export const LoanStepsHeader: React.FC<LoanStepsHeaderProps> = (props) => {
  // Calcula quantos passos estão completos
  const completedSteps = steps.filter(step => step.check(props)).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="sticky top-0 z-50 mb-3 animate-in fade-in duration-300 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-sm py-2 -mx-4 px-4 border-b-2 border-zinc-200 dark:border-zinc-800">
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
          const isCompleted = step.check(props);
          const isPending = !isCompleted;

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center text-center z-10 transition-all duration-300 w-1/4 px-1"
              )}
            >
              {/* Círculo do Passo - Compacto */}
              <div className={cn(
                "relative h-10 w-10 flex items-center justify-center mb-1 transition-all duration-300 border-3",
                isCompleted
                  ? 'bg-green-500 dark:bg-green-600 text-white border-green-700 dark:border-green-400 shadow-[3px_3px_0px_0px_rgba(34,197,94,0.4)]'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)]'
              )}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <Icon className="h-5 w-5 text-red-500 dark:text-red-400" />
                )}
              </div>

              {/* Título - Compacto */}
              <div className={cn(
                "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-all duration-300",
                isCompleted
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}>
                {step.title}
              </div>

              {/* Badge de Status */}
              <div className={cn(
                "mt-0.5 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider",
                isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              )}>
                {isCompleted ? '✓ OK' : '✗ Falta'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contador de Progresso */}
      <div className="text-center mt-3">
        <span className="text-xs font-bold text-foreground">
          {completedSteps} de {steps.length} passos completos
        </span>
      </div>
    </div>
  );
};