import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, Database, Loader2, AlertTriangle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '@/hooks/useDatabase';
import type { LoanFormData } from '@/types/database';

const sampleLoans: LoanFormData[] = [
  {
    studentName: 'Aluno Teste 1',
    ra: '10001',
    email: 'aluno1@sj.g12.br',
    chromebookId: 'CHR001',
    purpose: 'Aula de Matemática',
    userType: 'aluno',
    loanType: 'individual',
    expectedReturnDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Vence amanhã
  },
  {
    studentName: 'Professor Teste',
    ra: '',
    email: 'professor@sj.pro.br',
    chromebookId: 'CHR002',
    purpose: 'Projeto de Ciências',
    userType: 'professor',
    loanType: 'individual',
    expectedReturnDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Atrasado
  },
  {
    studentName: 'Funcionário Teste',
    ra: '',
    email: 'funcionario@colegiosaojudas.com.br',
    chromebookId: 'CHR004',
    purpose: 'Uso Administrativo',
    userType: 'funcionario',
    loanType: 'individual',
    expectedReturnDate: undefined, // Sem prazo
  },
];

export const LoanDebugPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { bulkCreateLoans } = useDatabase();

  const addSampleLoans = async () => {
    setIsLoading(true);
    try {
      // 1. Garantir que os Chromebooks de teste existam e estejam disponíveis
      const chromebookIds = sampleLoans.map(l => l.chromebookId);
      const { data: existingCbs, error: cbError } = await supabase
        .from('chromebooks')
        .select('chromebook_id, status')
        .in('chromebook_id', chromebookIds);

      if (cbError) throw cbError;

      const missingCbs = chromebookIds.filter(id => !existingCbs.some(cb => cb.chromebook_id === id));
      if (missingCbs.length > 0) {
        toast({
          title: 'Erro de Pré-requisito',
          description: `Chromebooks de teste ausentes: ${missingCbs.join(', ')}. Adicione dados de inventário primeiro.`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      const unavailableCbs = existingCbs.filter(cb => cb.status !== 'disponivel');
      if (unavailableCbs.length > 0) {
        toast({
          title: 'Erro de Status',
          description: `Chromebooks indisponíveis: ${unavailableCbs.map(cb => `${cb.chromebook_id} (${cb.status})`).join(', ')}.`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // 2. Criar os empréstimos
      const { successCount, errorCount } = await bulkCreateLoans(sampleLoans);

      if (successCount > 0) {
        toast({
          title: 'Empréstimos de Exemplo Adicionados!',
          description: `${successCount} empréstimos criados. ${errorCount > 0 ? `(${errorCount} falha(s))` : ''}`,
        });
        
        // Invalida o cache de histórico e empréstimos ativos
        queryClient.invalidateQueries({ queryKey: ['loanHistory'] });
        queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
        queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
      } else {
        toast({
          title: 'Falha na Inserção',
          description: 'Nenhum empréstimo de exemplo foi criado. Verifique o console.',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      console.error('Erro inesperado:', e);
      toast({
        title: 'Erro inesperado',
        description: e.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="border-violet-200 bg-violet-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-violet-800">
          <Database className="h-5 w-5" />
          Debug: Dados de Empréstimo
        </CardTitle>
        <CardDescription className="text-violet-700">
          Adicione empréstimos de exemplo (Ativo, Atrasado, Sem Prazo) para testar o Dashboard e Histórico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={addSampleLoans}
          disabled={isLoading}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adicionando Empréstimos...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar 3 Empréstimos de Exemplo
            </>
          )}
        </Button>
        <p className="text-xs text-violet-700 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Requer que os Chromebooks CHR001, CHR002 e CHR004 estejam cadastrados e 'disponivel'.
        </p>
      </CardContent>
    </GlassCard>
  );
};