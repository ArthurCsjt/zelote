import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { 
  Loan, 
  Return, 
  LoanFormData, 
  ReturnFormData, 
  LoanHistoryItem,
  UserType, // Importando UserType
  Chromebook // Importando Chromebook
} from '@/types/database';

// Tipos para a criação de Chromebook
interface ChromebookCreationData {
  model: string;
  serialNumber: string;
  patrimonyNumber?: string;
  manufacturer: string;
  condition?: string;
  location?: string;
  status: 'disponivel' | 'emprestado' | 'fixo' | 'fora_uso' | 'manutencao';
  is_deprovisioned?: boolean;
  classroom?: string;
}

// Types for new entities
interface StudentData {
  nome_completo: string;
  ra: string;
  email: string;
  turma: string;
}

interface TeacherData {
  nome_completo: string;
  email: string;
}

interface StaffData {
  nome_completo: string;
  email: string;
}

export const useDatabase = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Função auxiliar para buscar um Chromebook por qualquer identificador
  const findChromebook = useCallback(async (identifier: string) => {
    console.log(`[DB] Tentando encontrar Chromebook com identificador: ${identifier}`);
    const { data: chromebook, error } = await supabase
      .from('chromebooks')
      .select('id, chromebook_id, status')
      .or(
        [
          `chromebook_id.eq.${identifier}`,
          `serial_number.eq.${identifier}`,
          `patrimony_number.eq.${identifier}`,
        ].join(',')
      )
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error(`[DB] Erro ao buscar Chromebook: ${error.message}`);
      throw error;
    }
    if (!chromebook) {
      console.log(`[DB] Chromebook ${identifier} não encontrado.`);
    }
    return chromebook;
  }, []);

  // Chromebook operations
  const createChromebook = useCallback(async (data: ChromebookCreationData): Promise<Chromebook | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('chromebooks')
        .insert({
          model: data.model,
          serial_number: data.serialNumber,
          patrimony_number: data.patrimonyNumber,
          manufacturer: data.manufacturer,
          condition: data.condition,
          location: data.location,
          status: data.status,
          is_deprovisioned: data.is_deprovisioned,
          classroom: data.classroom,
          created_by: user.id,
          // chromebook_id será gerado por trigger no DB
        })
        .select()
        .single();

      if (error) throw error;
      
      // O toast de sucesso será disparado no componente de registro
      return result as Chromebook;
    } catch (error: any) {
      console.error('Erro ao criar Chromebook:', error);
      toast({ 
        title: "Erro ao cadastrar Chromebook", 
        description: error.message.includes('duplicate key') ? 'Número de Série ou Patrimônio já cadastrado.' : error.message, 
        variant: "destructive" 
      });
      return null;
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
      // Buscar o chromebook pelo ID, Serial ou Patrimônio
      const chromebook = await findChromebook(data.chromebookId);

      if (!chromebook) {
        throw new Error(`Chromebook com ID/Série/Patrimônio "${data.chromebookId}" não encontrado.`);
      }
      
      if (chromebook.status !== 'disponivel') {
        throw new Error(`Chromebook ${chromebook.chromebook_id} não está disponível (Status: ${chromebook.status}).`);
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
        description: `Chromebook ${chromebook.chromebook_id} emprestado para ${data.studentName}` 
      });
      return result;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, findChromebook]);
  
  // Criação de empréstimos em lote
  const bulkCreateLoans = useCallback(async (loanDataList: LoanFormData[]): Promise<{ successCount: number, errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: loanDataList.length };
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    const loansToInsert = [];

    for (const data of loanDataList) {
      try {
        // Buscar o chromebook pelo ID, Serial ou Patrimônio
        const chromebook = await findChromebook(data.chromebookId);

        if (!chromebook) {
          errorCount++;
          toast({ 
            title: "Erro no Lote", 
            description: `Chromebook ${data.chromebookId} não encontrado.`, 
            variant: "destructive" 
          });
          continue;
        }
        
        if (chromebook.status !== 'disponivel') {
          errorCount++;
          toast({ 
            title: "Erro no Lote", 
            description: `Chromebook ${chromebook.chromebook_id} não está disponível (Status: ${chromebook.status}).`, 
            variant: "destructive" 
          });
          continue;
        }

        loansToInsert.push({
          chromebook_id: chromebook.id,
          student_name: data.studentName,
          student_ra: data.ra,
          student_email: data.email,
          purpose: data.purpose,
          user_type: data.userType,
          loan_type: data.loanType,
          expected_return_date: data.expectedReturnDate?.toISOString(),
          created_by: user.id
        });
        
      } catch (e: any) {
        errorCount++;
        toast({ 
          title: "Erro no Lote", 
          description: `Falha ao processar ${data.chromebookId}: ${e.message}`, 
          variant: "destructive" 
        });
      }
    }
    
    if (loansToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('loans')
        .insert(loansToInsert);

      if (insertError) {
        console.error('Erro de inserção em lote:', insertError);
        toast({ 
          title: "Erro de Inserção", 
          description: `Falha ao inserir ${loansToInsert.length} empréstimos.`, 
          variant: "destructive" 
        });
        errorCount += loansToInsert.length;
      } else {
        successCount = loansToInsert.length;
      }
    }

    setLoading(false);
    return { successCount, errorCount: loanDataList.length - successCount };
  }, [user, findChromebook]);


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
        status: item.status as 'ativo' | 'devolvido' | 'atrasado'
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
        status: item.status as 'ativo' | 'devolvido' | 'atrasado'
      }));
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  const getChromebooks = useCallback(async (): Promise<Chromebook[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chromebooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Chromebook[];
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
      // Buscar o empréstimo ativo usando a função auxiliar para flexibilidade
      const chromebook = await findChromebook(chromebookId);
      
      if (!chromebook) {
        throw new Error(`Chromebook com ID/Série/Patrimônio "${chromebookId}" não encontrado.`);
      }
      
      // Buscar o empréstimo ativo pelo ID interno do Chromebook
      const { data: activeLoan, error: loanError } = await supabase
        .from('loan_history')
        .select('id')
        .eq('chromebook_id', chromebook.chromebook_id) // Usamos o chromebook_id amigável aqui, pois loan_history usa ele
        .eq('status', 'ativo')
        .single();

      if (loanError || !activeLoan) {
        throw new Error(`Chromebook ${chromebook.chromebook_id} não está emprestado.`);
      }

      const result = await createReturn(activeLoan.id, data);
      return !!result;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [createReturn, findChromebook]);
  
  // Devolução em lote
  const bulkReturnChromebooks = useCallback(async (chromebookIds: string[], data: ReturnFormData): Promise<{ successCount: number, errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: chromebookIds.length };
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const returnsToInsert = [];

    // 1. Buscar IDs de empréstimos ativos para os Chromebooks fornecidos
    // Nota: A view loan_history usa o chromebook_id (CHRxxx) e não o UUID (id)
    const { data: activeLoans, error: loanError } = await supabase
      .from('loan_history')
      .select('id, chromebook_id')
      .in('chromebook_id', chromebookIds)
      .eq('status', 'ativo');

    if (loanError) {
      toast({ title: "Erro", description: "Falha ao buscar empréstimos ativos.", variant: "destructive" });
      setLoading(false);
      return { successCount: 0, errorCount: chromebookIds.length };
    }
    
    const loanMap = new Map(activeLoans.map(loan => [loan.chromebook_id, loan.id]));

    for (const chromebookId of chromebookIds) {
      const loanId = loanMap.get(chromebookId);
      
      if (!loanId) {
        errorCount++;
        toast({ 
          title: "Erro no Lote", 
          description: `Chromebook ${chromebookId} não está ativo para devolução.`, 
          variant: "destructive" 
        });
        continue;
      }

      returnsToInsert.push({
        loan_id: loanId,
        returned_by_name: data.name,
        returned_by_ra: data.ra,
        returned_by_email: data.email,
        returned_by_type: data.userType,
        created_by: user.id
      });
    }
    
    if (returnsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('returns')
        .insert(returnsToInsert);

      if (insertError) {
        console.error('Erro de inserção de devolução em lote:', insertError);
        toast({ 
          title: "Erro de Inserção", 
          description: `Falha ao inserir ${returnsToInsert.length} devoluções.`, 
          variant: "destructive" 
        });
        errorCount += returnsToInsert.length;
      } else {
        successCount = returnsToInsert.length;
      }
    }

    setLoading(false);
    return { successCount, errorCount: chromebookIds.length - successCount };
  }, [user]);


  // Student operations
  const createStudent = useCallback(async (data: StudentData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('alunos')
        .insert({
          nome_completo: data.nome_completo,
          ra: data.ra,
          email: data.email,
          turma: data.turma
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('Erro ao criar aluno:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Update Student
  const updateStudent = useCallback(async (id: string, data: Partial<StudentData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('alunos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Aluno atualizado com sucesso" });
      return true;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


  // Teacher operations
  const createTeacher = useCallback(async (data: TeacherData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('professores')
        .insert({
          nome_completo: data.nome_completo,
          email: data.email
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('Erro ao criar professor:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Update Teacher
  const updateTeacher = useCallback(async (id: string, data: Partial<TeacherData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('professores')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Professor atualizado com sucesso" });
      return true;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


  // Staff operations
  const createStaff = useCallback(async (data: StaffData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('funcionarios')
        .insert({
          nome_completo: data.nome_completo,
          email: data.email
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Update Staff
  const updateStaff = useCallback(async (id: string, data: Partial<StaffData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('funcionarios')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Funcionário atualizado com sucesso" });
      return true;
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


  // Bulk operations
  const bulkInsertStudents = useCallback(async (students: StudentData[]): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('alunos')
        .insert(students);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Erro ao importar alunos:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete all students
  const deleteAllStudents = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('alunos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) throw error;
      
      toast({ 
        title: "Sucesso", 
        description: "Todos os alunos foram excluídos com sucesso." 
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir alunos:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao excluir os alunos do sistema.", 
        variant: "destructive" 
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Função unificada para exclusão de usuários (Aluno, Professor, Funcionário)
  const deleteUserRecord = useCallback(async (id: string, userType: UserType): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    const tableName = userType === 'aluno' ? 'alunos' : 
                     userType === 'professor' ? 'professores' : 
                     'funcionarios';

    setLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: `${userType.charAt(0).toUpperCase() + userType.slice(1)} excluído com sucesso.` });
      return true;
    } catch (error: any) {
      console.error(`Erro ao excluir ${userType}:`, error);
      toast({ 
        title: "Erro", 
        description: `Falha ao excluir ${userType}: ${error.message}`, 
        variant: "destructive" 
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


  return {
    loading,
    // Chromebook operations
    createChromebook,
    getChromebooks,
    // Loan operations
    createLoan,
    bulkCreateLoans,
    getActiveLoans,
    getLoanHistory,
    // Return operations
    createReturn,
    returnChromebookById,
    bulkReturnChromebooks,
    // User/Registration operations
    createStudent,
    updateStudent,
    bulkInsertStudents,
    deleteAllStudents,
    createTeacher,
    updateTeacher,
    createStaff,
    updateStaff,
    deleteUserRecord
  };
};