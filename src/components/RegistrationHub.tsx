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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-slate-50 to-purple-50/50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Hub de Cadastros</h1>
          <p className="text-gray-600">Gerencie todos os seus cadastros em um só lugar</p>
        </div>
        
        <Tabs defaultValue="chromebooks" className="w-full">
          <div className="mb-8 flex justify-center">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 max-w-[800px] gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-1 shadow-lg">
              <TabsTrigger value="chromebooks" className="bg-slate-100 hover:bg-blue-100 rounded-lg p-2 transition-colors">Chromebooks</TabsTrigger>
              <TabsTrigger value="students" className="bg-slate-100 hover:bg-green-100 rounded-lg p-2 transition-colors">Alunos</TabsTrigger>
              <TabsTrigger value="teachers" className="bg-slate-100 hover:bg-purple-100 rounded-lg p-2 transition-colors">Professores</TabsTrigger>
              <TabsTrigger value="staff" className="bg-slate-100 hover:bg-orange-100 rounded-lg p-2 transition-colors">Funcionários</TabsTrigger>
            </TabsList>
          </div>
          
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
        </Tabs>
      </div>
    </div>
  );
}