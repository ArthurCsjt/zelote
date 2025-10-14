import React, { useState } from 'react';
import { Users, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StudentForm } from './StudentForm';
import { StudentCSVImport } from './StudentCSVImport';
export function StudentRegistration() {
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h2 className="font-semibold text-xl text-blue-600 text-center">Cadastro de Alunos</h2>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cadastro Individual
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar via CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <StudentForm />
        </TabsContent>

        <TabsContent value="csv" className="space-y-4">
          <StudentCSVImport />
        </TabsContent>
      </Tabs>
    </div>;
}