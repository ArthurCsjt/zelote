import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { 
  Chromebook, 
  Loan, 
  Return, 
  LoanFormData, 
  ReturnFormData, 
  LoanHistoryItem,
  ChromebookData 
} from '@/types/database';

export const useDatabase = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Chromebook operations
  const createChromebook = useCallback(async (data: ChromebookData): Promise<Chromebook | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('chromebooks')
        .insert({
          chromebook_id: data.chromebookId,
          model: data.model,
          serial_number: data.serialNumber,
          patrimony_number: data.patrimonyNumber,
          status: data.status,
          condition: data.condition,
          location: data.location,
          classroom: data.classroom,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Chromebook cadastrado com sucesso" });
      return result;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getChromebooks = useCallback(async (): Promise<Chromebook[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chromebooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChromebook = useCallback(async (id: string, data: Partial<ChromebookData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chromebooks')
        .update({
          chromebook_id: data.chromebookId,
          model: data.model,
          serial_number: data.serialNumber,
          patrimony_number: data.patrimonyNumber,
          status: data.status,
          condition: data.condition,
          location: data.location,
          classroom: data.classroom
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Chromebook atualizado com sucesso" });
      return true;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteChromebook = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chromebooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Chromebook excluído com sucesso" });
      return true;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Loan operations
  const createLoan = useCallback(async (data: LoanFormData): Promise<Loan | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      // Buscar o chromebook pelo ID
      const { data: chromebook, error: chromebookError } = await supabase
        .from('chromebooks')
        .select('id')
        .eq('chromebook_id', data.chromebookId)
        .eq('status', 'disponivel')
        .single();

      if (chromebookError || !chromebook) {
        throw new Error('Chromebook não encontrado ou não está disponível');
      }

      const { data: result, error } = await supabase
        .from('loans')
        .insert({
          chromebook_id: chromebook.id,
          student_name: data.studentName,
          student_ra: data.ra,
          student_email: data.email,
          purpose: data.purpose,
          user_type: data.userType,
          loan_type: data.loanType,
          expected_return_date: data.expectedReturnDate?.toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({ 
        title: "Empréstimo registrado", 
        description: `Chromebook ${data.chromebookId} emprestado para ${data.studentName}` 
      });
      return result;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getActiveLoans = useCallback(async (): Promise<LoanHistoryItem[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loan_history')
        .select('*')
        .eq('status', 'ativo')
        .order('loan_date', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'ativo' | 'devolvido'
      }));
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getLoanHistory = useCallback(async (): Promise<LoanHistoryItem[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loan_history')
        .select('*')
        .order('loan_date', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'ativo' | 'devolvido'
      }));
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Return operations
  const createReturn = useCallback(async (loanId: string, data: ReturnFormData): Promise<Return | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('returns')
        .insert({
          loan_id: loanId,
          returned_by_name: data.name,
          returned_by_ra: data.ra,
          returned_by_email: data.email,
          returned_by_type: data.userType,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({ 
        title: "Chromebook devolvido", 
        description: `Devolvido por ${data.name}` 
      });
      return result;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const returnChromebookById = useCallback(async (chromebookId: string, data: ReturnFormData): Promise<boolean> => {
    setLoading(true);
    try {
      // Buscar o empréstimo ativo
      const { data: activeLoan, error: loanError } = await supabase
        .from('loan_history')
        .select('id')
        .eq('chromebook_id', chromebookId)
        .eq('status', 'ativo')
        .single();

      if (loanError || !activeLoan) {
        throw new Error('Chromebook não encontrado ou não está emprestado');
      }

      const result = await createReturn(activeLoan.id, data);
      return !!result;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [createReturn]);

  return {
    loading,
    // Chromebook operations
    createChromebook,
    getChromebooks,
    updateChromebook,
    deleteChromebook,
    // Loan operations
    createLoan,
    getActiveLoans,
    getLoanHistory,
    // Return operations
    createReturn,
    returnChromebookById
  };
};