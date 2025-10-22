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
  
  // Função para sincronizar o status do Chromebook
  const syncChromebookStatus = useCallback(async (chromebookId: string): Promise<string | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('sync_chromebook_status', { cb_id: chromebookId });
      
      if (error) throw error;
      
      toast({ title: "Sincronização Concluída", description: data });
      return data;
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: error.message, variant: "destructive" });
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
    
    try {
      // Mapear IDs de Chromebooks para IDs internos do DB
      const chromebookIds = loanDataList.map(d => d.chromebookId);
      const { data: chromebooks, error: cbError } = await supabase
        .from('chromebooks')
        .select('id, chromebook_id, status')
        .in('chromebook_id', chromebookIds);

      if (cbError) {
        throw new Error("Falha ao buscar Chromebooks.");
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
          throw new Error(`Falha ao inserir ${loansToInsert.length} empréstimos.`);
        } else {
          successCount = loansToInsert.length;
        }
      }
    } catch (e: any) {
      toast({ 
        title: "Erro de Processamento", 
        description: e.message, 
        variant: "destructive" 
      });
      errorCount = loanDataList.length - successCount; // Recalcula erros
    } finally {
      setLoading(false);
    }

    return { successCount, errorCount: loanDataList.length - successCount };
  }, [user]);


  const getActiveLoans = useCallback(async (): Promise<LoanHistoryItem[]> => {
    setLoading(true);
    try {
      // Usando a view loan_history para obter empréstimos ativos
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
  const createReturn = useCallback(async (loanId: string, data: ReturnFormData & { notes?: string }): Promise<Return | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    // Não definimos loading aqui, pois ele é gerenciado pelo bulkReturnChromebooks
    try {
      const { data: result, error } = await supabase
        .from('returns')
        .insert({
          loan_id: loanId,
          returned_by_name: data.name,
          returned_by_ra: data.ra,
          returned_by_email: data.email,
          returned_by_type: data.userType,
          notes: data.notes, // Incluindo notas
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Não toastamos aqui, pois o bulkReturnChromebooks fará o toast de sucesso em lote
      return result;
    } catch (error: any) {
      // Não toastamos aqui, pois o bulkReturnChromebooks fará o toast de erro em lote
      throw error; // Propaga o erro para o chamador
    }
  }, [user]);
  
  // NOVO: Função para forçar a devolução de um empréstimo (usado no painel de atrasos)
  const forceReturnLoan = useCallback(async (loan: LoanHistoryItem): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    
    // CRÍTICO: Verificar se o loan.id é válido antes de prosseguir
    if (!loan.id) {
        toast({ title: "Erro de Dados", description: "ID do empréstimo não encontrado. Não é possível forçar a devolução.", variant: "destructive" });
        return false;
    }

    setLoading(true);
    try {
      // 1. Criar o registro de devolução
      const returnData: ReturnFormData & { notes?: string } = {
        name: user.email?.split('@')[0] || 'Admin',
        email: user.email || 'admin@system.com',
        type: loan.loan_type,
        userType: 'funcionario', // Assumindo que o admin é um funcionário
        notes: `Devolução forçada pelo administrador para corrigir inconsistência. Empréstimo original para: ${loan.student_name} (${loan.student_email}).`
      };
      
      const { error: returnError } = await supabase
        .from('returns')
        .insert({
          loan_id: loan.id,
          returned_by_name: returnData.name,
          returned_by_email: returnData.email,
          returned_by_type: returnData.userType,
          notes: returnData.notes,
          created_by: user.id,
          return_date: new Date().toISOString(), // Data de devolução é agora
        });

      if (returnError) throw returnError;
      
      // 2. Sincronizar o status do Chromebook (o trigger já deve fazer isso, mas forçamos para garantir)
      const { data: chromebookData, error: cbError } = await supabase
        .from('chromebooks')
        .select('chromebook_id')
        .eq('id', loan.chromebook_id)
        .single();
        
      if (cbError || !chromebookData) {
          console.warn(`Chromebook ID ${loan.chromebook_id} não encontrado para sincronização após devolução forçada.`);
      } else {
          await supabase.rpc('sync_chromebook_status', { cb_id: chromebookData.chromebook_id });
      }

      toast({ 
        title: "Devolução Forçada", 
        description: `Empréstimo do Chromebook ${loan.chromebook_id} marcado como devolvido.`, 
        variant: "success" 
      });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao forçar devolução", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


  const returnChromebookById = useCallback(async (chromebookId: string, data: ReturnFormData): Promise<boolean> => {
    // Esta função não é mais usada no fluxo principal, mas mantida por segurança
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
  const bulkReturnChromebooks = useCallback(async (chromebookIds: string[], data: ReturnFormData & { notes?: string }): Promise<{ successCount: number, errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: chromebookIds.length };
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // 1. Buscar IDs de empréstimos ativos para os Chromebooks fornecidos
      const { data: activeLoans, error: loanError } = await supabase
        .from('loan_history')
        .select('id, chromebook_id')
        .in('chromebook_id', chromebookIds)
        .eq('status', 'ativo');

      if (loanError) {
        throw new Error("Falha ao buscar empréstimos ativos.");
      }
      
      const loanMap = new Map(activeLoans.map(loan => [loan.chromebook_id, loan.id]));
      const returnsToInsert = [];

      for (const chromebookId of chromebookIds) {
        const loanId = loanMap.get(chromebookId);
        
        if (!loanId) {
          errorCount++;
          toast({ 
            title: "Erro no Lote", 
            description: `Chromebook ${chromebookId} não possui um empréstimo ativo registrado.`, 
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
          notes: data.notes, // Incluindo notas
          created_by: user.id
        });
      }
      
      if (returnsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('returns')
          .insert(returnsToInsert);

        if (insertError) {
          console.error('Erro de inserção de devolução em lote:', insertError);
          throw new Error(`Falha ao inserir ${returnsToInsert.length} devoluções.`);
        } else {
          successCount = returnsToInsert.length;
        }
      }
    } catch (e: any) {
      toast({ 
        title: "Erro de Processamento", 
        description: e.message, 
        variant: "destructive" 
      });
      errorCount = chromebookIds.length - successCount; // Recalcula erros
    } finally {
      setLoading(false);
    }

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
    syncChromebookStatus, // NOVO
    // Loan operations
    createLoan,
    bulkCreateLoans, // Exportando a nova função
    getActiveLoans,
    getLoanHistory,
    // Return operations
    createReturn,
    returnChromebookById,
    bulkReturnChromebooks, // Exportando a nova função
    forceReturnLoan, // NOVO
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