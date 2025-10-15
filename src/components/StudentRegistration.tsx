import React, { useState } from 'react';
import { Users, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StudentForm } from './StudentForm';
import { StudentCSVImport } from './StudentCSVImport'; // Mantido o import, mas não usado
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

export function StudentRegistration() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cadastro Individual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4 mt-4">
          <StudentForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}