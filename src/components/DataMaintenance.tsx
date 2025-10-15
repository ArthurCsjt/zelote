import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StudentCSVImport } from './StudentCSVImport';
import { AdvancedSettings } from './AdvancedSettings';
import { Database, Upload, AlertTriangle } from 'lucide-react';
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
        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar Alunos (CSV)
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Avançado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4">
            <StudentCSVImport />
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <AdvancedSettings />
          </TabsContent>
        </Tabs>
      </CardContent>
    </GlassCard>
  );
}