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
}

export const TabbedContent: React.FC<TabbedContentProps> = ({
  tabs,
  defaultValue,
  className,
  listClassName,
  contentClassName,
}) => {
  const gridCols = `grid-cols-${tabs.length}`;

  return (
    <Tabs defaultValue={defaultValue} className={cn("w-full", className)}>
      <TabsList className={cn(`grid w-full ${gridCols}`, listClassName)}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
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