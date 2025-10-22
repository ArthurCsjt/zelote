import React from 'react';
import { ChromebookInventory } from './ChromebookInventory';
import { UserInventory } from './UserInventory';
import { TabbedContent } from './TabbedContent'; // Importando o novo componente

interface InventoryHubProps {
  onBack?: () => void;
  onGenerateQrCode: (chromebookId: string) => void; // NOVO PROP
}

export function InventoryHub({ onBack, onGenerateQrCode }: InventoryHubProps) {
  const inventoryTabs = [
    {
      value: 'equipments',
      title: 'Equipamentos',
      content: <ChromebookInventory onBack={onBack} onGenerateQrCode={onGenerateQrCode} />, // PASSANDO O PROP
    },
    {
      value: 'users',
      title: 'Usuários',
      content: <UserInventory />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
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