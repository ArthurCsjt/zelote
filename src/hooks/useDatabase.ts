// @ts-nocheck
import { useState, useCallback } from 'react';
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
import { handleSupabaseError } from '@/utils/networkErrors';
import logger from '@/utils/logger';

// Import domain services
import * as chromebookService from '@/services/chromebookService';
import * as loanService from '@/services/loanService';
import * as userService from '@/services/userService';
import * as reservationService from '@/services/reservationService';
import * as notificationService from '@/services/notificationService';
import * as settingsService from '@/services/settingsService';

// Re-export domain types for backward compatibility
export type { ReservationData, Reservation, Space } from '@/services/reservationService';
export type { StudentData, StaffData } from '@/services/userService';
export type { LoanHistoryFilters } from '@/services/loanService';

export const useDatabase = () => {
  const { user } = useAuth();
  const [activeRequests, setActiveRequests] = useState(0);

  const startRequest = useCallback(() => setActiveRequests(prev => prev + 1), []);
  const endRequest = useCallback(() => setActiveRequests(prev => Math.max(0, prev - 1)), []);

  const loading = activeRequests > 0;

  // --- CHROMEBOOK OPERATIONS ---

  const getNextChromebookId = useCallback(async (): Promise<string | null> => {
    return await chromebookService.getNextChromebookId();
  }, []);

  const createChromebook = useCallback(async (data: ChromebookData): Promise<Chromebook | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    startRequest();
    try {
      const result = await chromebookService.createChromebook(data, user.id);
      return result;
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar Chromebook",
        description: error.message?.includes('duplicate key') ? "ID, Série ou Patrimônio já cadastrado." : error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const getChromebooks = useCallback(async (): Promise<Chromebook[]> => {
    startRequest();
    try {
      return await chromebookService.getChromebooks();
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
      endRequest();
    }
  }, [startRequest, endRequest]);

  const getChromebooksByStatus = useCallback(async (status: Chromebook['status']): Promise<Chromebook[]> => {
    startRequest();
    try {
      return await chromebookService.getChromebooksByStatus(status);
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: `Falha ao carregar Chromebooks com status ${status}.`, variant: "destructive" });
      return [];
    } finally {
      endRequest();
    }
  }, [startRequest, endRequest]);

  const updateChromebook = useCallback(async (id: string, data: Partial<ChromebookData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      return await chromebookService.updateChromebook(id, data);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar Chromebook",
        description: error.message?.includes('duplicate key') ? "ID, Série ou Patrimônio já cadastrado." : error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const deleteChromebook = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      await chromebookService.deleteChromebook(id);
      toast({ title: "Sucesso", description: "Chromebook excluído com sucesso", variant: "success" });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao excluir Chromebook", description: error.message, variant: "destructive" });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const syncChromebookStatus = useCallback(async (chromebookId: string, showToast = true): Promise<string | null> => {
    if (!user) {
      if (showToast) toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }
    startRequest();
    try {
      const data = await chromebookService.syncChromebookStatus(chromebookId);
      if (showToast) {
        toast({ title: "Sincronização Concluída", description: data, variant: "info" });
      }
      return data;
    } catch (error: any) {
      const errorInfo = handleSupabaseError(error);
      if (showToast) {
        toast({
          title: errorInfo.isNetwork ? "Erro de Conexão" : "Erro de Sincronização",
          description: errorInfo.message,
          variant: "destructive"
        });
      }
      logger.error('Erro ao sincronizar status do chromebook', error, { chromebookId, errorInfo });
      return null;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const getTotalAvailableChromebooks = useCallback(async (): Promise<number> => {
    return await chromebookService.getTotalAvailableChromebooks();
  }, []);

  // --- LOAN OPERATIONS ---

  const createLoan = useCallback(async (data: LoanFormData): Promise<Loan | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    startRequest();
    try {
      return await loanService.createLoan(data, user.id);
    } catch (error: any) {
      toast({ title: "Erro ao registrar empréstimo", description: error.message, variant: "destructive" });
      return null;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const bulkCreateLoans = useCallback(async (loanDataList: LoanFormData[]): Promise<{ successCount: number; errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: loanDataList.length };
    }

    startRequest();
    try {
      return await loanService.bulkCreateLoans(loanDataList, user.id);
    } catch (e: any) {
      toast({
        title: "Erro de Processamento",
        description: e.message,
        variant: "destructive"
      });
      return { successCount: 0, errorCount: loanDataList.length };
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const getActiveLoans = useCallback(async (): Promise<LoanHistoryItem[]> => {
    startRequest();
    try {
      return await loanService.getActiveLoans();
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar empréstimos ativos.", variant: "destructive" });
      return [];
    } finally {
      endRequest();
    }
  }, [startRequest, endRequest]);

  const getLoanHistory = useCallback(async (filters?: loanService.LoanHistoryFilters): Promise<LoanHistoryItem[]> => {
    startRequest();
    try {
      return await loanService.getLoanHistory(filters);
    } catch (error: any) {
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar histórico de empréstimos.", variant: "destructive" });
      return [];
    } finally {
      endRequest();
    }
  }, [startRequest, endRequest]);

  const getActiveLoansByUser = useCallback(async (params: { ra?: string; email?: string }): Promise<LoanHistoryItem[]> => {
    startRequest();
    try {
      return await loanService.getActiveLoansByUser(params);
    } catch (error: any) {
      logger.error('Erro ao buscar empréstimos ativos do usuário', error, params);
      return [];
    } finally {
      endRequest();
    }
  }, [startRequest, endRequest]);

  const getLoanDetailsByChromebookId = useCallback(async (chromebookId: string): Promise<LoanHistoryItem | null> => {
    return await loanService.getLoanDetailsByChromebookId(chromebookId);
  }, []);

  const createReturn = useCallback(async (loanId: string, data: ReturnFormData & { notes?: string }): Promise<Return | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }
    return await loanService.createReturn(loanId, data, user.id);
  }, [user]);

  const forceReturnLoan = useCallback(async (loan: LoanHistoryItem): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      const result = await loanService.forceReturnLoan(loan, user.id, user.email || undefined);
      if (result) {
        toast({
          title: "Devolução Forçada",
          description: `Empréstimo do Chromebook ${loan.chromebook_id} marcado como devolvido.`,
          variant: "success"
        });
      }
      return result;
    } catch (error: any) {
      toast({ title: "Erro ao forçar devolução", description: error.message, variant: "destructive" });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const returnChromebookById = useCallback(async (chromebookId: string, data: ReturnFormData): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      const result = await loanService.returnChromebookById(chromebookId, data, user.id);
      if (result) {
        toast({
          title: "Devolução registrada",
          description: `Chromebook ${chromebookId} devolvido com sucesso.`,
          variant: "success"
        });
      }
      return result;
    } catch (error: any) {
      toast({ title: "Erro ao registrar devolução", description: error.message, variant: "destructive" });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const bulkReturnChromebooks = useCallback(async (
    chromebookIds: string[],
    data: ReturnFormData & { notes?: string }
  ): Promise<{ successCount: number; errorCount: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { successCount: 0, errorCount: chromebookIds.length };
    }

    startRequest();
    try {
      return await loanService.bulkReturnChromebooks(chromebookIds, data, user.id);
    } catch (e: any) {
      toast({
        title: "Erro de Processamento",
        description: e.message,
        variant: "destructive"
      });
      return { successCount: 0, errorCount: chromebookIds.length };
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  // --- USER OPERATIONS ---

  const createStudent = useCallback(async (data: userService.StudentData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    startRequest();
    try {
      return await userService.createStudent(data);
    } catch (error: any) {
      logger.error('Erro ao criar aluno:', error);
      toast({ title: "Erro de Cadastro", description: error.message || "Falha ao cadastrar aluno", variant: "destructive" });
      return null;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const updateStudent = useCallback(async (id: string, data: Partial<userService.StudentData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      return await userService.updateStudent(id, data);
    } catch (error: any) {
      toast({ title: "Erro de Atualização", description: error.message, variant: "destructive" });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const bulkInsertStudents = useCallback(async (students: userService.StudentData[]): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      return await userService.bulkInsertStudents(students);
    } catch (error: any) {
      logger.error('Erro ao importar alunos:', error);
      toast({ title: "Erro de Importação", description: error.message, variant: "destructive" });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const deleteAllStudents = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      await userService.deleteAllStudents();
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
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const createTeacher = useCallback(async (data: TeacherData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    startRequest();
    try {
      return await userService.createTeacher(data);
    } catch (error: any) {
      logger.error('Erro ao criar professor:', error);
      toast({ title: "Erro de Cadastro", description: error.message || "Falha ao cadastrar professor", variant: "destructive" });
      return null;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const updateTeacher = useCallback(async (id: string, data: Partial<TeacherData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      return await userService.updateTeacher(id, data);
    } catch (error: any) {
      toast({ title: "Erro de Atualização", description: error.message, variant: "destructive" });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const bulkInsertTeachers = useCallback(async (teachers: TeacherData[]): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      return await userService.bulkInsertTeachers(teachers);
    } catch (error: any) {
      logger.error('Erro ao importar professores:', error);
      toast({ title: "Erro de Importação", description: error.message, variant: "destructive" });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const createStaff = useCallback(async (data: userService.StaffData): Promise<any> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    startRequest();
    try {
      return await userService.createStaff(data);
    } catch (error: any) {
      logger.error('Erro ao criar funcionário:', error);
      toast({ title: "Erro de Cadastro", description: error.message || "Falha ao cadastrar funcionário", variant: "destructive" });
      return null;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const updateStaff = useCallback(async (id: string, data: Partial<userService.StaffData>): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      return await userService.updateStaff(id, data);
    } catch (error: any) {
      toast({ title: "Erro de Atualização", description: error.message, variant: "destructive" });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const deleteUserRecord = useCallback(async (id: string, userType: UserType): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }

    startRequest();
    try {
      await userService.deleteUserRecord(id, userType);
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
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  // --- SCHEDULING OPERATIONS ---

  const getReservationsForWeek = useCallback(async (startDate: string, endDate: string): Promise<reservationService.Reservation[]> => {
    try {
      return await reservationService.getReservationsForWeek(startDate, endDate);
    } catch (error: any) {
      logger.error('Erro ao buscar reservas:', error);
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar agendamentos.", variant: "destructive" });
      return [];
    }
  }, []);

  const createReservation = useCallback(async (data: reservationService.ReservationData): Promise<reservationService.Reservation | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }

    startRequest();
    try {
      const res = await reservationService.createReservation(
        data,
        user.id,
        user.email || undefined,
        user.user_metadata?.full_name
      );
      toast({ title: "Sucesso", description: "Reserva agendada com sucesso!", variant: "success" });
      return res;
    } catch (error: any) {
      logger.error('Erro ao criar reserva:', error);
      toast({
        title: "Erro ao Agendar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const bulkCreateReservations = useCallback(async (
    dates: string[],
    baseData: Omit<reservationService.ReservationData, 'date'>
  ): Promise<{ success: boolean; count: number }> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return { success: false, count: 0 };
    }

    startRequest();
    try {
      const res = await reservationService.bulkCreateReservations(dates, baseData, user.id, user.email || undefined);
      toast({ title: "Sucesso", description: `${res.count} agendamentos realizados com sucesso!`, variant: "success" });
      return res;
    } catch (error: any) {
      logger.error('Erro ao criar agendamentos em lote:', error);
      toast({
        title: "Erro ao Agendar Lote",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, count: 0 };
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const deleteReservation = useCallback(async (id: string): Promise<boolean> => {
    startRequest();
    try {
      await reservationService.deleteReservation(id);
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
      endRequest();
    }
  }, [startRequest, endRequest]);

  // --- NOTIFICATION OPERATIONS ---

  const getNotifications = useCallback(async (): Promise<any[]> => {
    if (!user) return [];
    return await notificationService.getNotifications(user.id);
  }, [user]);

  const markNotificationAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    return await notificationService.markNotificationAsRead(id, user.id);
  }, [user]);

  const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    return await notificationService.markAllNotificationsAsRead(user.id);
  }, [user]);

  // --- SYSTEM SETTINGS OPERATIONS ---

  const getSystemSetting = useCallback(async (key: string, defaultValue: any = null): Promise<any> => {
    return await settingsService.getSystemSetting(key, defaultValue);
  }, []);

  const updateSystemSetting = useCallback(async (key: string, value: any): Promise<boolean> => {
    if (!user) return false;
    try {
      return await settingsService.updateSystemSetting(key, value, user.id);
    } catch (error: any) {
      toast({ title: "Erro", description: `Falha ao salvar configuração: ${error.message}`, variant: "destructive" });
      return false;
    }
  }, [user]);

  // --- SPACE OPERATIONS ---

  const getSpaces = useCallback(async (): Promise<reservationService.Space[]> => {
    return await reservationService.getSpaces();
  }, []);

  const createSpace = useCallback(async (name: string, color: string = '#3B82F6', capacity?: number): Promise<reservationService.Space | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }
    startRequest();
    try {
      const sp = await reservationService.createSpace(name, color, capacity);
      toast({ title: "Sucesso", description: "Espaço/Turma cadastrado com sucesso!", variant: "success" });
      return sp;
    } catch (error: any) {
      logger.error('Erro ao criar espaço:', error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  const deleteSpace = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    startRequest();
    try {
      await reservationService.deleteSpace(id);
      toast({ title: "Sucesso", description: "Espaço/Turma removido com sucesso!", variant: "success" });
      return true;
    } catch (error: any) {
      logger.error('Erro ao remover espaço:', error);
      toast({
        title: "Erro ao remover",
        description: error.message.includes('foreign key') ? "Este espaço está associado a uma ou mais reservas e não pode ser excluído." : error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      endRequest();
    }
  }, [user, startRequest, endRequest]);

  return {
    loading,
    getNextChromebookId,
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
    getActiveLoansByUser,
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
    markAllNotificationsAsRead,
    // SYSTEM SETTINGS
    getSystemSetting,
    updateSystemSetting,
    // ESPAÇOS
    getSpaces,
    createSpace,
    deleteSpace,
  };
};