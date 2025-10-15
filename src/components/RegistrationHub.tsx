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
    <div className="space-y-6">
      
      {/* Removida a classe 'max-w-6xl' do container */}
      <div className="container mx-auto p-0">
        
        {/* Cabeçalho do Hub: Centralizado e Preto */}
        <div className="mb-6 text-center">
          <h1 className="text-gray-800 py-[2px] font-bold text-2xl my-[25px]">
            Hub de Cadastros
          </h1>
        </div>
        
        {/* Menu de Cards 2x2 */}
        <div className="mb-8 max-w-4xl mx-auto"> {/* Adicionando max-w aqui para o menu de cards */}
          <RegistrationCardMenu onNavigate={handleNavigate} currentView={currentView} />
        </div>

        {/* Título do Formulário Selecionado: Centralizado e menor (text-lg) */}
        <h2 className="text-lg font-bold text-gray-800 mb-4 mt-8 border-b pb-2 text-center">
          {getTitle()}
        </h2>
        
        {/* Formulário Selecionado */}
        <div className="mt-6 max-w-4xl mx-auto"> {/* Adicionando max-w aqui para os formulários */}
          {renderForm()}
        </div>
      </div>
    </div>
  );
}