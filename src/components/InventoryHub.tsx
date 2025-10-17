import React from 'react';
import { ChromebookInventory } from './ChromebookInventory';
import { UserInventory } from './UserInventory';
import { TabbedContent } from './TabbedContent'; // Importando o novo componente

interface InventoryHubProps {
  onBack?: () => void;
}

export function InventoryHub({ onBack }: InventoryHubProps) {
  const inventoryTabs = [
    {
      value: 'equipments',
      title: 'Equipamentos',
      content: <ChromebookInventory onBack={onBack} />,
    },
    {
      value: 'users',
      title: 'Usuários',
      content: <UserInventory />,
    },
  ];

  return (
    <div className="bg-background"> {/* Removido min-h-screen */}
      <div className="container mx-auto p-0 max-w-7xl"> {/* Removido padding p-4, mantendo o p-0 para o TabbedContent gerenciar */}
        <div className="mb-6 text-center">
          <h1 className="text-foreground py-[2px] font-bold text-2xl my-[25px] text-gray-800">Hub de Inventário</h1>
        </div>

        <TabbedContent
          tabs={inventoryTabs}
          defaultValue="equipments"
          listClassName="grid-cols-2"
        />
      </div>
    </div>
  );
}