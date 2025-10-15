import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChromebookInventory } from './ChromebookInventory';
import { UserInventory } from './UserInventory';
interface InventoryHubProps {
  onBack?: () => void;
}
export function InventoryHub({
  onBack
}: InventoryHubProps) {
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6 text-center">
          <h1 className="text-foreground py-[2px] font-bold text-2xl my-[25px] text-gray-800">Hub de Inventário</h1>
        </div>

        <Tabs defaultValue="equipments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="equipments" className="space-y-4">
            <ChromebookInventory onBack={onBack} />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserInventory />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}