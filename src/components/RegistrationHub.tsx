import React, { useState } from 'react';
import { ChromebookRegistration } from './ChromebookRegistration';
import { StudentRegistration } from './StudentRegistration';
import { TeacherRegistration } from './TeacherRegistration';
import { StaffRegistration } from './StaffRegistration';
import { RegistrationCardMenu } from './RegistrationCardMenu';
import { Button } from './ui/button';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { SectionHeader } from './Shared/SectionHeader'; // Importando SectionHeader
import { cn } from '@/lib/utils';

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
        // Usando o novo wrapper que contém as abas Manual e Inteligente
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
          <SectionHeader
            title="Hub de Cadastros"
            description="Selecione o tipo de item ou usuário para cadastrar"
            icon={PlusCircle}
            iconColor="text-black dark:text-white"
            className="flex flex-col items-center neo-container-yellow p-6"
          />
        </div>

        {/* Menu de Cards 2x2 */}
        <div className="mb-8 max-w-4xl mx-auto"> {/* Adicionando max-w aqui para o menu de cards */}
          <RegistrationCardMenu onNavigate={handleNavigate} currentView={currentView} />
        </div>

        {/* Título do Formulário Selecionado */}
        <div className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-white mb-4 mt-8 text-center bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 w-fit mx-auto">
          {getTitle()}
        </div>

        {/* Formulário Selecionado */}
        <div className="mt-6 max-w-4xl mx-auto"> {/* Adicionando max-w aqui para os formulários */}
          {renderForm()}
        </div>
      </div>
    </div>
  );
}