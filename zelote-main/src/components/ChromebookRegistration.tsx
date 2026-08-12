import React from 'react';
import { Laptop, QrCode } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ManualChromebookForm } from './ManualChromebookForm';
import { IntelligentChromebookForm } from './IntelligentChromebookForm';

interface ChromebookRegistrationProps {
  onRegistrationSuccess: (newChromebook: any) => void;
}

export function ChromebookRegistration({ onRegistrationSuccess }: ChromebookRegistrationProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-0 bg-transparent gap-6">
          <TabsTrigger
            value="manual"
            className="flex items-center justify-center gap-2 h-14 border-3 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] data-[state=active]:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] data-[state=active]:translate-x-[3px] data-[state=active]:translate-y-[3px] uppercase font-black tracking-wide transition-all"
          >
            <Laptop className="h-5 w-5" />
            Cadastro Manual
          </TabsTrigger>
          <TabsTrigger
            value="intelligent"
            className="flex items-center justify-center gap-2 h-14 border-3 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] data-[state=active]:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] data-[state=active]:translate-x-[3px] data-[state=active]:translate-y-[3px] uppercase font-black tracking-wide transition-all"
          >
            <QrCode className="h-5 w-5" />
            Cadastro Inteligente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-8">
          <div className="bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-8">
            <ManualChromebookForm onRegistrationSuccess={onRegistrationSuccess} />
          </div>
        </TabsContent>

        <TabsContent value="intelligent" className="mt-8">
          <div className="bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-8">
            <IntelligentChromebookForm onRegistrationSuccess={onRegistrationSuccess} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}