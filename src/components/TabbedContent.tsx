import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TabItem {
  value: string;
  title: React.ReactNode;
  content: React.ReactNode;
}



interface TabbedContentProps {
  tabs: TabItem[];
  defaultValue: string;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const TabbedContent: React.FC<TabbedContentProps> = ({
  tabs,
  defaultValue,
  className,
  listClassName,
  contentClassName,
  value,
  onValueChange
}) => {
  const gridCols = `grid-cols-${tabs.length}`;

  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      {/* Ajustando o TabsList para o estilo Neo-Brutalista com bordas e sombra */}
      <TabsList className={cn(
        `grid w-full ${gridCols} p-0 h-auto rounded-none gap-0`,
        "border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]",
        listClassName
      )}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "font-black uppercase tracking-tight py-3 transition-all duration-200 rounded-none",
              "border-r-4 border-black dark:border-white last:border-r-0", // Separador vertical
              "bg-white dark:bg-zinc-900 text-muted-foreground dark:text-muted-foreground", // Estado inativo
              "data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black", // Estado ativo
              "data-[state=active]:shadow-none data-[state=active]:translate-x-0 data-[state=active]:translate-y-0", // Remove sombra/movimento no ativo
              "hover:bg-gray-100 dark:hover:bg-zinc-800" // Hover sutil
            )}
          >
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className={cn("space-y-4 mt-6", contentClassName)}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};