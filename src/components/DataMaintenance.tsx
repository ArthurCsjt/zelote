import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StudentCSVImport } from './StudentCSVImport';
import { TeacherCSVImport } from './TeacherCSVImport'; // NOVO IMPORT
import { AdvancedSettings } from './AdvancedSettings';
import { Database, Upload, AlertTriangle, GraduationCap } from 'lucide-react';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

export function DataMaintenance() {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Manutenção e Importação de Dados
        </CardTitle>
        <CardDescription>
          Gerencie a importação em massa de cadastros e realize tarefas de limpeza de dados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import-students" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import-students" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Alunos (CSV)
            </TabsTrigger>
            <TabsTrigger value="import-teachers" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Professores (CSV)
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Avançado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import-students" className="mt-4">
            <StudentCSVImport />
          </TabsContent>
          
          <TabsContent value="import-teachers" className="mt-4">
            <TeacherCSVImport />
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <AdvancedSettings />
          </TabsContent>
        </Tabs>
      </CardContent>
    </GlassCard>
  );
}