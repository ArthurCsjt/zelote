import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type {
  InventoryAudit,
  CountedItemWithDetails,
  AuditFilters,
  Chromebook,
  AuditReport,
} from '@/types/database';
import { useAuditCalculations } from './useAuditCalculations';

// Mantemos o mesmo alias usado nos componentes
type DisplayCountedItem = CountedItemWithDetails;

export const useInventoryAudit = () => {
  const { user } = useAuth();
  const [activeAudit, setActiveAudit] = useState<InventoryAudit | null>(null);
  const [completedAudits, setCompletedAudits] = useState<InventoryAudit[]>([]);
  const [countedItems, setCountedItems] = useState<DisplayCountedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DisplayCountedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [totalExpected, setTotalExpected] = useState(0);
  const [allChromebooks, setAllChromebooks] = useState<Chromebook[]>([]);
  const [inventoryStats, setInventoryStats] = useState({
    total: 0,
    disponiveis: 0,
    emprestados: 0,
    fixos: 0,
  });

  // NOVO: Usando o hook de cálculo
  const { missingItems, calculateStats, generateReport: calculateActiveReport } = useAuditCalculations(
    activeAudit,
    countedItems,
    allChromebooks,
    totalExpected
  );

  // Aplica filtros (Lógica de filtro permanece aqui, pois depende do estado local)
  useEffect(() => {
    let filtered = countedItems;

    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location);
    }
    if (filters.scanMethod && filters.scanMethod !== 'all') {
      filtered = filtered.filter(item => item.scan_method === filters.scanMethod);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        (item.display_id?.toLowerCase().includes(s)) ||
        (item.model?.toLowerCase().includes(s)) ||
        (item.serial_number?.toLowerCase().includes(s)) ||
        (item.manufacturer?.toLowerCase().includes(s))
      );
    }
    if (filters.dateRange) {
      filtered = filtered.filter(item => {
        const d = new Date(item.counted_at);
        return d >= filters.dateRange!.start && d <= filters.dateRange!.end;
      });
    }
    setFilteredItems(filtered);
  }, [countedItems, filters]);

  // Carrega histórico
  const loadCompletedAudits = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from<any>('inventory_audits')
        .select('*')
        .eq('status', 'concluida')
        .eq('created_by', user.id)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      setCompletedAudits((data || []) as InventoryAudit[]);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar histórico', description: e.message, variant: 'destructive' });
    }
  }, [user]);

  // Carrega auditoria ativa e itens
  const loadActiveAudit = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsProcessing(true);
      
      // 1. Otimização: Buscar todos os Chromebooks em uma única chamada
      const { data: allCbData, error: allCbError } = await supabase
        .from<any>('chromebooks')
        .select('*');

      if (allCbError) throw allCbError;
      
      const chromebooks = (allCbData || []) as Chromebook[];
      setAllChromebooks(chromebooks);
      setTotalExpected(chromebooks.length);

      // Calcular estatísticas de inventário no cliente
      const stats = {
        total: chromebooks.length,
        disponiveis: chromebooks.filter(cb => cb.status === 'disponivel').length,
        emprestados: chromebooks.filter(cb => cb.status === 'emprestado').length,
        fixos: chromebooks.filter(cb => cb.status === 'fixo').length,
      };
      setInventoryStats(stats);

      // 2. Buscar auditoria ativa
      const { data: auditData, error: auditError } = await supabase
        .from<any>('inventory_audits')
        .select('*')
        .eq('status', 'em_andamento')
        .eq('created_by', user.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
        
      if (auditError && (auditError as any).code !== 'PGRST116') throw auditError;
      setActiveAudit((auditData || null) as InventoryAudit | null);

      if (auditData) {
        // 3. Buscar itens contados
        const { data: items, error: itemsError } = await supabase
          .from<any>('audit_items')
          .select('*')
          .eq('audit_id', auditData.id)
          .order('counted_at', { ascending: false });
        if (itemsError) throw itemsError;

        // Mapear itens contados com detalhes do chromebook
        const chromebookMap = new Map(chromebooks.map((cb: Chromebook) => [cb.id, cb]));

        const fullItems = (items || []).map((item: any) => {
          const chromebook = chromebookMap.get(item.chromebook_id);
          const display: DisplayCountedItem = {
            ...item,
            display_id: chromebook?.chromebook_id || 'ID não encontrado',
            model: chromebook?.model,
            manufacturer: chromebook?.manufacturer ?? undefined,
            serial_number: chromebook?.serial_number ?? undefined,
            location: chromebook?.location ?? undefined,
            condition: chromebook?.condition ?? undefined,
            status: chromebook?.status,
          } as DisplayCountedItem;
          return display;
        });
        
        setCountedItems(fullItems);
      } else {
        setCountedItems([]);
      }
    } catch (e: any) {
      toast({ title: 'Erro ao carregar auditoria ativa', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  // Recarregar quando montar
  useEffect(() => {
    loadActiveAudit();
    loadCompletedAudits();
  }, [loadActiveAudit, loadCompletedAudits]);

  // Recarregar sob demanda (usado na aba Histórico)
  const reloadAudits = useCallback(async () => {
    await Promise.all([loadActiveAudit(), loadCompletedAudits()]);
  }, [loadActiveAudit, loadCompletedAudits]);

  // Iniciar auditoria
  const startAudit = async (name: string) => {
    if (!user) return;
    try {
      setIsProcessing(true);
      const { data, error } = await supabase
        .from<any>('inventory_audits')
        .insert({
          audit_name: name,
          created_by: user.id,
          status: 'em_andamento',
        })
        .select('*')
        .single();
      if (error) throw error;
      setActiveAudit(data as InventoryAudit);
      setCountedItems([]);
      setFilteredItems([]);
      toast({ title: 'Contagem iniciada!', description: `A auditoria "${name}" começou.` });
    } catch (e: any) {
      toast({ title: 'Erro ao iniciar contagem', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Contar item
  const countItem = async (identifier: string, method: 'manual_id' | 'qr_code') => {
    if (!activeAudit || !user) return;

    // Normaliza o identificador: '008' => 'CHR008'; 'chr001' => 'CHR001'
    const raw = identifier.trim();
    const onlyDigits = /^\d+$/.test(raw);
    const normalized = onlyDigits
      ? `CHR${raw.padStart(3, '0')}`
      : raw.toUpperCase().startsWith('CHR')
        ? raw.toUpperCase() // Mantém o CHR maiúsculo
        : raw; // Se não for CHR nem dígito, usa o raw

    if (countedItems.some(i => i.display_id === normalized || i.display_id === raw)) {
      toast({ title: 'Item já contado', description: `O Chromebook "${identifier}" já está na lista.`, variant: 'destructive' });
      return;
    }

    try {
      setIsProcessing(true);
      
      // 1. Encontrar o Chromebook pelo ID normalizado ou outros campos
      const { data: chromebook, error: findError } = await supabase
        .from<any>('chromebooks')
        .select('*')
        .or(
          [
            `chromebook_id.eq.${normalized}`,
            `chromebook_id.eq.${raw}`,
            `serial_number.eq.${raw}`,
            `patrimony_number.eq.${raw}`,
          ].join(',')
        )
        .single();
      if (findError || !chromebook) throw new Error(`Chromebook com identificador "${identifier}" não encontrado.`);

      // 2. Inserir o item na contagem
      const { data, error } = await supabase
        .from<any>('audit_items')
        .insert({
          audit_id: activeAudit.id,
          chromebook_id: chromebook.id,
          counted_at: new Date().toISOString(),
          counted_by: user.id,
          scan_method: method,
          expected_location: chromebook.location,
          location_found: chromebook.location,
          condition_found: chromebook.condition,
          model_found: chromebook.model,
        })
        .select('*')
        .single();
      if (error) throw error;

      // 3. Criar o objeto de exibição
      const display: DisplayCountedItem = {
        ...data,
        display_id: chromebook.chromebook_id,
        model: chromebook.model,
        manufacturer: chromebook.manufacturer ?? undefined,
        serial_number: chromebook.serial_number ?? undefined,
        location: chromebook.location ?? undefined,
        expected_location: chromebook.location ?? undefined,
        location_found: chromebook.location ?? undefined,
        condition: chromebook.condition ?? undefined,
        condition_found: chromebook.condition ?? undefined,
        status: chromebook.status,
      } as DisplayCountedItem;

      setCountedItems(prev => [display, ...prev]);
      toast({ title: 'Item contado!', description: `ID: ${chromebook.chromebook_id} - ${chromebook.model}`, duration: 2000 });
    } catch (e: any) {
      toast({ title: 'Erro ao contar item', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Remover item
  const removeItem = async (itemId: string) => {
    if (!activeAudit) return;
    try {
      setIsProcessing(true);
      const { error } = await supabase.from<any>('audit_items').delete().eq('id', itemId);
      if (error) throw error;
      setCountedItems(prev => prev.filter(i => i.id !== itemId));
      toast({ title: 'Item removido', description: 'Item removido da contagem.' });
    } catch (e: any) {
      toast({ title: 'Erro ao remover item', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Atualizar localização (registrar como encontrada)
  const updateItemLocation = async (itemId: string, newLocation: string) => {
    if (!activeAudit) return;
    try {
      const { error } = await supabase.from<any>('audit_items').update({ location_found: newLocation }).eq('id', itemId);
      if (error) throw error;
      setCountedItems(prev => prev.map(i => (i.id === itemId ? { ...i, location_found: newLocation } as DisplayCountedItem : i)));
      toast({ title: 'Localização atualizada' });
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar localização', description: e.message, variant: 'destructive' });
    }
  };

  // Finalizar auditoria
  const completeAudit = async () => {
    if (!activeAudit) return;
    try {
      setIsProcessing(true);
      const report = calculateActiveReport(); // Usa a função do hook de cálculo
      const { error } = await supabase
        .from<any>('inventory_audits')
        .update({
          status: 'concluida',
          completed_at: new Date().toISOString(),
          total_counted: report.summary.totalCounted,
          total_expected: report.summary.totalExpected,
        })
        .eq('id', activeAudit.id);
      if (error) throw error;
      toast({ title: 'Contagem finalizada!', description: `Auditoria concluída com ${report.summary.totalCounted} itens (${report.summary.completionRate} de conclusão).` });
      setActiveAudit(null);
      setCountedItems([]);
      setFilteredItems([]);
      await loadCompletedAudits();
    } catch (e: any) {
      toast({ title: 'Erro ao finalizar', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Excluir auditoria e itens
  const deleteAudit = async (auditId: string) => {
    try {
      setIsProcessing(true);
      const { error: itemsErr } = await supabase.from<any>('audit_items').delete().eq('audit_id', auditId);
      if (itemsErr) throw itemsErr;
      const { error: auditErr } = await supabase.from<any>('inventory_audits').delete().eq('id', auditId);
      if (auditErr) throw auditErr;
      if (activeAudit?.id === auditId) {
        setActiveAudit(null);
        setCountedItems([]);
        setFilteredItems([]);
      }
      // Atualização otimista da lista local
      setCompletedAudits(prev => prev.filter(a => a.id !== auditId));
      // Recarrega dados para garantir consistência
      await reloadAudits();
      toast({ title: 'Auditoria excluída', description: 'A auditoria foi removida com sucesso.' });
    } catch (e: any) {
      toast({ title: 'Erro ao excluir auditoria', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // NOVO: Função para gerar relatório de qualquer auditoria (ativa ou concluída)
  const generateReport = useCallback((auditId: string): AuditReport | null => {
    const audit = completedAudits.find(a => a.id === auditId);
    
    if (!audit) {
      // Se não for a auditoria ativa, precisamos buscar os dados (simplificado para o escopo atual)
      // Para o MVP, vamos apenas retornar o relatório da última auditoria concluída se for a aba de relatórios
      if (activeAudit?.id === auditId) {
        return calculateActiveReport();
      }
      
      // Se for uma auditoria concluída, precisamos de uma lógica mais complexa para buscar os itens
      // e os dados de chromebooks daquele momento.
      // Por simplicidade, vamos apenas retornar o relatório da última concluída se for a aba de relatórios
      // e o ID for o da última concluída.
      if (completedAudits.length > 0 && completedAudits[0].id === auditId) {
        // Para gerar o relatório de uma auditoria concluída, precisaríamos re-executar a lógica de cálculo
        // com os dados históricos. Como isso é complexo e exige mais chamadas ao DB,
        // vamos simplificar: se for a última concluída, usaremos os dados resumidos.
        // No entanto, para o componente AuditReportComponent funcionar, ele precisa de dados detalhados.
        
        // Para evitar complexidade excessiva de busca de dados históricos, vamos manter o foco
        // no relatório da auditoria ATIVA (se houver) ou apenas exibir o resumo da última concluída.
        // Como o AuditReportComponent espera dados detalhados, vamos apenas retornar null
        // e deixar o componente de relatório lidar com a ausência de dados detalhados.
        return null;
      }
      
      return null;
    }
    
    // Se for a última auditoria concluída, podemos tentar gerar um relatório básico
    // usando os dados resumidos salvos no DB (total_counted, total_expected).
    // No entanto, o AuditReportComponent espera dados de discrepância e estatísticas detalhadas.
    
    // Para o MVP, vamos apenas retornar um relatório básico com o resumo.
    return {
      summary: {
        totalCounted: audit.total_counted || 0,
        totalExpected: audit.total_expected || 0,
        completionRate: audit.total_expected && audit.total_counted ? `${((audit.total_counted / audit.total_expected) * 100).toFixed(1)}%` : '0.0%',
        duration: 'N/A', // Não temos a duração detalhada salva
        itemsPerHour: 0,
        averageTimePerItem: '0s',
      },
      discrepancies: { missing: [], extra: [], locationMismatches: [], conditionIssues: [] },
      statistics: { byLocation: [], byMethod: { qr_code: 0, manual: 0, percentage_qr: 0, percentage_manual: 0 }, byCondition: [], byTime: [] },
    };
    
  }, [activeAudit, calculateActiveReport, completedAudits]);


  return {
    activeAudit,
    completedAudits,
    countedItems,
    filteredItems,
    totalExpected,
    inventoryStats,
    isProcessing,
    filters,
    setFilters,
    startAudit,
    countItem,
    removeItem,
    updateItemLocation,
    completeAudit,
    deleteAudit,
    reloadAudits,
    generateReport, // Exportando a nova função
    calculateStats,
    missingItems,
    allChromebooks,
  };
}