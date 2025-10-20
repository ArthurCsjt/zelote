import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client'; 
import { useAuth } from './AuthContext';
import type { LoanHistoryItem, Chromebook, ChromebookData } from '../types/database'; // Ajuste o caminho se necessário

// Interface completa do que nosso contexto vai fornecer
interface DatabaseContextType {
  loading: boolean;
  getChromebooks: () => Promise<Chromebook[]>;
  updateChromebook: (id: string, data: Partial<ChromebookData>) => Promise<{ error: Error | null }>;
  deleteChromebook: (id: string) => Promise<{ error: Error | null }>;
  createChromebook: (data: Partial<ChromebookData>) => Promise<{ data: Chromebook | null, error: Error | null }>;
  getActiveLoans: () => Promise<LoanHistoryItem[]>;
  getLoanHistory: () => Promise<LoanHistoryItem[]>;
  createLoan: (data: any) => Promise<any>;
  returnChromebookById: (id: string, returnData: any) => Promise<boolean>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // --- FUNÇÕES REAIS DO BANCO DE DADOS ---

  const getChromebooks = useCallback(async (): Promise<Chromebook[]> => {
    setLoading(true);
    const { data, error } = await supabase.from('chromebooks').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      console.error(error);
      return [];
    }
    return data as Chromebook[];
  }, []);

  const updateChromebook = useCallback(async (id: string, updateData: Partial<ChromebookData>) => {
    setLoading(true);
    const { error } = await supabase.from('chromebooks').update(updateData).eq('id', id);
    setLoading(false);
    return { error: error ? new Error(error.message) : null };
  }, []);
  
  const deleteChromebook = useCallback(async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('chromebooks').delete().eq('id', id);
    setLoading(false);
    return { error: error ? new Error(error.message) : null };
  }, []);
  
  const createChromebook = useCallback(async (data: Partial<ChromebookData>) => {
    setLoading(true);
    const insertPayload: any = {
      model: data.model,
      serial_number: data.serialNumber,
      patrimony_number: data.patrimonyNumber,
      manufacturer: data.manufacturer,
      condition: data.condition || 'novo',
      location: data.location,
      status: 'disponivel' as const,
    };
    const { data: result, error } = await supabase.from('chromebooks').insert(insertPayload).select().single();
    setLoading(false);
    return { data: result, error: error ? new Error(error.message) : null };
  }, []);

  const getActiveLoans = useCallback(async (): Promise<LoanHistoryItem[]> => {
    // Implemente a busca real aqui
    return [];
  }, []);

  const getLoanHistory = useCallback(async (): Promise<LoanHistoryItem[]> => {
    // Implemente a busca real aqui
    return [];
  }, []);

  const createLoan = useCallback(async (data: any) => {
    return {};
  }, []);

  const returnChromebookById = useCallback(async (id: string, returnData: any): Promise<boolean> => {
    return true;
  }, []);

  const value = useMemo(() => ({ 
    loading, 
    getChromebooks, 
    updateChromebook,
    deleteChromebook,
    createChromebook,
    getActiveLoans, 
    getLoanHistory,
    createLoan,
    returnChromebookById
  }), [loading, getChromebooks, updateChromebook, deleteChromebook, createChromebook, getActiveLoans, getLoanHistory, createLoan, returnChromebookById]);

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};