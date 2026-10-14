import { supabase } from '@/integrations/supabase/client';
import type {
  Loan,
  Return,
  LoanFormData,
  ReturnFormData,
  LoanHistoryItem
} from '@/types/database';
import { formatISOLocal } from '@/utils/dateUtils';
import logger from '@/utils/logger';
import { triggerPushNotification } from './notificationService';
import { syncChromebookStatus } from './chromebookService';

export interface LoanHistoryFilters {
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: 'ativo' | 'devolvido' | 'atrasado';
}

export const createLoan = async (data: LoanFormData, userId: string): Promise<Loan> => {
  // 1. Verifica status do chromebook
  const { data: chromebook, error: chromebookError } = await supabase
    .from('chromebooks')
    .select('id, chromebook_id, status')
    .eq('chromebook_id', data.chromebookId)
    .eq('status', 'disponivel')
    .single();

  if (chromebookError || !chromebook) {
    throw new Error('Chromebook não encontrado ou não está disponível');
  }

  // 2. Dupla validação contra empréstimo ativo concorrente
  const { data: activeLoan } = await supabase
    .from('loan_history')
    .select('id, student_name')
    .eq('chromebook_id', data.chromebookId)
    .in('status', ['ativo', 'atrasado'])
    .maybeSingle();

  if (activeLoan) {
    throw new Error(`O Chromebook ${data.chromebookId} acabou de ser emprestado para ${activeLoan.student_name}.`);
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
      expected_return_date: formatISOLocal(data.expectedReturnDate),
      created_by: userId,
      reservation_id: data.reservationId
    })
    .select()
    .single();

  if (error) throw error;

  // Sincroniza status no banco
  await syncChromebookStatus(data.chromebookId);

  // Trigger Push Notification
  triggerPushNotification(
    "Novo Empréstimo",
    `${data.studentName} retirou o Chromebook ${data.chromebookId}.`,
    '/dashboard'
  );

  return result as unknown as Loan;
};

export const bulkCreateLoans = async (
  loanDataList: LoanFormData[],
  userId: string
): Promise<{ successCount: number; errorCount: number }> => {
  let successCount = 0;
  let errorCount = 0;

  const chromebookIds = loanDataList.map(d => d.chromebookId);
  
  // 1. Busca status dos chromebooks
  const { data: chromebooks, error: cbError } = await supabase
    .from('chromebooks')
    .select('id, chromebook_id, status')
    .in('chromebook_id', chromebookIds);

  if (cbError) {
    throw new Error("Falha ao buscar Chromebooks.");
  }

  // 2. Busca empréstimos ativos concorrentes para os mesmos IDs
  const { data: activeLoans } = await supabase
    .from('loan_history')
    .select('chromebook_id, student_name')
    .in('chromebook_id', chromebookIds)
    .in('status', ['ativo', 'atrasado']);

  const activeLoanMap = new Set((activeLoans || []).map(l => l.chromebook_id));
  const chromebookMap = new Map(chromebooks.map(cb => [cb.chromebook_id, cb]));
  const loansToInsert = [];
  const successfullyLoanedIds: string[] = [];

  for (const data of loanDataList) {
    const chromebook = chromebookMap.get(data.chromebookId);
    const hasActiveLoan = activeLoanMap.has(data.chromebookId);

    if (!chromebook || chromebook.status !== 'disponivel' || hasActiveLoan) {
      errorCount++;
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
      expected_return_date: formatISOLocal(data.expectedReturnDate),
      created_by: userId,
      reservation_id: data.reservationId
    });
    successfullyLoanedIds.push(data.chromebookId);
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
      Promise.all(successfullyLoanedIds.map(id => syncChromebookStatus(id))).catch(e =>
        logger.warn('Erro ao sincronizar status pós-lote', e)
      );
    }
  }

  return { successCount, errorCount: loanDataList.length - successCount };
};

export const getActiveLoans = async (): Promise<LoanHistoryItem[]> => {
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
};

export const getLoanHistory = async (filters?: LoanHistoryFilters): Promise<LoanHistoryItem[]> => {
  let query = supabase
    .from('loan_history')
    .select('*')
    .order('loan_date', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('loan_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('loan_date', filters.endDate);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    status: item.status as 'ativo' | 'devolvido' | 'atrasado'
  })) as unknown as LoanHistoryItem[];
};

export const getActiveLoansByUser = async (params: { ra?: string; email?: string }): Promise<LoanHistoryItem[]> => {
  if (!params.ra && !params.email) return [];

  let query = supabase
    .from('loan_history')
    .select('*')
    .in('status', ['ativo', 'atrasado']);

  if (params.ra && params.email) {
    query = query.or(`student_ra.eq.${params.ra},student_email.eq.${params.email}`);
  } else if (params.ra) {
    query = query.eq('student_ra', params.ra);
  } else if (params.email) {
    query = query.eq('student_email', params.email);
  }

  const { data, error } = await query.order('loan_date', { ascending: false });
  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    status: item.status as 'ativo' | 'devolvido' | 'atrasado'
  })) as unknown as LoanHistoryItem[];
};

export const getLoanDetailsByChromebookId = async (chromebookId: string): Promise<LoanHistoryItem | null> => {
  try {
    const { data, error } = await supabase
      .from('loan_history')
      .select('*')
      .eq('chromebook_id', chromebookId)
      .in('status', ['ativo', 'atrasado'])
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? ({
      ...data,
      status: data.status as 'ativo' | 'devolvido' | 'atrasado'
    } as unknown as LoanHistoryItem) : null;
  } catch (error: any) {
    logger.error('Erro ao buscar detalhes do empréstimo', error, { chromebookId });
    return null;
  }
};

export const createReturn = async (
  loanId: string,
  data: ReturnFormData & { notes?: string },
  userId: string
): Promise<Return> => {
  const { data: result, error } = await supabase
    .from('returns')
    .insert({
      loan_id: loanId,
      returned_by_name: data.name,
      returned_by_ra: data.ra,
      returned_by_email: data.email,
      returned_by_type: data.userType,
      notes: data.notes,
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;

  triggerPushNotification(
    "Devolução Registrada",
    `${data.name} devolveu um equipamento.`,
    '/dashboard'
  );

  return result as unknown as Return;
};

export const forceReturnLoan = async (loan: LoanHistoryItem, userId: string, userEmail?: string): Promise<boolean> => {
  if (!loan.id) {
    throw new Error("ID do empréstimo não encontrado.");
  }

  const returnData: ReturnFormData & { notes?: string } = {
    name: userEmail?.split('@')[0] || 'Admin',
    email: userEmail || 'admin@system.com',
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
      created_by: userId,
      return_date: new Date().toISOString(),
    });

  if (returnError) throw returnError;

  const { data: chromebookData, error: cbError } = await supabase
    .from('chromebooks')
    .select('chromebook_id')
    .eq('id', loan.chromebook_id)
    .single();

  if (cbError || !chromebookData) {
    logger.warn(`Chromebook ID ${loan.chromebook_id} não encontrado para sincronização.`);
  } else {
    await syncChromebookStatus(chromebookData.chromebook_id);
  }

  return true;
};

export const returnChromebookById = async (
  chromebookId: string,
  data: ReturnFormData,
  userId: string
): Promise<boolean> => {
  const { data: activeLoan, error: loanError } = await supabase
    .from('loan_history')
    .select('id')
    .eq('chromebook_id', chromebookId)
    .in('status', ['ativo', 'atrasado'])
    .single();

  if (loanError || !activeLoan) {
    throw new Error('Chromebook não encontrado ou não possui um empréstimo ativo/atrasado.');
  }

  const result = await createReturn(activeLoan.id as string, data, userId);

  if (result) {
    await syncChromebookStatus(chromebookId);
    return true;
  }
  return false;
};

export const bulkReturnChromebooks = async (
  chromebookIds: string[],
  data: ReturnFormData & { notes?: string },
  userId: string
): Promise<{ successCount: number; errorCount: number }> => {
  let successCount = 0;
  let errorCount = 0;

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
      continue;
    }

    returnsToInsert.push({
      loan_id: loanId,
      returned_by_name: data.name,
      returned_by_ra: data.ra,
      returned_by_email: data.email,
      returned_by_type: data.userType,
      notes: data.notes,
      created_by: userId
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

      const successfullyReturnedIds = returnsToInsert.map(r => {
        const loan = activeLoans.find(l => l.id === r.loan_id);
        return loan?.chromebook_id;
      }).filter((id): id is string => !!id);

      await Promise.all(successfullyReturnedIds.map(id => syncChromebookStatus(id)));
    }
  }

  return { successCount, errorCount: chromebookIds.length - successCount };
};
