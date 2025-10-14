import React, { useState } from 'react';
import { ChromebookRegistration } from './ChromebookRegistration';
import { StudentRegistration } from './StudentRegistration';
import { TeacherRegistration } from './TeacherRegistration';
import { StaffRegistration } from './StaffRegistration';
import { RegistrationMenu } from './RegistrationMenu';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

type RegistrationView = 'menu' | 'chromebooks' | 'students' | 'teachers' | 'staff';

interface RegistrationHubProps {
  onBack: () => void;
  onRegistrationSuccess: (newChromebook: any) => void;
}

export function RegistrationHub({ onBack, onRegistrationSuccess }: RegistrationHubProps) {
  const [currentView, setCurrentView] = useState<RegistrationView>('menu');

  const handleNavigate = (view: RegistrationView) => {
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'chromebooks':
        return <ChromebookRegistration onRegistrationSuccess={onRegistrationSuccess} />;
      case 'students':
        return <StudentRegistration />;
      case 'teachers':
        return <TeacherRegistration />;
      case 'staff':
        return <StaffRegistration />;
      case 'menu':
      default:
        return <RegistrationMenu onNavigate={handleNavigate} />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'chromebooks': return 'Cadastro de Chromebooks';
      case 'students': return 'Cadastro de Alunos';
      case 'teachers': return 'Cadastro de Professores';
      case 'staff': return 'Cadastro de Funcionários';
      case 'menu':
      default: return 'Hub de Cadastros';
    }
  };

  return (
    <div className="bg-transparent">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {currentView !== 'menu' && (
              <Button variant="outline" size="sm" onClick={() => setCurrentView('menu')} className="back-button">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-foreground py-[2px] font-bold text-2xl">
              {getTitle()}
            </h1>
          </div>
          {currentView === 'menu' && (
            <Button onClick={onBack} variant="outline">Voltar ao Menu Principal</Button>
          )}
        </div>
        
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}