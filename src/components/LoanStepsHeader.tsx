import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, User, Computer, BookOpen, Clock } from 'lucide-react';

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
    // Completo se o usuário estiver selecionado
    check: (props: LoanStepsHeaderProps) => props.isUserSelected,
    color: 'text-violet-500',
    progressColor: 'bg-violet-500',
  },
  {
    id: 2,
    title: 'Finalidade',
    icon: BookOpen,
    // Completo se a finalidade estiver definida
    check: (props: LoanStepsHeaderProps) => props.isPurposeDefined,
    color: 'text-blue-500',
    progressColor: 'bg-blue-500',
  },
  {
    id: 3,
    title: 'Equipamento',
    icon: Computer,
    // Completo se houver dispositivos adicionados
    check: (props: LoanStepsHeaderProps) => props.isDevicesAdded,
    color: 'text-amber-500',
    progressColor: 'bg-amber-500',
  },
  {
    id: 4,
    title: 'Confirmação',
    icon: CheckCircle,
    // Completo se todos os passos anteriores estiverem prontos para submissão
    check: (props: LoanStepsHeaderProps) => props.isUserSelected && props.isPurposeDefined && props.isDevicesAdded,
    color: 'text-green-500',
    progressColor: 'bg-green-500',
  },
];

export const LoanStepsHeader: React.FC<LoanStepsHeaderProps> = (props) => {
  const totalSteps = steps.length;
  
  // Calcula o progresso baseado no passo atual
  // Usamos (props.currentStep - 1) para que o passo 1 seja 0% e o passo 4 seja 100%
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
          // Um passo é considerado "completo" se o check for verdadeiro E o ID do passo for menor que o passo atual
          const isPastCompleted = step.check(props) && step.id < props.currentStep;
          const isActive = props.currentStep === step.id;
          
          return (
            <div 
              key={step.id} 
              className={cn(
                "flex flex-col items-center text-center z-10 transition-all duration-300 w-1/4 px-2", // 4 passos, 1/4 da largura
                isActive ? 'scale-105' : 'opacity-70'
              )}
            >
              {/* Círculo do Passo */}
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ring-4",
                isActive 
                  ? 'loan-step-active ring-primary/30 dark:ring-primary/20'
                  : isPastCompleted 
                    ? 'loan-step-completed ring-success/30 dark:ring-success/20'
                    : 'loan-step-pending ring-muted/30 dark:ring-muted/20'
              )}>
                {isPastCompleted ? <CheckCircle className="h-4 w-4" /> : <span className="font-bold text-sm">{step.id}</span>}
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