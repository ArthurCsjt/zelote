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
    // Passo 1 está completo se o usuário E a finalidade estiverem definidos
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined,
    color: 'text-violet-500',
    progressColor: 'bg-violet-500',
  },
  {
    id: 2,
    title: 'Dispositivos',
    icon: Computer,
    // Passo 2 está completo se houver dispositivos adicionados
    check: (props: LoanStepsHeaderProps) => props.isDevicesAdded,
    color: 'text-blue-500',
    progressColor: 'bg-blue-500',
  },
  {
    id: 3,
    title: 'Emprestar',
    icon: CheckCircle,
    // Passo 3 só é marcado como completo após a submissão, mas o check aqui é para indicar que está pronto para submeter
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isDevicesAdded && props.isPurposeDefined,
    color: 'text-green-500',
    progressColor: 'bg-green-500',
  },
];

export const LoanStepsHeader: React.FC<LoanStepsHeaderProps> = (props) => {
  const totalSteps = steps.length;
  
  // Calcula o progresso baseado no passo atual
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
          // O passo está completo se o check for verdadeiro E o ID do passo for menor que o passo atual
          // Ou se o check for verdadeiro E o passo atual for o último (Passo 3)
          const isCompleted = step.check(props) && (step.id < props.currentStep || (step.id === 3 && props.currentStep === 3));
          const isActive = props.currentStep === step.id;
          
          // Se o passo 1 estiver completo, mas o usuário estiver no passo 2, ele deve ser marcado como completo.
          const isPastCompleted = step.check(props) && step.id < props.currentStep;
          
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
                  : isPastCompleted 
                    ? "bg-success text-success-foreground ring-success/30 dark:ring-success/20"
                    : "bg-muted text-muted-foreground ring-muted/30 dark:ring-muted/20"
              )}>
                {isPastCompleted ? <CheckCircle className="h-5 w-5" /> : <span className="font-bold text-base">{step.id}</span>}
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
                isActive ? currentStepData.color : isPastCompleted ? 'text-success' : 'text-muted-foreground'
              )}>
                {isActive ? 'Atual' : isPastCompleted ? 'Completo' : 'Pendente'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};