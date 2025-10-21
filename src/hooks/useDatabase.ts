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
  ChromebookData,
  UserType, // Importando UserType
  TeacherData // Importando TeacherData atualizado
} from '@/types/database';

// Types for new entities
interface StudentData {
  nome_completo: string;
  ra: string;
  email: string;
  turma: string;
}

// TeacherData agora vem de '@/types/database'
// interface TeacherData {
//   nome_completo: string;
//   email: string;
//   materia?: string; // Adicionado
// }

interface StaffData {
  nome_completo: string;
  email: string;
}

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
      // Detect if DB has 'manufacturer' column by trying a lightweight select
      let hasManufacturer = true;
      try {
        const { error: colErr } = await supabase.from('chromebooks').select('manufacturer').limit(1);
        if (colErr) {
          hasManufacturer = false;
        }
      } catch (e) {
        hasManufacturer = false;
      }

      const payload: any = {
        chromebook_id: data.chromebookId,
        model: data.model,
        serial_number: data.serialNumber,
        patrimony_number: data.patrimonyNumber,
        status: data.status as any,
        condition: data.condition,
        location: data.location,
        classroom: data.classroom,
        created_by: user.id,
        is_deprovisioned: data.is_deprovisioned ?? false, // Adicionando is_deprovisioned
      };

      if (hasManufacturer) payload.manufacturer = (data as any).manufacturer;
      else {
        // fallback: store manufacturer value in serial_number if provided
        if ((data as any).manufacturer && !payload.serial_number) payload.serial_number = (data as any).manufacturer;
      }

      const { data: result, error } = await supabase
        .from('chromebooks')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Sucesso", description: "Chromebook cadastrado com sucesso" });
      return result as Chromebook;
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
      return (data || []) as Chromebook[];
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
      // Detect if DB has 'manufacturer' column
      let hasManufacturer = true;
      try {
        const { error: colErr } = await supabase.from('chromebooks').select('manufacturer').limit(1);
        if (colErr) hasManufacturer = false;
      } catch (e) {
        hasManufacturer = false;
      }

      const updatePayload: any = {
        chromebook_id: data.chromebookId,
        model: data.model,
        serial_number: data.serialNumber,
        patrimony_number: data.patrimonyNumber,
        status: data.status as any,
        condition: data.condition,
        location: data.location,
        classroom: data.classroom,
        is_deprovisioned: data.is_deprovisioned, // Adicionando is_deprovisioned
      };

      if (hasManufacturer) updatePayload.manufacturer = (data as any).manufacturer;
      else {
        if ((data as any).manufacturer && !updatePayload.serial_number) updatePayload.serial_number = (data as any).manufacturer;
      }

      const { error } = await supabase
        .from('chromebooks')
        .update(updatePayload)
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
  
  // Criação de empréstimos em lote
  const bulkCreateLoans = useCallback(async (loanDataList: LoanFormData[]): Promise<{ successCount: number, errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: loanDataList.length };
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    // Mapear IDs de Chromebooks para IDs internos do DB
    const chromebookIds = loanDataList.map(d => d.chromebookId);
    const { data: chromebooks, error: cbError } = await supabase
      .from('chromebooks')
      .select('id, chromebook_id, status')
      .in('chromebook_id', chromebookIds);

    if (cbError) {
      toast({ title: "Erro", description: "Falha ao buscar Chromebooks.", variant: "destructive" });
      setLoading(false);
      return { successCount: 0, errorCount: loanDataList.length };
    }

    const chromebookMap = new Map(chromebooks.map(cb => [cb.chromebook_id, cb]));
    const loansToInsert = [];

    for (const data of loanDataList) {
      const chromebook = chromebookMap.get(data.chromebookId);
      
      if (!chromebook || chromebook.status !== 'disponivel') {
        errorCount++;
        toast({ 
          title: "Erro no Lote", 
          description: `Chromebook ${data.chromebookId} não encontrado ou não está disponível.`, 
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
  
  // NOVO: Devolução em lote
  const bulkReturnChromebooks = useCallback(async (chromebookIds: string[], data: ReturnFormData): Promise<{ successCount: number, errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: chromebookIds.length };
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    // 1. Buscar IDs de empréstimos ativos para os Chromebooks fornecidos
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
    const returnsToInsert = [];

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
  
  // NOVO: Update Student
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
          email: data.email,
          materia: data.materia // ADICIONADO
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
  
  // NOVO: Update Teacher
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
  
  // NOVO: Update Staff
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
    updateChromebook,
    deleteChromebook,
    // Loan operations
    createLoan,
    bulkCreateLoans, // Exportando a nova função
    getActiveLoans,
    getLoanHistory,
    // Return operations
    createReturn,
    returnChromebookById,
    bulkReturnChromebooks, // Exportando a nova função
    // User/Registration operations
    createStudent,
    updateStudent, // NOVO
    bulkInsertStudents,
    deleteAllStudents,
    createTeacher,
    updateTeacher, // NOVO
    createStaff,
    updateStaff, // NOVO
    deleteUserRecord
  };
};