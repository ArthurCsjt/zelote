import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Chromebook } from '@/types/database';
import logger from '@/utils/logger';

export interface InventoryAudit {
  id: string;
  audit_name: string;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  created_by?: string | null;
  notes?: string | null;
  total_expected?: number | null;
  total_counted?: number | null;
}

export interface AuditItem {
  id: string;
  audit_id: string;
  chromebook_id: string;
  scan_method: 'qr' | 'manual';
  counted_at: string;
  counted_by?: string | null;
  notes?: string | null;
  location_found?: string | null;
  condition_found?: string | null;
  physical_status?: string | null;
}

export function useInventoryAudit() {
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [activeAudit, setActiveAudit] = useState<InventoryAudit | null>(null);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_audits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudits((data || []) as unknown as InventoryAudit[]);
    } catch (e: unknown) {
      logger.error('Erro ao buscar auditorias', e);
      toast({ title: 'Erro', description: 'Falha ao carregar auditorias.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChromebooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('active_chromebooks')
        .select('*');

      if (error) throw error;
      setChromebooks((data || []) as unknown as Chromebook[]);
    } catch (e: unknown) {
      logger.error('Erro ao buscar chromebooks', e);
    }
  }, []);

  const startAudit = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const chromebooksCount = chromebooks.length;
      
      const { data, error } = await supabase
        .from('inventory_audits')
        .insert({
          audit_name: name,
          status: 'active',
          started_at: new Date().toISOString(),
          total_expected: chromebooksCount,
          total_counted: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const newAudit = data as unknown as InventoryAudit;
      setActiveAudit(newAudit);
      setAuditItems([]);
      toast({ title: 'Sucesso', description: 'Auditoria iniciada.' });
      return newAudit;
    } catch (e: unknown) {
      logger.error('Erro ao iniciar auditoria', e);
      toast({ title: 'Erro', description: 'Falha ao iniciar auditoria.', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [chromebooks.length]);

  const selectAudit = useCallback(async (auditId: string) => {
    setLoading(true);
    try {
      const { data: auditData, error: auditError } = await supabase
        .from('inventory_audits')
        .select('*')
        .eq('id', auditId)
        .single();

      if (auditError) throw auditError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('audit_items')
        .select('*')
        .eq('audit_id', auditId);

      if (itemsError) throw itemsError;

      setActiveAudit(auditData as unknown as InventoryAudit);
      setAuditItems((itemsData || []) as unknown as AuditItem[]);
    } catch (e: unknown) {
      logger.error('Erro ao selecionar auditoria', e);
      toast({ title: 'Erro', description: 'Falha ao carregar auditoria.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  const addAuditItem = useCallback(async (chromebookId: string, scanMethod: 'qr' | 'manual', notes?: string) => {
    if (!activeAudit) return null;

    try {
      // Check if already counted
      const existing = auditItems.find(item => item.chromebook_id === chromebookId);
      if (existing) {
        toast({ title: 'Aviso', description: 'Este dispositivo já foi contado.', variant: 'default' });
        return null;
      }

      const { data, error } = await supabase
        .from('audit_items')
        .insert({
          audit_id: activeAudit.id,
          chromebook_id: chromebookId,
          scan_method: scanMethod,
          counted_at: new Date().toISOString(),
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem = data as unknown as AuditItem;
      setAuditItems(prev => [...prev, newItem]);

      // Update audit count
      await supabase
        .from('inventory_audits')
        .update({ total_counted: auditItems.length + 1 })
        .eq('id', activeAudit.id);

      return newItem;
    } catch (e: unknown) {
      logger.error('Erro ao adicionar item de auditoria', e);
      toast({ title: 'Erro', description: 'Falha ao registrar dispositivo.', variant: 'destructive' });
      return null;
    }
  }, [activeAudit, auditItems]);

  const completeAudit = useCallback(async () => {
    if (!activeAudit) return false;

    try {
      const { error } = await supabase
        .from('inventory_audits')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_counted: auditItems.length,
        })
        .eq('id', activeAudit.id);

      if (error) throw error;

      setActiveAudit(null);
      setAuditItems([]);
      await fetchAudits();
      toast({ title: 'Sucesso', description: 'Auditoria finalizada.' });
      return true;
    } catch (e: unknown) {
      logger.error('Erro ao finalizar auditoria', e);
      toast({ title: 'Erro', description: 'Falha ao finalizar auditoria.', variant: 'destructive' });
      return false;
    }
  }, [activeAudit, auditItems.length, fetchAudits]);

  const cancelAudit = useCallback(async () => {
    if (!activeAudit) return false;

    try {
      const { error } = await supabase
        .from('inventory_audits')
        .update({ status: 'cancelled' })
        .eq('id', activeAudit.id);

      if (error) throw error;

      setActiveAudit(null);
      setAuditItems([]);
      await fetchAudits();
      toast({ title: 'Auditoria cancelada', description: 'A auditoria foi cancelada.' });
      return true;
    } catch (e: unknown) {
      logger.error('Erro ao cancelar auditoria', e);
      toast({ title: 'Erro', description: 'Falha ao cancelar auditoria.', variant: 'destructive' });
      return false;
    }
  }, [activeAudit, fetchAudits]);

  return {
    audits,
    activeAudit,
    auditItems,
    chromebooks,
    loading,
    fetchAudits,
    fetchChromebooks,
    startAudit,
    selectAudit,
    addAuditItem,
    completeAudit,
    cancelAudit,
  };
}
