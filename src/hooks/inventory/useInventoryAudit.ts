import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Database } from '@/types/database'; // Importando os tipos do Supabase

// Definindo os tipos para facilitar o trabalho
type Audit = Database['public']['Tables']['inventory_audits']['Row'];
type AuditItem = Database['public']['Tables']['audit_items']['Row'];

export const useInventoryAudit = () => {
  const [activeAudit, setActiveAudit] = useState<Audit | null>(null);
  const [countedItems, setCountedItems] = useState<AuditItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Função para INICIAR uma nova auditoria
  const startAudit = async (name: string) => {
    setIsProcessing(true);
    const { data, error } = await supabase
      .from('inventory_audits')
      .insert({ audit_name: name })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível iniciar a auditoria.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    setActiveAudit(data);
    setCountedItems([]); // Limpa a lista de itens da auditoria anterior
    setIsProcessing(false);
    toast({ title: 'Auditoria iniciada!', description: `Contagem '${name}' em andamento.` });
  };

  // Função para CONTAR um item (via QR Code ou ID manual)
  const countItem = async (chromebookIdentifier: string, method: 'qr_code' | 'manual_id') => {
    if (!activeAudit) {
      toast({ title: 'Erro', description: 'Nenhuma auditoria ativa.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    // 1. Encontrar o chromebook no banco de dados pelo seu ID único (não o UUID)
    const { data: chromebook, error: findError } = await supabase
      .from('chromebooks')
      .select('id, chromebook_id, model')
      .eq('chromebook_id', chromebookIdentifier)
      .single();

    if (findError || !chromebook) {
      toast({ title: 'Não encontrado', description: `Chromebook com ID '${chromebookIdentifier}' não existe.`, variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // 2. Verificar se este item já foi contado NESTA auditoria
    const alreadyCounted = countedItems.some(item => item.chromebook_id === chromebook.id);
    if (alreadyCounted) {
      toast({ title: 'Atenção', description: `O item ${chromebook.chromebook_id} já foi contado.`, variant: 'default' });
      setIsProcessing(false);
      return;
    }

    // 3. Inserir o registro da contagem na tabela 'audit_items'
    const { data: newAuditItem, error: insertError } = await supabase
      .from('audit_items')
      .insert({
        audit_id: activeAudit.id,
        chromebook_id: chromebook.id,
        scan_method: method,
      })
      .select()
      .single();

    if (insertError) {
      toast({ title: 'Erro', description: 'Não foi possível registrar a contagem.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }
    
    // Atualiza o estado local e dá feedback
    setCountedItems(prev => [...prev, newAuditItem]);
    toast({ title: 'Contado!', description: `${chromebook.chromebook_id} - ${chromebook.model}` });
    setIsProcessing(false);
  };

  // Função para FINALIZAR a auditoria
  const completeAudit = async () => {
    if (!activeAudit) return;

    setIsProcessing(true);
    const { error } = await supabase
      .from('inventory_audits')
      .update({
        status: 'concluida',
        completed_at: new Date().toISOString(),
      })
      .eq('id', activeAudit.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível finalizar a auditoria.', variant: 'destructive' });
    } else {
      toast({ title: 'Auditoria Concluída!', description: 'A contagem foi finalizada com sucesso.' });
      setActiveAudit(null);
      setCountedItems([]);
    }
    setIsProcessing(false);
  };

  // O hook retorna os estados e as funções para a UI usar
  return {
    activeAudit,
    countedItems,
    isProcessing,
    startAudit,
    countItem,
    completeAudit,
  };
};