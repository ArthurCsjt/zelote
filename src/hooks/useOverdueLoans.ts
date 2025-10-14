import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
    if (overdueLoans.length > 0) {
      toast({
        title: `⚠️ ${overdueLoans.length} Empréstimo${overdueLoans.length > 1 ? 's' : ''} em Atraso`,
        description: `Há empréstimo${overdueLoans.length > 1 ? 's' : ''} que passou${overdueLoans.length === 1 ? 'u' : 'ram'} do prazo de devolução.`,
        variant: "destructive",
      });
    }

    if (upcomingDueLoans.length > 0) {
      toast({
        title: `📅 ${upcomingDueLoans.length} Empréstimo${upcomingDueLoans.length > 1 ? 's' : ''} Vencendo`,
        description: `Há empréstimo${upcomingDueLoans.length > 1 ? 's' : ''} com prazo próximo ao vencimento.`,
      });
    }
  }, [overdueLoans.length, upcomingDueLoans.length]);

  return {
    overdueLoans,
    upcomingDueLoans,
    loading,
    refresh: checkAndNotifyOverdue,
  };
}