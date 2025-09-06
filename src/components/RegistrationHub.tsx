import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChromebookRegistration } from './ChromebookRegistration';
import { StudentRegistration } from './StudentRegistration';
import { TeacherRegistration } from './TeacherRegistration';
import { StaffRegistration } from './StaffRegistration';

interface RegistrationHubProps {
  onBack?: () => void;
}

export function RegistrationHub({ onBack }: RegistrationHubProps) {
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Hub de Cadastros</h1>
          <p className="text-muted-foreground">
            Gerencie e cadastre todas as entidades do sistema
          </p>
        </div>

        <Tabs defaultValue="chromebooks" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chromebooks">Chromebooks</TabsTrigger>
            <TabsTrigger value="students">Alunos</TabsTrigger>
            <TabsTrigger value="teachers">Professores</TabsTrigger>
            <TabsTrigger value="staff">Funcionários</TabsTrigger>
          </TabsList>

          <TabsContent value="chromebooks" className="space-y-4">
            <ChromebookRegistration />
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