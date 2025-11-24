import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast, dismissToast } from '@/hooks/use-toast';

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

export function useOverdueLoans() {
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [upcomingDueLoans, setUpcomingDueLoans] = useState<UpcomingDueLoan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOverdueLoans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_overdue_loans');
      
      if (error) {
        console.error('Erro ao buscar empréstimos em atraso:', error);
        return;
      }

      setOverdueLoans(data || []);
    } catch (error) {
      console.error('Erro ao buscar empréstimos em atraso:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcomingDueLoans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_upcoming_due_loans');
      
      if (error) {
        console.error('Erro ao buscar empréstimos próximos ao vencimento:', error);
        return;
      }

      setUpcomingDueLoans(data || []);
    } catch (error) {
      console.error('Erro ao buscar empréstimos próximos ao vencimento:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAndNotifyOverdue = useCallback(async () => {
    await fetchOverdueLoans();
    await fetchUpcomingDueLoans();
  }, [fetchOverdueLoans, fetchUpcomingDueLoans]);

  // Verificar automaticamente a cada 30 minutos
  useEffect(() => {
    checkAndNotifyOverdue();
    
    const interval = setInterval(() => {
      checkAndNotifyOverdue();
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(interval);
  }, [checkAndNotifyOverdue]);

  // Mostrar notificações quando houver atrasos
  useEffect(() => {
    // 1. Alertas de Atraso (CRÍTICO)
    if (overdueLoans.length > 0) {
      const isPlural = overdueLoans.length > 1;
      const title = `⚠️ ${overdueLoans.length} Empréstimo${isPlural ? 's' : ''} em Atraso`;
      const description = `Há ${overdueLoans.length} empréstimo${isPlural ? 's' : ''} que ${isPlural ? 'passaram' : 'passou'} do prazo de devolução.`;
      
      // Usando um ID fixo para garantir que apenas um toast de atraso esteja visível
      toast.error(title, {
        description: description,
        id: 'overdue-alert', 
        duration: 1000000, // Manter visível
      });
    } else {
      // Se não houver atrasos, dispensa o toast
      dismissToast('overdue-alert');
    }

    // 2. Alertas de Vencimento Próximo (INFO)
    if (upcomingDueLoans.length > 0) {
      const isPlural = upcomingDueLoans.length > 1;
      const title = `📅 ${upcomingDueLoans.length} Empréstimo${isPlural ? 's' : ''} Vencendo`;
      const description = `Há empréstimo${isPlural ? 's' : ''} com prazo próximo ao vencimento.`;
      
      // Usando um ID fixo para garantir que apenas um toast de vencimento esteja visível
      toast.info(title, {
        description: description,
        id: 'upcoming-due-alert',
        duration: 1000000, // Manter visível
      });
    } else {
      // Se não houver vencimentos próximos, dispensa o toast
      dismissToast('upcoming-due-alert');
    }
  }, [overdueLoans.length, upcomingDueLoans.length]);

  return {
    overdueLoans,
    upcomingDueLoans,
    loading,
    refresh: checkAndNotifyOverdue,
  };
}