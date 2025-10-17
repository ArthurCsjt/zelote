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

  // Efeito para exibir notificações quando os dados mudam
  useEffect(() => {
    // 1. Notificação de Atraso
    if (overdueLoans.length > 0) {
      const message = overdueLoans.length === 1 
        ? `1 Chromebook está em atraso (${overdueLoans[0].chromebook_id}).`
        : `${overdueLoans.length} Chromebooks estão em atraso.`;
        
      toast({
        id: OVERDUE_TOAST_ID,
        title: "🚨 ATENÇÃO: Empréstimos Atrasados",
        description: message,
        variant: 'destructive',
        duration: 1000000, // Persistente
      });
    } else {
      dismiss(OVERDUE_TOAST_ID);
    }

    // 2. Notificação de Próximo Vencimento
    if (upcomingDueLoans.length > 0) {
      const message = upcomingDueLoans.length === 1 
        ? `1 Chromebook vence em breve (${upcomingDueLoans[0].chromebook_id}).`
        : `${upcomingDueLoans.length} Chromebooks vencem nos próximos 3 dias.`;
        
      toast({
        id: UPCOMING_TOAST_ID,
        title: "⚠️ Prazo Próximo",
        description: message,
        variant: 'info',
        duration: 1000000, // Persistente
      });
    } else {
      dismiss(UPCOMING_TOAST_ID);
    }
  }, [overdueLoans, upcomingDueLoans]); // Depende dos estados de dados

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

  return {
    overdueLoans,
    upcomingDueLoans,
    loading,
    refresh: checkAndNotifyOverdue,
  };
}