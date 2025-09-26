import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChromebookRegistration } from './ChromebookRegistration';
import { StudentRegistration } from './StudentRegistration';
import { TeacherRegistration } from './TeacherRegistration';
import { StaffRegistration } from './StaffRegistration';

// Definimos as "instruções" que este componente vai receber
interface RegistrationHubProps {
  onBack?: () => void;
  onRegistrationSuccess: (newChromebook: any) => void; // A nova instrução
}

export function RegistrationHub({ onBack, onRegistrationSuccess }: RegistrationHubProps) {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className="py-[30px] text-center text-slate-950 text-xl font-bold">Hub de Cadastros</h1>
      </div>
      <Tabs defaultValue="chromebooks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chromebooks">Chromebooks</TabsTrigger>
          <TabsTrigger value="students">Alunos</TabsTrigger>
          <TabsTrigger value="teachers">Professores</TabsTrigger>
          <TabsTrigger value="staff">Funcionários</TabsTrigger>
        </TabsList>
        <TabsContent value="chromebooks" className="space-y-4">
          {/* Repassando a instrução para o formulário */}
          <ChromebookRegistration onRegistrationSuccess={onRegistrationSuccess} />
        </TabsContent>
        <TabsContent value="students"><StudentRegistration /></TabsContent>
        <TabsContent value="teachers"><TeacherRegistration /></TabsContent>
        <TabsContent value="staff"><StaffRegistration /></TabsContent>
      </Tabs>
    </div>
  );
}