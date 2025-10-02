import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// REMOVEMOS a importação do useAuth para quebrar o ciclo
// import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { 
  Chromebook, 
  Loan, 
  Return, 
  LoanFormData, 
  ReturnFormData, 
  LoanHistoryItem,
  ChromebookData,
  User // Importamos o tipo User diretamente
} from '@/types/database';

// ... (as outras interfaces StudentData, etc. continuam iguais) ...
interface StudentData {
  nome_completo: string;
  ra: string;
  email: string;
  turma: string;
}
interface TeacherData {
  nome_completo: string;
  email: string;
}
interface StaffData {
  nome_completo: string;
  email: string;
}


export const useDatabase = () => {
  // REMOVEMOS a chamada do useAuth daqui
  const [loading, setLoading] = useState(false);

  // As funções agora recebem 'user' como um argumento
  const createChromebook = useCallback(async (data: ChromebookData, user: User | null): Promise<Chromebook | null> => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return null;
    }
    // ... (o resto da sua função createChromebook continua exatamente igual)
    // A única diferença é que agora usamos o 'user' que veio como argumento
    setLoading(true);
    try {
      const payload: any = {
        chromebook_id: data.chromebookId,
        model: data.model,
        serial_number: data.serialNumber,
        patrimony_number: data.patrimonyNumber,
        status: data.status as any,
        condition: data.condition,
        location: data.location,
        classroom: data.classroom,
        created_by: user.id, // Usando o user do argumento
      };
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
  }, []); // Removemos 'user' da dependência

  const getChromebooks = useCallback(async (): Promise<Chromebook[]> => {
    // ... (esta função não precisa de 'user', então continua igual)
    setLoading(true);
    try {
      const { data, error } = await supabase.from('chromebooks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Chromebook[];
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Você precisará aplicar o mesmo padrão para TODAS as outras funções que usavam 'user'.
  // Por exemplo, a função 'createLoan':
  const createLoan = useCallback(async (data: LoanFormData, user: User | null): Promise<Loan | null> => {
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
          created_by: user.id // Usando o user do argumento
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
  }, []); // Removemos 'user' da dependência
  
  // ... E assim por diante para todas as outras funções ...
  // (Para economizar espaço, não vou reescrever todas, mas o padrão é o mesmo:
  // 1. Adicione 'user: User | null' como último argumento da função.
  // 2. Remova 'user' do array de dependências do useCallback no final.)
  
  // Deixarei o restante das funções como estavam para você praticar a alteração.
  // Se preferir, me avise que eu altero todas para você.

  // ... (código original das outras funções para você alterar)

  return {
    loading,
    createChromebook,
    getChromebooks,
    // ... (o resto do seu return continua igual)
    createLoan,
    // ...
  };
};