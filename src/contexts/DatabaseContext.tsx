import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client'; 
import { useAuth } from './AuthContext';
import type { LoanHistoryItem, Chromebook, ChromebookData, LoanFormData } from '../types/database';

// Interface completa do que nosso contexto vai fornecer
interface DatabaseContextType {
  loading: boolean;
  getChromebooks: () => Promise<Chromebook[]>;
  updateChromebook: (id: string, data: Partial<ChromebookData>) => Promise<{ error: Error | null }>;
  deleteChromebook: (id: string) => Promise<{ error: Error | null }>;
  createChromebook: (data: Partial<ChromebookData>) => Promise<{ data: any | null, error: Error | null }>;
  getActiveLoans: () => Promise<LoanHistoryItem[]>;
  getLoanHistory: () => Promise<LoanHistoryItem[]>;
  createLoan: (data: LoanFormData) => Promise<any>;
  returnChromebookById: (chromebookId: string) => Promise<void>;
  deleteAllStudents: () => Promise<boolean>;
  createStudent: (data: any) => Promise<boolean>;
  createTeacher: (data: any) => Promise<boolean>;
  createStaff: (data: any) => Promise<boolean>;
  bulkInsertStudents: (students: any[]) => Promise<boolean>;
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
    const insertPayload: any = { ...data, manufacturer: data.manufacturer };
    const { data: result, error } = await supabase.from('chromebooks').insert([insertPayload]).select().single();
    setLoading(false);
    return { data: result, error: error ? new Error(error.message) : null };
  }, [user]);

  const getActiveLoans = useCallback(async (): Promise<LoanHistoryItem[]> => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loan_history')
      .select('*')
      .is('return_date', null)
      .order('loan_date', { ascending: false });
    setLoading(false);
    if (error) {
      console.error(error);
      return [];
    }
    return data as LoanHistoryItem[];
  }, []);

  const getLoanHistory = useCallback(async (): Promise<LoanHistoryItem[]> => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loan_history')
      .select('*')
      .order('loan_date', { ascending: false });
    setLoading(false);
    if (error) {
      console.error(error);
      return [];
    }
    return data as LoanHistoryItem[];
  }, []);

  const createLoan = useCallback(async (data: LoanFormData) => {
    setLoading(true);
    const loanData: any = {
      chromebook_id: data.chromebookId,
      student_name: data.studentName,
      student_email: data.email,
      student_ra: data.ra,
      purpose: data.purpose,
      user_type: data.userType,
      loan_type: data.loanType,
      expected_return_date: data.expectedReturnDate?.toISOString()
    };
    const { data: result, error } = await supabase
      .from('loan_history' as any)
      .insert([loanData])
      .select()
      .single();
    setLoading(false);
    if (error) {
      console.error(error);
      return null;
    }
    return result;
  }, []);

  const returnChromebookById = useCallback(async (chromebookId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('loan_history' as any)
      .update({ return_date: new Date().toISOString() })
      .eq('chromebook_id', chromebookId)
      .is('return_date', null);
    setLoading(false);
    if (error) {
      console.error(error);
    }
  }, []);

  const deleteAllStudents = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setLoading(false);
    console.log('deleteAllStudents not implemented');
    return false;
  }, []);

  const createStudent = useCallback(async (data: any): Promise<boolean> => {
    setLoading(true);
    setLoading(false);
    console.log('createStudent not implemented', data);
    return false;
  }, []);

  const createTeacher = useCallback(async (data: any): Promise<boolean> => {
    setLoading(true);
    setLoading(false);
    console.log('createTeacher not implemented', data);
    return false;
  }, []);

  const createStaff = useCallback(async (data: any): Promise<boolean> => {
    setLoading(true);
    setLoading(false);
    console.log('createStaff not implemented', data);
    return false;
  }, []);

  const bulkInsertStudents = useCallback(async (students: any[]): Promise<boolean> => {
    setLoading(true);
    setLoading(false);
    console.log('bulkInsertStudents not implemented', students);
    return false;
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
    returnChromebookById,
    deleteAllStudents,
    createStudent,
    createTeacher,
    createStaff,
    bulkInsertStudents
  }), [
    loading, 
    getChromebooks, 
    updateChromebook,
    deleteChromebook,
    createChromebook,
    getActiveLoans, 
    getLoanHistory,
    createLoan,
    returnChromebookById,
    deleteAllStudents,
    createStudent,
    createTeacher,
    createStaff,
    bulkInsertStudents
  ]);

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
