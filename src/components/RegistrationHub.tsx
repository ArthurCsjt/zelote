import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChromebookRegistration } from './ChromebookRegistration';
import { StudentRegistration } from './StudentRegistration';
import { TeacherRegistration } from './TeacherRegistration';
import { StaffRegistration } from './StaffRegistration';

interface RegistrationHubProps {
  onBack: () => void;
  onRegistrationSuccess: (newChromebook: any) => void;
}

export function RegistrationHub({ onBack, onRegistrationSuccess }: RegistrationHubProps) {
  return (
    <div className="bg-transparent">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <h1 className="text-foreground py-[2px] font-bold text-2xl my-[25px]">Hub de Cadastros</h1>
        </div>
        
        <Tabs defaultValue="chromebooks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="chromebooks">Chromebooks</TabsTrigger>
            <TabsTrigger value="students">Alunos</TabsTrigger>
            <TabsTrigger value="teachers">Professores</TabsTrigger>
            <TabsTrigger value="staff">Funcionários</TabsTrigger>
          </TabsList>
          
          {/* CORREÇÃO: Adicionando mt-6 para garantir espaçamento vertical */}
          <TabsContent value="chromebooks" className="mt-6">
            <ChromebookRegistration onRegistrationSuccess={onRegistrationSuccess} />
          </TabsContent>
          <TabsContent value="students" className="mt-6">
            <StudentRegistration />
          </TabsContent>
          <TabsContent value="teachers" className="mt-6">
            <TeacherRegistration />
          </TabsContent>
          <TabsContent value="staff" className="mt-6">
            <StaffRegistration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}