import React from 'react';
import { Users, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StudentForm } from './StudentForm';
import { StudentCSVImport } from './StudentCSVImport';

export function StudentRegistration() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-0 bg-transparent gap-4">
          <TabsTrigger
            value="individual"
            className="flex items-center justify-center gap-2 h-12 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] data-[state=active]:shadow-none data-[state=active]:translate-x-[2px] data-[state=active]:translate-y-[2px] uppercase font-black tracking-wide transition-all"
          >
            <Users className="h-4 w-4" />
            Cadastro Individual
          </TabsTrigger>
          <TabsTrigger
            value="csv"
            className="flex items-center justify-center gap-2 h-12 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] data-[state=active]:shadow-none data-[state=active]:translate-x-[2px] data-[state=active]:translate-y-[2px] uppercase font-black tracking-wide transition-all"
          >
            <Upload className="h-4 w-4" />
            Importação em Lote (CSV)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-6">
          <div className="bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-6">
            <StudentForm />
          </div>
        </TabsContent>

        <TabsContent value="csv" className="mt-6">
          <StudentCSVImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}