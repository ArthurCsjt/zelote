import React from 'react';
import { ChromebookInventory } from './ChromebookInventory';
import { UserInventory } from './UserInventory';
import { TabbedContent } from './TabbedContent'; // Importando o novo componente
import { SectionHeader } from './Shared/SectionHeader'; // Importando SectionHeader
import { Laptop } from 'lucide-react';

interface InventoryHubProps {
  onBack?: () => void;
  onGenerateQrCode: (chromebookId: string) => void; // NOVO PROP
}

// ... imports (mantidos)

export function InventoryHub({ onBack, onGenerateQrCode }: InventoryHubProps) {
  const inventoryTabs = [
    {
      value: 'equipments',
      title: 'Equipamentos',
      content: <ChromebookInventory onBack={onBack} onGenerateQrCode={onGenerateQrCode} />,
    },
    {
      value: 'users',
      title: 'Usuários',
      content: <UserInventory />,
    },
  ];

  return (
    <div className="min-h-screen relative py-[30px]">
      { /* Background grid pattern like DashboardLayout */}
      <div className="absolute inset-0 -z-10 bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto p-4 max-w-7xl relative z-10">
        <div className="mb-8 text-center p-6 border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
          <SectionHeader
            title="HUB DE INVENTÁRIO"
            description="VISUALIZE E GERENCIE EQUIPAMENTOS E USUÁRIOS CADASTRADOS"
            icon={Laptop}
            iconColor="text-black dark:text-white"
            className="flex flex-col items-center uppercase tracking-tight font-black"
          />
        </div>

        <TabbedContent
          tabs={inventoryTabs}
          defaultValue="equipments"
          listClassName="grid-cols-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
      </div>
    </div>
  );
}