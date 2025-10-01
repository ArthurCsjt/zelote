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
  createChromebook: (data: Partial<ChromebookData>) => Promise<{ data: any | null, error: Error | null }>;
  getActiveLoans: () => Promise<LoanHistoryItem[]>;
  getLoanHistory: () => Promise<LoanHistoryItem[]>;
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
    // Generate chromebook_id from patrimony_number or a unique identifier
    const chromebookId = data.patrimonyNumber || `CB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Map from ChromebookData (camelCase) to database schema (snake_case)
    const insertPayload = {
      chromebook_id: chromebookId,
      model: data.model,
      manufacturer: data.manufacturer,
      serial_number: data.serialNumber,
      patrimony_number: data.patrimonyNumber,
      status: data.status || 'disponivel',
      condition: data.condition,
      location: data.location,
      classroom: data.classroom,
    };
    const { data: result, error } = await supabase.from('chromebooks').insert(insertPayload).select().single();
    setLoading(false);
    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data: result, error: null };
  }, []);

  const getActiveLoans = useCallback(async (): Promise<LoanHistoryItem[]> => {
    // Implemente a busca real aqui
    return [];
  }, []);

  const getLoanHistory = useCallback(async (): Promise<LoanHistoryItem[]> => {
    // Implemente a busca real aqui
    return [];
  }, []);

  const value = useMemo(() => ({ 
    loading, 
    getChromebooks, 
    updateChromebook,
    deleteChromebook,
    createChromebook,
    getActiveLoans, 
    getLoanHistory 
  }), [loading, getChromebooks, updateChromebook, deleteChromebook, createChromebook, getActiveLoans, getLoanHistory]);

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