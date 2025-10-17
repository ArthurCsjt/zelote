import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Audit, CountedItem } from '@/types/database';

type DisplayCountedItem = CountedItem & { display_id?: string };

export const useInventoryAudit = () => {
  const { user } = useAuth();
  const [activeAudit, setActiveAudit] = useState<Audit | null>(null);
  const [completedAudits, setCompletedAudits] = useState<Audit[]>([]);
  const [countedItems, setCountedItems] = useState<DisplayCountedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadCompletedAudits = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('inventory_audits')
        .select('*')
        .eq('status', 'concluida')
        .eq('created_by', user.id)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      setCompletedAudits(data || []);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar histórico', description: e.message, variant: 'destructive' });
    }
  }, [user]);

  const loadActiveAudit = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsProcessing(true);
      const { data, error } = await supabase
        .from('inventory_audits') 
        .select('*')
        .eq('status', 'em_andamento')
        .eq('created_by', user.id)
        .order('start_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      setActiveAudit(data);
      if (data) {
        const { data: items, error: itemsError } = await supabase
          .from('audit_items')
          .select('*')
          .eq('audit_id', data.id)
          .order('counted_at', { ascending: false });
        if (itemsError) throw itemsError;
        
        const itemPromises = items.map(async (item) => {
          const { data: chromebook } = await supabase
            .from('chromebooks')
            .select('chromebook_id')
            .eq('id', item.chromebook_id)
            .single();
          return { ...item, display_id: chromebook?.chromebook_id || 'ID não encontrado' };
        });
        const fullItems = await Promise.all(itemPromises);
        setCountedItems(fullItems);
      }
    } catch (e: any) {
      toast({ title: 'Erro ao carregar auditoria ativa', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  useEffect(() => {
    loadActiveAudit();
    loadCompletedAudits();
  }, [loadActiveAudit, loadCompletedAudits]);

  const startAudit = async (name: string) => {
    if (!user) return;
    try {
      setIsProcessing(true);
      const { data, error } = await supabase
        .from('inventory_audits')
        .insert({
          audit_name: name,
          created_by: user.id,
          status: 'em_andamento',
        })
        .select('*')
        .single();
      if (error) throw error;
      setActiveAudit(data);
      setCountedItems([]);
      toast({ title: 'Contagem iniciada!', description: `A auditoria "${name}" começou.`, variant: "success" });
    } catch (e: any) {
      toast({ title: 'Erro ao iniciar contagem', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const countItem = async (identifier: string, method: 'manual' | 'qr_code') => {
    if (!activeAudit || !user) return;
    
    if (countedItems.some(item => item.display_id === identifier)) {
      toast({
        title: 'Item já contado',
        description: `O Chromebook "${identifier}" já está na lista.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      const { data: chromebook, error: findError } = await supabase
        .from('chromebooks')
        .select('id, chromebook_id')
        .or(`chromebook_id.eq.${identifier},serial_number.eq.${identifier},patrimony_number.eq.${identifier}`)
        .single();
      if (findError || !chromebook) {
        throw new Error(`Chromebook com identificador "${identifier}" não encontrado.`);
      }

      const { data, error } = await supabase
        .from('audit_items')
        .insert({
          audit_id: activeAudit.id,
          chromebook_id: chromebook.id,
          counted_at: new Date().toISOString(),
          counted_by: user.id,
          scan_method: method,
        })
        .select('*')
        .single();
      if (error) throw error;
      
      const displayItem = { ...data, display_id: chromebook.chromebook_id };
      setCountedItems(prev => [displayItem, ...prev]);

      toast({ title: 'Item contado!', description: `ID: ${chromebook.chromebook_id}`, variant: "success" });
    } catch (e: any) {
      toast({ title: 'Erro ao contar item', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const completeAudit = async () => {
    if (!activeAudit) return;
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('inventory_audits')
        .update({ status: 'concluida', completed_at: new Date().toISOString() })
        .eq('id', activeAudit.id);

      if (error) throw error;

      toast({ title: 'Contagem finalizada!', description: `A auditoria foi concluída com ${countedItems.length} itens.`, variant: "success" });
      setActiveAudit(null);
      setCountedItems([]);
      await loadCompletedAudits();
    } catch (e: any) {
      toast({ title: 'Erro ao finalizar', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return { activeAudit, completedAudits, countedItems, startAudit, countItem, completeAudit, isProcessing };
};