import React, { useState } from 'react';
import { ChromebookRegistration } from './ChromebookRegistration';
import { StudentRegistration } from './StudentRegistration';
import { TeacherRegistration } from './TeacherRegistration';
import { StaffRegistration } from './StaffRegistration';
import { RegistrationCardMenu } from './RegistrationCardMenu';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

type RegistrationView = 'chromebooks' | 'students' | 'teachers' | 'staff';

interface RegistrationHubProps {
  onBack: () => void;
  onRegistrationSuccess: (newChromebook: any) => void;
}

export function RegistrationHub({ onBack, onRegistrationSuccess }: RegistrationHubProps) {
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

  const getTitle = () => {
    switch (currentView) {
      case 'chromebooks': return 'Cadastro de Chromebooks';
      case 'students': return 'Cadastro de Alunos';
      case 'teachers': return 'Cadastro de Professores';
      case 'staff': return 'Cadastro de Funcionários';
    }
  };

  return (
    <div className="space-y-6 glass-morphism p-4 sm:p-6 lg:p-8 animate-fade-in relative">
      {/* Background gradient overlay para o efeito glass-morphism */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-50/30 via-blue-50/20 to-purple-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      <div className="container mx-auto max-w-6xl p-0">
        
        {/* Cabeçalho do Hub */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-foreground py-[2px] font-bold text-2xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Hub de Cadastros
          </h1>
        </div>
        
        {/* Menu de Cards 2x2 */}
        <div className="mb-8">
          <RegistrationCardMenu onNavigate={handleNavigate} currentView={currentView} />
        </div>

        {/* Título do Formulário Selecionado */}
        <h2 className="text-xl font-bold text-gray-800 mb-4 mt-8 border-b pb-2">
          {getTitle()}
        </h2>
        
        {/* Formulário Selecionado */}
        <div className="mt-6">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}