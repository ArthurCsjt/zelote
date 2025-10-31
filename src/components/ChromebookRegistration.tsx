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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Cadastro Manual
          </TabsTrigger>
          <TabsTrigger value="intelligent" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Cadastro Inteligente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <ManualChromebookForm onRegistrationSuccess={onRegistrationSuccess} />
        </TabsContent>
        
        <TabsContent value="intelligent" className="space-y-4 mt-4">
          <IntelligentChromebookForm onRegistrationSuccess={onRegistrationSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}