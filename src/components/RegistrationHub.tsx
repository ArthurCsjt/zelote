import React, { useState } from 'react';
import { ChromebookRegistration } from './ChromebookRegistration';
import { StudentRegistration } from './StudentRegistration';
import { TeacherRegistration } from './TeacherRegistration';
import { StaffRegistration } from './StaffRegistration';
import { RegistrationCardMenu } from './RegistrationCardMenu';

type RegistrationView = 'chromebooks' | 'students' | 'teachers' | 'staff';

interface RegistrationHubProps {
  onRegistrationSuccess: (newChromebook: any) => void;
}

export function RegistrationHub({ onRegistrationSuccess }: RegistrationHubProps) {
  const [currentView, setCurrentView] = useState<RegistrationView>('chromebooks');

  const handleNavigate = (view: RegistrationView) => {
    setCurrentView(view);
  };

  const renderForm = () => {
    switch (currentView) {
      case 'chromebooks':
        return <ChromebookRegistration onRegistrationSuccess={onRegistrationSuccess} />;
      case 'students':
        return <StudentRegistration />;
      case 'teachers':
        return <TeacherRegistration />;
      case 'staff':
        return <StaffRegistration />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="container mx-auto p-0">
        
        <div className="mb-6 text-center">
          <h1 className="text-gray-800 py-[2px] font-bold text-2xl my-[25px]">
            Hub de Cadastros
          </h1>
        </div>
        
        <div className="mb-8 max-w-4xl mx-auto">
          <RegistrationCardMenu onNavigate={handleNavigate} currentView={currentView} />
        </div>

        <div className="mt-6 max-w-4xl mx-auto">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}