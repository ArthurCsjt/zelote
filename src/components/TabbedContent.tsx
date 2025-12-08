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
      <TabsList className={cn(`grid w-full ${gridCols} p-1 h-auto rounded-none gap-1 bg-gray-100 dark:bg-zinc-800 border-2 border-black dark:border-white`, listClassName)}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-none border-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white font-black uppercase tracking-tight py-2 transition-all duration-200"
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