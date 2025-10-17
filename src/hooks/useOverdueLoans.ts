import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast, dismiss } from '@/hooks/use-toast'; // Importando dismiss

interface OverdueLoan {
  loan_id: string;
  chromebook_id: string;
  student_name: string;
  student_email: string;
  loan_date: string;
  expected_return_date: string;
  days_overdue: number;
}

interface UpcomingDueLoan {
  loan_id: string;
  chromebook_id: string;
  student_name: string;
  student_email: string;
  loan_date: string;
  expected_return_date: string;
  days_until_due: number;
}

// IDs fixos para garantir que as notificações sejam atualizadas e não duplicadas
const OVERDUE_TOAST_ID = 'zelote-overdue-alert';
const UPCOMING_TOAST_ID = 'zelote-upcoming-due-alert';

export function useOverdueLoans() {
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [upcomingDueLoans, setUpcomingDueLoans] = useState<UpcomingDueLoan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOverdueLoans = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_overdue_loans');
      
      if (error) {
        console.error('Erro ao buscar empréstimos em atraso:', error);
        return;
      }

      setOverdueLoans(data || []);
    } catch (error) {
      console.error('Erro ao buscar empréstimos em atraso:', error);
    }
  }, []);

  const fetchUpcomingDueLoans = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_upcoming_due_loans');
      
      if (error) {
        console.error('Erro ao buscar empréstimos próximos ao vencimento:', error);
        return;
      }

      setUpcomingDueLoans(data || []);
    } catch (error) {
      console.error('Erro ao buscar empréstimos próximos ao vencimento:', error);
    }
  }, []);

  const checkAndNotifyOverdue = useCallback(async () => {
    setLoading(true);
    // Garantir que quaisquer toasts antigos sejam dispensados antes de carregar novos dados
    dismiss(OVERDUE_TOAST_ID);
    dismiss(UPCOMING_TOAST_ID);
    
    await fetchOverdueLoans();
    await fetchUpcomingDueLoans();
    setLoading(false);
  }, [fetchOverdueLoans, fetchUpcomingDueLoans]);

  // Verificar automaticamente a cada 30 minutos
  useEffect(() => {
    checkAndNotifyOverdue();
    
    const interval = setInterval(() => {
      checkAndNotifyOverdue();
    }, 30 * 60 * 1000); // 30 minutos

    return () => {
      clearInterval(interval);
      // Limpar toasts ao desmontar ou ao parar o intervalo
      dismiss(OVERDUE_TOAST_ID);
      dismiss(UPCOMING_TOAST_ID);
    };
  }, [checkAndNotifyOverdue]);

  // REMOVIDO: useEffect que disparava os toasts

  return {
    overdueLoans,
    upcomingDueLoans,
    loading,
    refresh: checkAndNotifyOverdue,
  };
}