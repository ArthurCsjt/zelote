import React from 'react';
import { cn } from '@/lib/utils';
import { User, BookOpen, Computer, CheckCircle } from 'lucide-react';

interface LoanStatusBarProps {
  currentStep: 1 | 2 | 3 | 4;
  isUserSelected: boolean;
  isPurposeDefined: boolean;
  isDevicesAdded: boolean;
  onStepClick: (step: number) => void;
}

const steps = [
  { id: 1, icon: User, label: 'Quem' },
  { id: 2, icon: BookOpen, label: 'Para quê' },
  { id: 3, icon: Computer, label: 'O quê' },
  { id: 4, icon: CheckCircle, label: 'Confirmar' },
];

export const LoanStatusBar: React.FC<LoanStatusBarProps> = ({
  currentStep,
  isUserSelected,
  isPurposeDefined,
  isDevicesAdded,
  onStepClick,
}) => {
  const getStepStatus = (stepId: number) => {
    switch (stepId) {
      case 1:
        return isUserSelected;
      case 2:
        return isPurposeDefined;
      case 3:
        return isDevicesAdded;
      case 4:
        return isUserSelected && isPurposeDefined && isDevicesAdded;
      default:
        return false;
    }
  };

  const canNavigateToStep = (stepId: number) => {
    // Can always go back to step 1
    if (stepId === 1) return true;
    // Step 2 requires step 1 complete
    if (stepId === 2) return isUserSelected;
    // Step 3 requires steps 1 and 2 complete
    if (stepId === 3) return isUserSelected && isPurposeDefined;
    // Step 4 requires all previous steps complete
    if (stepId === 4) return isUserSelected && isPurposeDefined && isDevicesAdded;
    return false;
  };

  return (
    <div className="loan-status-bar md:hidden">
      <div className="loan-status-bar-inner">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = getStepStatus(step.id);
          const isActive = currentStep === step.id;
          const canNavigate = canNavigateToStep(step.id);

          return (
            <button
              key={step.id}
              onClick={() => canNavigate && onStepClick(step.id)}
              disabled={!canNavigate}
              className={cn(
                "loan-status-btn",
                isActive && "loan-status-btn-active",
                isCompleted && !isActive && "loan-status-btn-completed",
                !canNavigate && "loan-status-btn-disabled"
              )}
              aria-label={`${step.label} - ${isCompleted ? 'Completo' : 'Pendente'}`}
            >
              <div className="loan-status-btn-icon">
                {isCompleted && !isActive ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span className="loan-status-btn-label">{step.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Progress indicator */}
      <div className="loan-status-progress">
        <div 
          className="loan-status-progress-fill"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );
};
