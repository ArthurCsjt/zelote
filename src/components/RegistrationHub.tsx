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
    <div className="space-y-8">

      {/* Removida a classe 'max-w-6xl' do container */}
      <div className="container mx-auto p-0">

        {/* Cabeçalho do Hub: Centralizado e Preto */}
        <div className="mb-8 text-center">
          <SectionHeader
            title="HUB DE CADASTROS"
            description="SELECIONE O TIPO DE ITEM OU USUÁRIO PARA CADASTRAR"
            icon={PlusCircle}
            iconColor="text-black dark:text-white"
            className="flex flex-col items-center neo-container-yellow p-6 tracking-tighter font-black"
          />
        </div>

        {/* Menu de Cards 2x2 */}
        <div className="mb-10 max-w-5xl mx-auto"> {/* Aumentado max-w para melhor espaçamento */}
          <RegistrationCardMenu onNavigate={handleNavigate} currentView={currentView} />
        </div>

        {/* Título do Formulário Selecionado */}
        <div className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-white mb-6 mt-10 text-center bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] p-3 w-fit mx-auto">
          {getTitle()}
        </div>

        {/* Formulário Selecionado */}
        <div className="mt-6 max-w-5xl mx-auto"> {/* Aumentado max-w para consistência */}
          {renderForm()}
        </div>
      </div>
    </div>
  );
}