import React from 'react';
import { cn } from '@/lib/utils';
import { Check, User, BookOpen, Computer, CheckCircle } from 'lucide-react';

interface LoanProgressIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  isUserSelected: boolean;
  isPurposeDefined: boolean;
  isDevicesAdded: boolean;
  onStepClick: (step: number) => void;
}

const steps = [
  { number: 1, icon: User, label: 'Solicitante', shortLabel: '1' },
  { number: 2, icon: BookOpen, label: 'Finalidade', shortLabel: '2' },
  { number: 3, icon: Computer, label: 'Equipamento', shortLabel: '3' },
  { number: 4, icon: CheckCircle, label: 'Confirmar', shortLabel: '4' },
];

export const LoanProgressIndicator: React.FC<LoanProgressIndicatorProps> = ({
  currentStep,
  isUserSelected,
  isPurposeDefined,
  isDevicesAdded,
  onStepClick,
}) => {
  const getStepStatus = (step: number): 'completed' | 'active' | 'pending' | 'disabled' => {
    const isCompleted = 
      (step === 1 && isUserSelected) ||
      (step === 2 && isPurposeDefined) ||
      (step === 3 && isDevicesAdded) ||
      (step === 4 && isUserSelected && isPurposeDefined && isDevicesAdded);
    
    const isDisabled =
      (step === 2 && !isUserSelected) ||
      (step === 3 && (!isUserSelected || !isPurposeDefined)) ||
      (step === 4 && (!isUserSelected || !isPurposeDefined || !isDevicesAdded));

    if (isCompleted) return 'completed';
    if (step === currentStep) return 'active';
    if (isDisabled) return 'disabled';
    return 'pending';
  };

  const completedCount = [isUserSelected, isPurposeDefined, isDevicesAdded].filter(Boolean).length;
  const progressPercent = (completedCount / 3) * 100;

  return (
    <div className="loan-progress-container">
      {/* Modern floating progress bar */}
      <div className="loan-progress-bar-wrapper">
        <div className="loan-progress-bar-bg">
          <div 
            className="loan-progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="loan-progress-text">
          {completedCount}/3 etapas
        </span>
      </div>

      {/* Step dots */}
      <div className="loan-progress-dots">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number);
          const StepIcon = step.icon;
          
          return (
            <React.Fragment key={step.number}>
              {/* Connector line */}
              {index > 0 && (
                <div className={cn(
                  "loan-progress-connector",
                  status === 'completed' || (index < completedCount) 
                    ? "loan-progress-connector-filled" 
                    : ""
                )} />
              )}
              
              {/* Step dot */}
              <button
                type="button"
                onClick={() => status !== 'disabled' && onStepClick(step.number)}
                disabled={status === 'disabled'}
                className={cn(
                  "loan-progress-dot",
                  status === 'completed' && "loan-progress-dot-completed",
                  status === 'active' && "loan-progress-dot-active",
                  status === 'disabled' && "loan-progress-dot-disabled",
                  status === 'pending' && "loan-progress-dot-pending"
                )}
                title={step.label}
              >
                {status === 'completed' ? (
                  <Check className="h-3 w-3 stroke-[3]" />
                ) : (
                  <StepIcon className="h-3 w-3" />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
