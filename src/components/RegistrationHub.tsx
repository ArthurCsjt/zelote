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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Hub de Cadastros</h1>
          <p className="text-gray-600">Gerencie todos os seus cadastros em um só lugar</p>
        </div>
        
        <Tabs defaultValue="chromebooks" className="w-full">
          <div className="mb-8 flex justify-center">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-1 shadow-lg max-w-full md:max-w-4xl">
              <TabsTrigger value="chromebooks" className="bg-slate-100 hover:bg-blue-100 rounded-lg p-2 transition-colors data-[state=active]:bg-blue-500 data-[state=active]:text-white">Chromebooks</TabsTrigger>
              <TabsTrigger value="students" className="bg-slate-100 hover:bg-green-100 rounded-lg p-2 transition-colors data-[state=active]:bg-green-500 data-[state=active]:text-white">Alunos</TabsTrigger>
              <TabsTrigger value="teachers" className="bg-slate-100 hover:bg-purple-100 rounded-lg p-2 transition-colors data-[state=active]:bg-purple-500 data-[state=active]:text-white">Professores</TabsTrigger>
              <TabsTrigger value="staff" className="bg-slate-100 hover:bg-orange-100 rounded-lg p-2 transition-colors data-[state=active]:bg-orange-500 data-[state=active]:text-white">Funcionários</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Adicionando um espaçamento extra aqui para garantir que o conteúdo não se sobreponha */}
          <div className="mt-8"> 
            <TabsContent value="chromebooks" className="space-y-4">
              <ChromebookRegistration onRegistrationSuccess={onRegistrationSuccess} />
            </TabsContent>
            <TabsContent value="students" className="space-y-4">
              <StudentRegistration />
            </TabsContent>
            <TabsContent value="teachers" className="space-y-4">
              <TeacherRegistration />
            </TabsContent>
            <TabsContent value="staff" className="space-y-4">
              <StaffRegistration />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}