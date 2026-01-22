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
import { format } from 'date-fns'; // Importando format para formatar a data
import logger from '@/utils/logger';
import { validateEmailDomain, EMAIL_DOMAINS } from '@/utils/emailValidation';
import { isNetworkError, getSupabaseErrorMessage, handleSupabaseError, retryWithBackoff } from '@/utils/networkErrors';

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
  professor_id?: string; // Opcional: será preenchido automaticamente pelo usuário logado
  justification: string; // Motivo/Justificativa do agendamento
  quantity_requested: number;
  // Equipamentos auxiliares (opcionais)
  needs_tv?: boolean;
  needs_sound?: boolean;
  needs_mic?: boolean;
  mic_quantity?: number;
  is_minecraft?: boolean;
  classroom?: string; // NOVO: Sala/Turma onde será utilizado
}

export interface Reservation extends ReservationData {
  id: string;
  professor_id: string; // Obrigatório no resultado
  created_by: string;
  created_at: string;
  // Detalhes do professor (para exibição)
  prof_name: string;
  prof_email: string;
  associated_loans?: { chromebook_id: string }[];
}


// REMOVIDO: Validações de domínio movidas para @/utils/emailValidation
// Usar: validateEmailDomain(email, userType) do utilitário

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
      // Retry automático para erros de rede
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('chromebooks')
          .select('*')
          .order('chromebook_id', { ascending: false });

        if (error) throw error;
        return data || [];
      }, 3, 1000); // 3 tentativas, 1s de delay base

      return result as Chromebook[];
    } catch (error: any) {
      const errorInfo = handleSupabaseError(error);

      toast({
        title: errorInfo.isNetwork ? "Erro de Conexão" : "Erro de Sincronização",
        description: errorInfo.message,
        variant: "destructive"
      });

      logger.error('Erro ao carregar chromebooks', error, { errorInfo });
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
      // Retry automático para erros de rede
      const data = await retryWithBackoff(async () => {
        const { data, error } = await supabase.rpc('sync_chromebook_status', { cb_id: chromebookId });
        if (error) throw error;
        return data;
      }, 2, 500); // 2 tentativas, 500ms de delay base

      // MANTIDO: Este toast é específico e útil para o painel de alertas.
      toast({ title: "Sincronização Concluída", description: data, variant: "info" });
      return data;
    } catch (error: any) {
      const errorInfo = handleSupabaseError(error);

      toast({
        title: errorInfo.isNetwork ? "Erro de Conexão" : "Erro de Sincronização",
        description: errorInfo.message,
        variant: "destructive"
      });

      logger.error('Erro ao sincronizar status do chromebook', error, { chromebookId, errorInfo });
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
          created_by: user.id,
          reservation_id: data.reservationId
        })
        .select()
        .single();

      if (error) throw error;

      // REMOVIDO: Toast de sucesso genérico. O componente chamador fará o toast de sucesso em lote.
      return result as unknown as Loan;
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
          created_by: user.id,
          reservation_id: data.reservationId
        });
      }

      if (loansToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('loans')
          .insert(loansToInsert);

        if (insertError) {
          logger.error('Erro de inserção em lote:', insertError);
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
      })) as unknown as LoanHistoryItem[];
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
      })) as unknown as LoanHistoryItem[];
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar histórico de empréstimos.", variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca detalhes do empréstimo ativo/atrasado por ID do Chromebook
   * Útil para exibir informações contextuais na devolução
   */
  const getLoanDetailsByChromebookId = useCallback(async (chromebookId: string): Promise<LoanHistoryItem | null> => {
    try {
      const { data, error } = await supabase
        .from('loan_history')
        .select('*')
        .eq('chromebook_id', chromebookId)
        .in('status', ['ativo', 'atrasado'])
        .single();

      if (error) {
        // Se não encontrar, retorna null silenciosamente (não é erro crítico)
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data ? {
        ...data,
        status: data.status as 'ativo' | 'devolvido' | 'atrasado'
      } as unknown as LoanHistoryItem : null;
    } catch (error: any) {
      logger.error('Erro ao buscar detalhes do empréstimo', error, { chromebookId });
      return null;
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

      return result as unknown as Return;
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
        logger.warn(`Chromebook ID ${loan.chromebook_id} não encontrado para sincronização após devolução forçada.`);
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

      const result = await createReturn(activeLoan.id as string, data);

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
          logger.error('Erro de inserção de devolução em lote:', insertError);
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
    const emailValidation = validateEmailDomain(data.email, 'aluno');
    if (!emailValidation.valid) {
      toast({ title: "Erro de Validação", description: emailValidation.message, variant: "destructive" });
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
      logger.error('Erro ao criar aluno via RPC:', error);
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
    if (data.email) {
      const emailValidation = validateEmailDomain(data.email, 'aluno');
      if (!emailValidation.valid) {
        toast({ title: "Erro de Validação", description: emailValidation.message, variant: "destructive" });
        return false;
      }
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
    const emailValidation = validateEmailDomain(data.email, 'professor');
    if (!emailValidation.valid) {
      toast({ title: "Erro de Validação", description: emailValidation.message, variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      // Chama a RPC ao invés de insert direto
      const { data: result, error } = await supabase.rpc('create_teacher', {
        p_nome_completo: data.nome_completo,
        p_email: data.email,
        p_materia: (data as any).materia || null
      });

      if (error) throw error;
      // REMOVIDO: toast({ title: "Sucesso", description: "Professor cadastrado com sucesso" });
      return result;
    } catch (error: any) {
      logger.error('Erro ao criar professor via RPC:', error);
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

  // Bulk insert students - para importação CSV
  const bulkInsertStudents = useCallback(async (students: StudentData[]): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    if (students.length === 0) {
      toast({ title: "Erro", description: "Nenhum aluno para importar", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      // Insere diretamente na tabela alunos (sem usar RPC para melhor performance em lote)
      const { error } = await supabase
        .from('alunos')
        .insert(students.map(s => ({
          nome_completo: s.nome_completo,
          ra: s.ra,
          email: s.email.toLowerCase(),
          turma: s.turma
        })));

      if (error) throw error;
      return true;
    } catch (error: any) {
      logger.error('Erro ao importar alunos em lote:', error);
      toast({
        title: "Erro na importação",
        description: error.message.includes('duplicate') ? "Alguns alunos já estão cadastrados" : error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Função para deletar todos os alunos (se necessário)
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
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      return true;
    } catch (error: any) {
      logger.error('Erro ao deletar alunos:', error);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
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
    if (data.email && !validateEmailDomain(data.email, 'professor')) {
      toast({ title: "Erro de Validação", description: `Email de professor deve terminar com ${EMAIL_DOMAINS.PROFESSOR}`, variant: "destructive" });
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
    if (!validateEmailDomain(data.email, 'funcionario')) {
      toast({ title: "Erro de Validação", description: `Email de funcionário deve terminar com ${EMAIL_DOMAINS.FUNCIONARIO}`, variant: "destructive" });
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
      logger.error('Erro ao criar funcionário via RPC:', error);
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
    if (data.email && !validateEmailDomain(data.email, 'funcionario')) {
      toast({ title: "Erro de Validação", description: `Email de funcionário deve terminar com ${EMAIL_DOMAINS.FUNCIONARIO}`, variant: "destructive" });
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
        if (!validateEmailDomain(student.email, 'aluno')) {
          throw new Error(`Email de aluno inválido: ${student.email}. Deve terminar com ${EMAIL_DOMAINS.ALUNO}`);
        }
      }
      const { error } = await supabase
        .from('alunos')
        .insert(students);

      if (error) throw error;
      return true;
    } catch (error: any) {
      logger.error('Erro ao importar alunos:', error);
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
        if (!validateEmailDomain(teacher.email, 'professor')) {
          throw new Error(`Email de professor inválido: ${teacher.email}. Deve terminar com ${EMAIL_DOMAINS.PROFESSOR}`);
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
      logger.error('Erro ao importar professores:', error);
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
      logger.error('Erro ao excluir alunos:', error);
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
      logger.error(`Erro ao excluir ${userType}:`, error);
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
      // CORREÇÃO: Contar apenas os que estão 'disponivel' ou 'fixo'
      const { count, error } = await supabase
        .from('chromebooks')
        .select('id', { count: 'exact', head: true })
        .in('status', ['disponivel', 'fixo']); // Apenas estes status são considerados disponíveis para agendamento/uso

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      logger.error('Erro ao buscar total de Chromebooks disponíveis:', error);
      // Removendo o toast aqui para evitar spam, o componente chamador (SchedulingPage) já trata o erro.
      return 0;
    }
  }, []);

  const getReservationsForWeek = useCallback(async (startDate: string, endDate: string): Promise<Reservation[]> => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          prof_data:profiles!professor_id (name, email),
          loans (
            chromebooks (chromebook_id)
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) throw error;

      // Mapeia o resultado para o tipo Reservation
      return (data || []).map(res => {
        const profData = (res as any).prof_data;
        const profName = profData?.name;
        const profEmail = profData?.email;

        // Extrai os empréstimos associados de forma segura
        const loans = (res as any).loans || [];
        const associatedLoans = loans.map((l: any) => {
          // Lida com o caso de chromebooks ser um objeto ou um array (caso a relação não seja detectada como 1-1)
          const cb = Array.isArray(l.chromebooks) ? l.chromebooks[0] : l.chromebooks;
          return { chromebook_id: cb?.chromebook_id };
        }).filter((l: any) => l.chromebook_id);

        return {
          ...res,
          prof_name: profName && profName !== 'Usuário Desconhecido' ? profName : (profEmail || 'Usuário Desconhecido'),
          prof_email: profEmail || '',
          justification: (res as any).justification || '',
          associated_loans: associatedLoans
        };
      }) as Reservation[];

    } catch (error: any) {
      logger.error('Erro ao buscar reservas:', error);
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
          date: data.date,
          time_slot: data.time_slot,
          professor_id: data.professor_id || user.id, // Usa o ID do usuário logado se não fornecido
          justification: data.justification,
          quantity_requested: data.quantity_requested,
          needs_tv: data.needs_tv || false,
          needs_sound: data.needs_sound || false,
          needs_mic: data.needs_mic || false,
          mic_quantity: data.mic_quantity || 0,
          is_minecraft: data.is_minecraft || false,
          classroom: data.classroom || '', // NOVO: Sala/Turma
          created_by: user.id,
        })
        .select(`
          *,
          prof_data:profiles!professor_id (name, email)
        `)
        .single();

      if (error) throw error;

      const profData = (result as any).prof_data;
      const profName = profData?.name;
      const profEmail = profData?.email;

      const reservationResult = {
        ...result,
        prof_name: profName && profName !== 'Usuário Desconhecido' ? profName : (profEmail || 'Usuário Desconhecido'),
        prof_email: profEmail || '',
        justification: (result as any).justification || '',
      } as Reservation;

      // PASSO 3: CHAMAR A EDGE FUNCTION APÓS O SUCESSO
      let professorEmail = reservationResult.prof_email;
      const professorName = reservationResult.prof_name;

      // Se for o usuário de teste, redirecionar e-mail para o admin
      if (professorEmail === 'teste@sj.pro.br') {
        professorEmail = 'arthur.alencar@colegiosaojudas.com.br';
        logger.info('E-mail de teste redirecionado para o administrador');
      }

      if (professorEmail) {
        const emailPayload = {
          toEmail: professorEmail,
          professorName: professorName,
          justification: reservationResult.justification,
          date: format(new Date(reservationResult.date), 'dd/MM/yyyy'),
          time: reservationResult.time_slot,
          quantity: reservationResult.quantity_requested,
          needs_tv: reservationResult.needs_tv,
          needs_sound: reservationResult.needs_sound,
          needs_mic: reservationResult.needs_mic,
          mic_quantity: reservationResult.mic_quantity,
          is_minecraft: reservationResult.is_minecraft,
        };

        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-reservation-email', {
          body: emailPayload,
          headers: {
            // Passa o token do usuário logado para a Edge Function (se necessário para auth)
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          }
        });

        if (emailError) {
          logger.error('Erro ao disparar e-mail de confirmação:', emailError);
          toast({ title: "Aviso", description: "Reserva criada, mas falha ao enviar e-mail de confirmação.", variant: "info" });
        } else {
          logger.debug('E-mail de confirmação disparado:', emailData);
        }
      }

      // --- NOTIFICAÇÃO PARA OS RESPONSÁVEIS ---
      const responsibleUserIds = [
        'e01b402a-3f99-48e5-84f6-3b23aad4fba9', // Eduardo
        '2c613746-af33-47b2-bc0a-cd965f8603de', // Davi
        'e9253b42-f52e-445b-b3ea-1f0c93e4c3f9'  // Arthur
      ];

      const notifications = responsibleUserIds
        .filter(id => id !== user.id) // Não notifica o próprio criador se ele for um dos 3
        .map(responsibleId => ({
          user_id: responsibleId,
          title: 'Nova Reserva de Chromebooks',
          message: `${reservationResult.prof_name} agendou ${reservationResult.quantity_requested} Chromebooks para o dia ${format(new Date(reservationResult.date), 'dd/MM/yyyy')} às ${reservationResult.time_slot}.`,
          type: 'reservation',
          metadata: {
            reservation_id: reservationResult.id,
            prof_name: reservationResult.prof_name,
            date: reservationResult.date,
            time_slot: reservationResult.time_slot
          }
        }));

      if (notifications.length > 0) {
        await supabase.from('notifications' as any).insert(notifications);
      }

      toast({ title: "Sucesso", description: "Reserva agendada com sucesso!", variant: "success" });

      return reservationResult;

    } catch (error: any) {
      logger.error('Erro ao criar reserva:', error);
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

  const bulkCreateReservations = useCallback(async (dates: string[], baseData: Omit<ReservationData, 'date'>): Promise<{ success: boolean; count: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { success: false, count: 0 };
    }

    setLoading(true);
    try {
      const inserts = dates.map(date => ({
        date,
        time_slot: baseData.time_slot,
        professor_id: baseData.professor_id || user.id,
        justification: baseData.justification,
        quantity_requested: baseData.quantity_requested,
        needs_tv: baseData.needs_tv || false,
        needs_sound: baseData.needs_sound || false,
        needs_mic: baseData.needs_mic || false,
        mic_quantity: baseData.mic_quantity || 0,
        is_minecraft: baseData.is_minecraft || false,
        classroom: baseData.classroom || '',
        created_by: user.id,
      }));

      const { data: results, error } = await supabase
        .from('reservations')
        .insert(inserts)
        .select();

      if (error) throw error;

      // Disparar e-mails para cada reserva (opcional, talvez um e-mail consolidado fosse melhor, mas vamos manter simples por enquanto)
      // Para não sobrecarregar, vamos ignorar o envio de e-mail no bulk por agora ou fazer apenas para a primeira data

      // --- NOTIFICAÇÃO PARA OS RESPONSÁVEIS EM LOTE ---
      const responsibleUserIds = [
        'e01b402a-3f99-48e5-84f6-3b23aad4fba9', // Eduardo
        '2c613746-af33-47b2-bc0a-cd965f8603de', // Davi
        'e9253b42-f52e-445b-b3ea-1f0c93e4c3f9'  // Arthur
      ];

      const batchNotifications = responsibleUserIds
        .filter(id => id !== user.id)
        .map(responsibleId => ({
          user_id: responsibleId,
          title: 'Novas Reservas (Lote)',
          message: `${dates.length} novos agendamentos realizados por ${user.email?.split('@')[0]} para o horário ${baseData.time_slot}.`,
          type: 'reservation_bulk',
          metadata: {
            count: dates.length,
            time_slot: baseData.time_slot,
            dates: dates
          }
        }));

      if (batchNotifications.length > 0) {
        await supabase.from('notifications' as any).insert(batchNotifications);
      }

      toast({ title: "Sucesso", description: `${results.length} agendamentos realizados com sucesso!`, variant: "success" });
      return { success: true, count: results.length };
    } catch (error: any) {
      logger.error('Erro ao criar agendamentos em lote:', error);
      toast({
        title: "Erro ao Agendar Lote",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, count: 0 };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteReservation = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Reserva cancelada com sucesso!", variant: "success" });
      return true;
    } catch (error: any) {
      logger.error('Erro ao cancelar reserva:', error);
      toast({
        title: "Erro ao Cancelar",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- NOTIFICATION OPERATIONS ---
  const getNotifications = useCallback(async (): Promise<any[]> => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('notifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.error('Erro ao buscar notificações:', error);
      return [];
    }
  }, [user]);

  const markNotificationAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      logger.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }, [user]);

  const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error: any) {
      logger.error('Erro ao marcar todas as notificações como lidas:', error);
      return false;
    }
  }, [user]);

  return {
    loading,
    createChromebook,
    getChromebooks,
    getChromebooksByStatus,
    updateChromebook,
    deleteChromebook,
    syncChromebookStatus,
    createLoan,
    bulkCreateLoans,
    getActiveLoans,
    getLoanHistory,
    getLoanDetailsByChromebookId,
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
    bulkInsertTeachers,
    createStaff,
    updateStaff,
    deleteUserRecord,
    getTotalAvailableChromebooks,
    getReservationsForWeek,
    createReservation,
    bulkCreateReservations,
    deleteReservation,
    // NOTIFICAÇÕES
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };
};