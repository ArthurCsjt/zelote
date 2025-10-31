import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Chromebook } from '@/types/database';

interface PrintContextType {
  printItems: Chromebook[];
  addItemToPrint: (item: Chromebook) => void;
  removeItemFromPrint: (itemId: string) => void;
  clearPrintItems: () => void;
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

  const addItemToPrint = useCallback((item: Chromebook) => {
    setPrintItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItemFromPrint = useCallback((itemId: string) => {
    setPrintItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const clearPrintItems = useCallback(() => {
    setPrintItems([]);
  }, []);

  return (
    <PrintContext.Provider value={{ printItems, addItemToPrint, removeItemFromPrint, clearPrintItems }}>
      {children}
    </PrintContext.Provider>
  );
};