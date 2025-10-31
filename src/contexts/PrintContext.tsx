import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Chromebook } from '@/types/database';

interface PrintContextType {
  printItems: Chromebook[];
  setPrintItems: (items: Chromebook[]) => void;
}

export const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const usePrintContext = () => {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrintContext must be used within a PrintProvider');
  }
  return context;
};

export const PrintProvider = ({ children }: { children: ReactNode }) => {
  const [printItems, setPrintItems] = useState<Chromebook[]>([]);

  return (
    <PrintContext.Provider value={{ printItems, setPrintItems }}>
      {children}
    </PrintContext.Provider>
  );
};