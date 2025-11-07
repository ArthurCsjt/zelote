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
  UserType,
  TeacherData
} from '@/types/database';

// Types for new entities
interface StudentData {
  nome_completo: string;
  ra: string;
  email: string;
  turma: string; // Adicionado turma para consistência
}

interface StaffData {
  nome_completo: string;
  email: string;
}

// NOVO TIPO: Reserva
export interface ReservationData {
  date: string; // ISO date string (YYYY-MM-DD)
  time_slot: string;
  professor_id: string;
  subject: string | null;
  quantity_requested: number;
}

export interface Reservation extends ReservationData {
  id: string;
  created_by: string;
  created_at: string;
  // Detalhes do professor (para exibição)
  prof_name: string;
  prof_email: string;
}


// --- Validações de Domínio ---
const DOMAIN_SUFFIX_ALUNO = '@sj.g12.br';
const DOMAIN_SUFFIX_PROFESSOR = '@sj.pro.br';
const DOMAIN_SUFFIX_FUNCIONARIO = '@colegiosaojudas.com.br';

const validateEmailDomain = (email: string, expectedSuffix: string): boolean => {
  return email.endsWith(expectedSuffix);
};

// Função auxiliar para mapear ChromebookData (camelCase) para o formato do DB (snake_case)
const mapChromebookDataToDb = (data: Partial<ChromebookData>, userId: string | undefined) => {
    const payload: any = {
        chromebook_id: data.chromebookId,
        model: data.model,
        serial_number: data.serialNumber,
        patrimony_number: data.patrimonyNumber,
        manufacturer: data.manufacturer,
        status: data.status,
        condition: data.condition,
        location: data.location,
        classroom: data.classroom,
        is_deprovisioned: data.is_deprovisioned ?? false,
    };
    
    // Adiciona created_by apenas se estiver criando
    if (userId && !data.id) {
        payload.created_by = userId;
    }
    
    // Remove chaves com valor undefined para evitar erros de Supabase
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    
    return payload;
};


export const useDatabase = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // --- CHROMEBOOK OPERATIONS ---
  
  const createChromebook = useCallback(async (data: ChromebookData): Promise<Chromebook | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const payload = mapChromebookDataToDb(data, user.id);

      const { data: result, error } = await supabase
        .from('chromebooks')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // REMOVIDO: toast({ title: "Sucesso", description: "Chromebook cadastrado com sucesso" });
      return result as Chromebook;
    } catch (error: any) {
      toast({ 
        title: "Erro ao cadastrar Chromebook", 
        description: error.message.includes('duplicate key') ? "ID, Série ou Patrimônio já cadastrado." : error.message, 
        variant: "destructive" 
      });
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
        .order('chromebook_id', { ascending: false }); // ALTERADO PARA ORDENAR POR ID DECRESCENTE

      if (error) throw error;
      return (data || []) as Chromebook[];
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar inventário.", variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // NOVO: Função para buscar Chromebooks por status
  const getChromebooksByStatus = useCallback(async (status: Chromebook['status']): Promise<Chromebook[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chromebooks')
        .select('*')
        .eq('status', status)
        .order('chromebook_id', { ascending: true });

      if (error) throw error;
      return (data || []) as Chromebook[];
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: `Falha ao carregar Chromebooks com status ${status}.`, variant: "destructive" });
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
      // Usa a função de mapeamento, mas não passa o userId para evitar atualizar created_by
      const updatePayload = mapChromebookDataToDb(data, undefined);

      const { error } = await supabase
        .from('chromebooks')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
      
      // REMOVIDO: toast({ title: "Sucesso", description: "Chromebook atualizado com sucesso" });
      return true;
    } catch (error: any) {
      toast({ 
        title: "Erro ao atualizar Chromebook", 
        description: error.message.includes('duplicate key') ? "ID, Série ou Patrimônio já cadastrado." : error.message, 
        variant: "destructive" 
      });
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
      
      toast({ title: "Sucesso", description: "Chromebook excluído com sucesso", variant: "success" });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao excluir Chromebook", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  const syncChromebookStatus = useCallback(async (chromebookId: string): Promise<string | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('sync_chromebook_status', { cb_id: chromebookId });
      
      if (error) throw error;
      
      // MANTIDO: Este toast é específico e útil para o painel de alertas.
      toast({ title: "Sincronização Concluída", description: data, variant: "info" });
      return data;
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);


  // --- LOAN OPERATIONS ---

  const createLoan = useCallback(async (data: LoanFormData): Promise<Loan | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
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
      
      // REMOVIDO: Toast de sucesso genérico. O componente chamador fará o toast de sucesso em lote.
      return result;
    } catch (error: any) {
      toast({ title: "Erro ao registrar empréstimo", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  const bulkCreateLoans = useCallback(async (loanDataList: LoanFormData[]): Promise<{ successCount: number, errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: loanDataList.length };
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
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
          // Toast específico para o item que falhou
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
      errorCount = loanDataList.length - successCount;
    } finally {
      setLoading(false);
    }

    return { successCount, errorCount: loanDataList.length - successCount };
  }, [user]);


  const getActiveLoans = useCallback(async (): Promise<LoanHistoryItem[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loan_history')
        .select('*')
        .in('status', ['ativo', 'atrasado'])
        .order('loan_date', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'ativo' | 'devolvido' | 'atrasado'
      }));
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar empréstimos ativos.", variant: "destructive" });
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
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar histórico de empréstimos.", variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createReturn = useCallback(async (loanId: string, data: ReturnFormData & { notes?: string }): Promise<Return | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    try {
      const { data: result, error } = await supabase
        .from('returns')
        .insert({
          loan_id: loanId,
          returned_by_name: data.name,
          returned_by_ra: data.ra,
          returned_by_email: data.email,
          returned_by_type: data.userType,
          notes: data.notes,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      return result;
    } catch (error: any) {
      throw error;
    }
  }, [user]);
  
  const forceReturnLoan = useCallback(async (loan: LoanHistoryItem): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    
    if (!loan.id) {
        toast({ title: "Erro de Dados", description: "ID do empréstimo não encontrado. Não é possível forçar a devolução.", variant: "destructive" });
        return false;
    }

    setLoading(true);
    try {
      const returnData: ReturnFormData & { notes?: string } = {
        name: user.email?.split('@')[0] || 'Admin',
        email: user.email || 'admin@system.com',
        type: loan.loan_type,
        userType: 'funcionario',
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
          return_date: new Date().toISOString(),
        });

      if (returnError) throw returnError;
      
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
    setLoading(true);
    try {
      // Busca por empréstimos ativos OU atrasados
      const { data: activeLoan, error: loanError } = await supabase
        .from('loan_history')
        .select('id')
        .eq('chromebook_id', chromebookId)
        .in('status', ['ativo', 'atrasado'])
        .single();

      if (loanError || !activeLoan) {
        throw new Error('Chromebook não encontrado ou não possui um empréstimo ativo/atrasado.');
      }

      const result = await createReturn(activeLoan.id, data);
      
      if (result) {
        // Sincroniza o status do Chromebook após a devolução
        await syncChromebookStatus(chromebookId);
        
        // TOAST DE SUCESSO ESPECÍFICO PARA DEVOLUÇÃO
        toast({ 
          title: "Devolução registrada", 
          description: `Chromebook ${chromebookId} devolvido com sucesso.`, 
          variant: "success" 
        });
        return true;
      }
      return false;
    } catch (error: any) {
      toast({ title: "Erro ao registrar devolução", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [createReturn, syncChromebookStatus]);
  
  const bulkReturnChromebooks = useCallback(async (chromebookIds: string[], data: ReturnFormData & { notes?: string }): Promise<{ successCount: number, errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: chromebookIds.length };
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // 1. Busca por empréstimos ativos OU atrasados
      const { data: activeLoans, error: loanError } = await supabase
        .from('loan_history')
        .select('id, chromebook_id')
        .in('chromebook_id', chromebookIds)
        .in('status', ['ativo', 'atrasado']);

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
            description: `Chromebook ${chromebookId} não possui um empréstimo ativo/atrasado registrado no sistema.`, 
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
          notes: data.notes,
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
          
          // 2. Sincroniza o status de todos os Chromebooks devolvidos
          const successfullyReturnedIds = returnsToInsert.map(r => {
            const loan = activeLoans.find(l => l.id === r.loan_id);
            return loan?.chromebook_id;
          }).filter((id): id is string => !!id);
          
          await Promise.all(successfullyReturnedIds.map(id => syncChromebookStatus(id)));
        }
      }
    } catch (e: any) {
      toast({ 
        title: "Erro de Processamento", 
        description: e.message, 
        variant: "destructive" 
      });
      errorCount = chromebookIds.length - successCount;
    } finally {
      setLoading(false);
    }

    return { successCount, errorCount: chromebookIds.length - successCount };
  }, [user, syncChromebookStatus]);


  // --- USER OPERATIONS ---

  // Student operations - ATUALIZADO PARA USAR RPC
  const createStudent = useCallback(async (data: StudentData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    // Validação de domínio para aluno
    if (!validateEmailDomain(data.email, DOMAIN_SUFFIX_ALUNO)) {
        toast({ title: "Erro de Validação", description: `Email de aluno deve terminar com ${DOMAIN_SUFFIX_ALUNO}`, variant: "destructive" });
        return null;
    }

    setLoading(true);
    try {
      // Chama a RPC ao invés de insert direto
      const { data: result, error } = await supabase.rpc('create_student', {
        p_nome_completo: data.nome_completo,
        p_ra: data.ra,
        p_email: data.email,
        p_turma: data.turma
      });

      if (error) throw error;
      // REMOVIDO: toast({ title: "Sucesso", description: "Aluno cadastrado com sucesso" });
      return result;
    } catch (error: any) {
      console.error('Erro ao criar aluno via RPC:', error);
      // Verifica se o erro é de restrição de unicidade (email ou RA duplicado)
      if (error.message.includes('RA ou E-mail informado já está em uso')) {
        toast({ title: "Erro de Cadastro", description: "RA ou E-mail já cadastrado.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message || "Falha ao cadastrar aluno", variant: "destructive" });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  const updateStudent = useCallback(async (id: string, data: Partial<StudentData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    // Validação de domínio para aluno, se o email estiver sendo atualizado
    if (data.email && !validateEmailDomain(data.email, DOMAIN_SUFFIX_ALUNO)) {
        toast({ title: "Erro de Validação", description: `Email de aluno deve terminar com ${DOMAIN_SUFFIX_ALUNO}`, variant: "destructive" });
        return false;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('alunos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      // REMOVIDO: toast({ title: "Sucesso", description: "Aluno atualizado com sucesso" });
      return true;
    } catch (error: any) {
      // Verifica se o erro é de restrição de unicidade (email ou RA duplicado)
      if (error.code === '23505') {
        toast({ title: "Erro de Atualização", description: "RA ou E-mail já cadastrado para outro aluno.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


  // Teacher operations - ATUALIZADO PARA USAR RPC e VALIDAR DOMÍNIO
  const createTeacher = useCallback(async (data: TeacherData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    // Validação de domínio para professor
    if (!validateEmailDomain(data.email, DOMAIN_SUFFIX_PROFESSOR)) {
        toast({ title: "Erro de Validação", description: `Email de professor deve terminar com ${DOMAIN_SUFFIX_PROFESSOR}`, variant: "destructive" });
        return null;
    }

    setLoading(true);
    try {
      // Chama a RPC ao invés de insert direto
      const { data: result, error } = await supabase.rpc('create_teacher', {
        p_nome_completo: data.nome_completo,
        p_email: data.email,
        p_materia: data.materia || null
      });

      if (error) throw error;
      // REMOVIDO: toast({ title: "Sucesso", description: "Professor cadastrado com sucesso" });
      return result;
    } catch (error: any) {
      console.error('Erro ao criar professor via RPC:', error);
      // Verifica se o erro é de restrição de unicidade (email duplicado)
      if (error.message.includes('O e-mail informado já está em uso')) {
        toast({ title: "Erro de Cadastro", description: "E-mail já cadastrado para outro professor.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message || "Falha ao cadastrar professor", variant: "destructive" });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  const updateTeacher = useCallback(async (id: string, data: Partial<TeacherData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    // Validação de domínio para professor, se o email estiver sendo atualizado
    if (data.email && !validateEmailDomain(data.email, DOMAIN_SUFFIX_PROFESSOR)) {
        toast({ title: "Erro de Validação", description: `Email de professor deve terminar com ${DOMAIN_SUFFIX_PROFESSOR}`, variant: "destructive" });
        return false;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('professores')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      // REMOVIDO: toast({ title: "Sucesso", description: "Professor atualizado com sucesso" });
      return true;
    } catch (error: any) {
      // Verifica se o erro é de restrição de unicidade (email duplicado)
      if (error.code === '23505') {
        toast({ title: "Erro de Atualização", description: "E-mail já cadastrado para outro professor.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


  // Staff operations - ATUALIZADO PARA USAR RPC e VALIDAR DOMÍNIO
  const createStaff = useCallback(async (data: StaffData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    // Validação de domínio para funcionário
    if (!validateEmailDomain(data.email, DOMAIN_SUFFIX_FUNCIONARIO)) {
        toast({ title: "Erro de Validação", description: `Email de funcionário deve terminar com ${DOMAIN_SUFFIX_FUNCIONARIO}`, variant: "destructive" });
        return null;
    }

    setLoading(true);
    try {
      // Chama a RPC ao invés de insert direto
      const { data: result, error } = await supabase.rpc('create_staff', {
        p_nome_completo: data.nome_completo,
        p_email: data.email
      });

      if (error) throw error;
      // REMOVIDO: toast({ title: "Sucesso", description: "Funcionário cadastrado com sucesso" });
      return result;
    } catch (error: any) {
      console.error('Erro ao criar funcionário via RPC:', error);
      // Verifica se o erro é de restrição de unicidade (email duplicado)
      if (error.message.includes('O e-mail informado já está em uso')) {
        toast({ title: "Erro de Cadastro", description: "E-mail já cadastrado para outro funcionário.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message || "Falha ao cadastrar funcionário", variant: "destructive" });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  const updateStaff = useCallback(async (id: string, data: Partial<StaffData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    // Validação de domínio para funcionário, se o email estiver sendo atualizado
    if (data.email && !validateEmailDomain(data.email, DOMAIN_SUFFIX_FUNCIONARIO)) {
        toast({ title: "Erro de Validação", description: `Email de funcionário deve terminar com ${DOMAIN_SUFFIX_FUNCIONARIO}`, variant: "destructive" });
        return false;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('funcionarios')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      // REMOVIDO: toast({ title: "Sucesso", description: "Funcionário atualizado com sucesso" });
      return true;
    } catch (error: any) {
      // Verifica se o erro é de restrição de unicidade (email duplicado)
      if (error.code === '23505') {
        toast({ title: "Erro de Atualização", description: "E-mail já cadastrado para outro funcionário.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


  const bulkInsertStudents = useCallback(async (students: StudentData[]): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      // Validação de domínio para todos os alunos no lote
      for (const student of students) {
        if (!validateEmailDomain(student.email, DOMAIN_SUFFIX_ALUNO)) {
            throw new Error(`Email de aluno inválido: ${student.email}. Deve terminar com ${DOMAIN_SUFFIX_ALUNO}`);
        }
      }
      const { error } = await supabase
        .from('alunos')
        .insert(students);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Erro ao importar alunos:', error);
      // Verifica se o erro é de restrição de unicidade (email ou RA duplicado)
      if (error.code === '23505') {
        toast({ title: "Erro de Importação", description: "Pelo menos um RA ou E-mail já está cadastrado.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // NOVO: Bulk Insert Teachers
  const bulkInsertTeachers = useCallback(async (teachers: TeacherData[]): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      // Validação de domínio para todos os professores no lote
      for (const teacher of teachers) {
        if (!validateEmailDomain(teacher.email, DOMAIN_SUFFIX_PROFESSOR)) {
            throw new Error(`Email de professor inválido: ${teacher.email}. Deve terminar com ${DOMAIN_SUFFIX_PROFESSOR}`);
        }
      }
      
      // Mapeia para o formato do DB (nome_completo, email, materia)
      const teachersToInsert = teachers.map(t => ({
          nome_completo: t.nome_completo,
          email: t.email,
          materia: t.materia || null,
      }));
      
      const { error } = await supabase
        .from('professores')
        .insert(teachersToInsert);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Erro ao importar professores:', error);
      // Verifica se o erro é de restrição de unicidade (email duplicado)
      if (error.code === '23505') {
        toast({ title: "Erro de Importação", description: "Pelo menos um E-mail já está cadastrado.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);


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
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      
      toast({ 
        title: "Sucesso", 
        description: "Todos os alunos foram excluídos com sucesso.",
        variant: "success"
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
      
      toast({ title: "Sucesso", description: `${userType.charAt(0).toUpperCase() + userType.slice(1)} excluído com sucesso.`, variant: "success" });
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
  
  // --- SCHEDULING OPERATIONS (NOVAS FUNÇÕES) ---
  
  const getTotalAvailableChromebooks = useCallback(async (): Promise<number> => {
    try {
      // Conta todos os Chromebooks que não estão 'fora_uso' ou 'manutencao'
      const { count, error } = await supabase
        .from('chromebooks')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', ['fora_uso', 'manutencao']);

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.error('Erro ao buscar total de Chromebooks disponíveis:', error);
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar inventário total.", variant: "destructive" });
      return 0;
    }
  }, []);

  const getReservationsForWeek = useCallback(async (startDate: string, endDate: string): Promise<Reservation[]> => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          professores (nome_completo, email)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) throw error;
      
      // Mapeia o resultado para o tipo Reservation
      return (data || []).map(res => ({
        ...res,
        prof_name: res.professores?.nome_completo || 'Professor Desconhecido',
        prof_email: res.professores?.email || '',
      })) as Reservation[];
      
    } catch (error: any) {
      console.error('Erro ao buscar reservas:', error);
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar agendamentos.", variant: "destructive" });
      return [];
    }
  }, []);

  const createReservation = useCallback(async (data: ReservationData): Promise<Reservation | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }
    
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('reservations')
        .insert({
          ...data,
          created_by: user.id,
          subject: data.subject || null,
        })
        .select(`
          *,
          professores (nome_completo, email)
        `)
        .single();

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Reserva agendada com sucesso!", variant: "success" });
      
      return {
        ...result,
        prof_name: result.professores?.nome_completo || 'Professor Desconhecido',
        prof_email: result.professores?.email || '',
      } as Reservation;
      
    } catch (error: any) {
      console.error('Erro ao criar reserva:', error);
      toast({ 
        title: "Erro ao Agendar", 
        description: error.message, 
        variant: "destructive" 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);


  return {
    loading,
    createChromebook,
    getChromebooks,
    getChromebooksByStatus, // EXPORTANDO A NOVA FUNÇÃO
    updateChromebook,
    deleteChromebook,
    syncChromebookStatus,
    createLoan,
    bulkCreateLoans,
    getActiveLoans,
    getLoanHistory,
    createReturn,
    returnChromebookById,
    bulkReturnChromebooks,
    forceReturnLoan,
    createStudent,
    updateStudent,
    bulkInsertStudents,
    deleteAllStudents,
    createTeacher,
    updateTeacher,
    bulkInsertTeachers, // EXPORTANDO A NOVA FUNÇÃO
    createStaff,
    updateStaff,
    deleteUserRecord,
    // NOVAS FUNÇÕES DE AGENDAMENTO
    getTotalAvailableChromebooks,
    getReservationsForWeek,
    createReservation,
  };
};