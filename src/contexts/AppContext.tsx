
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Chromebook {
  id: string;
  patrimonio: string;
  modelo: string;
  serie: string;
  anoFabricacao: string;
  status: 'disponivel' | 'emprestado' | 'manutencao' | 'inativo';
  equipamentoProvisorizado: boolean;
  observacoes?: string;
}

interface AppContextType {
  chromebooks: Chromebook[];
  updateChromebookStatus: (id: string, status: string) => void;
  updateChromebook: (id: string, data: Partial<Chromebook>) => void;
  deleteChromebook: (id: string) => void;
  addChromebook: (chromebook: Omit<Chromebook, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([
    {
      id: '1',
      patrimonio: 'CHR001',
      modelo: 'Chromebook 14a',
      serie: 'ABC123456',
      anoFabricacao: '2023',
      status: 'disponivel',
      equipamentoProvisorizado: false,
      observacoes: 'Equipamento em perfeito estado'
    },
    {
      id: '2',
      patrimonio: 'CHR002',
      modelo: 'Chromebook 15',
      serie: 'DEF789012',
      anoFabricacao: '2022',
      status: 'emprestado',
      equipamentoProvisorizado: true,
    }
  ]);

  const updateChromebookStatus = (id: string, status: string) => {
    setChromebooks(prev => 
      prev.map(chromebook => 
        chromebook.id === id 
          ? { ...chromebook, status: status as Chromebook['status'] }
          : chromebook
      )
    );
  };

  const updateChromebook = (id: string, data: Partial<Chromebook>) => {
    setChromebooks(prev => 
      prev.map(chromebook => 
        chromebook.id === id 
          ? { ...chromebook, ...data }
          : chromebook
      )
    );
  };

  const deleteChromebook = (id: string) => {
    setChromebooks(prev => prev.filter(chromebook => chromebook.id !== id));
  };

  const addChromebook = (chromebook: Omit<Chromebook, 'id'>) => {
    const newChromebook: Chromebook = {
      ...chromebook,
      id: Date.now().toString()
    };
    setChromebooks(prev => [...prev, newChromebook]);
  };

  const value: AppContextType = {
    chromebooks,
    updateChromebookStatus,
    updateChromebook,
    deleteChromebook,
    addChromebook
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
