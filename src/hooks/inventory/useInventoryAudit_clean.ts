import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type {
  InventoryAudit,
  CountedItemWithDetails,
  AuditFilters,
  AuditReport,
  LocationStats,
  MethodStats,
  ConditionStats,
  TimeStats,
  AuditDiscrepancy,
  Chromebook, // Importado Chromebook
} from '@/types/database';

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
  const [allChromebooks, setAllChromebooks] = useState<Chromebook[]>([]); // Novo estado para todos os Chromebooks
  const [inventoryStats, setInventoryStats] = useState({
    total: 0,
    disponiveis: 0,
    emprestados: 0,
    fixos: 0,
  });

  // Aplica filtros
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

  // Calcula itens faltantes
  const missingItems = allChromebooks.filter(cb => 
    !countedItems.some(item => item.chromebook_id === cb.id)
  );

  // Estatísticas
  const calculateStats = useCallback(() => {
    const totalCounted = countedItems.length;
    const completionRate = totalExpected > 0 ? (totalCounted / totalExpected * 100).toFixed(1) : '0';

    const byLocationMap = countedItems.reduce((acc, item) => {
      const loc = item.location || 'Não informado';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationStats: LocationStats[] = Object.entries(byLocationMap).map(([location, counted]) => ({
      location,
      counted,
      expected: 0,
      discrepancy: 0 - counted,
    }));

    const qrCount = countedItems.filter(i => i.scan_method === 'qr_code').length;
    const manualCount = countedItems.filter(i => i.scan_method === 'manual_id').length;
    const methodStats: MethodStats = {
      qr_code: qrCount,
      manual: manualCount,
      percentage_qr: totalCounted > 0 ? (qrCount / totalCounted * 100) : 0,
      percentage_manual: totalCounted > 0 ? (manualCount / totalCounted * 100) : 0,
    };

    const condMap = countedItems.reduce((acc, item) => {
      const c = item.condition_found || item.condition || 'Não informado';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const conditionStats: ConditionStats[] = Object.entries(condMap).map(([condition, count]) => ({
      condition,
      count,
      percentage: totalCounted > 0 ? (count / totalCounted * 100) : 0,
    }));

    const timeMap = countedItems.reduce((acc, i) => {
      const h = new Date(i.counted_at).getHours().toString().padStart(2, '0');
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    let cumulative = 0;
    const timeStats: TimeStats[] = Object.entries(timeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count, cumulative: (cumulative += count) }));

    return { totalCounted, completionRate: `${completionRate}%`, locationStats, methodStats, conditionStats, timeStats };
  }, [countedItems, totalExpected]);

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
      
      // 1. Buscar todos os Chromebooks e estatísticas de inventário
      const [
        { data: allCbData, error: allCbError },
        { count: totalAll }, 
        { count: disponiveis }, 
        { count: emprestados }, 
        { count: fixos }
      ] = await Promise.all([
        supabase.from<any>('chromebooks').select('*'),
        supabase.from<any>('chromebooks').select('*', { count: 'exact', head: true }),
        supabase.from<any>('chromebooks').select('*', { count: 'exact', head: true }).eq('status', 'disponivel'),
        supabase.from<any>('chromebooks').select('*', { count: 'exact', head: true }).eq('status', 'emprestado'),
        supabase.from<any>('chromebooks').select('*', { count: 'exact', head: true }).eq('status', 'fixo'),
      ]);

      if (allCbError) throw allCbError;
      setAllChromebooks(allCbData || []);
      setInventoryStats({
        total: totalAll || 0,
        disponiveis: disponiveis || 0,
        emprestados: emprestados || 0,
        fixos: fixos || 0,
      });
      setTotalExpected(totalAll || 0);

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
        const chromebookMap = new Map(allCbData?.map((cb: Chromebook) => [cb.id, cb]));

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
        ? `CHR${raw.slice(3)}`.toUpperCase()
        : raw;

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

  // Relatório
  const generateReport = useCallback((): AuditReport => {
    const stats = calculateStats();
    const { totalCounted, completionRate, locationStats, methodStats, conditionStats, timeStats } = stats;

    const missing: AuditDiscrepancy[] = missingItems.map(item => ({
      chromebook_id: item.chromebook_id,
      expected_location: item.location,
      condition_expected: item.condition,
    }));
    
    const extra: AuditDiscrepancy[] = []; // Não calculamos 'extra' aqui, mas mantemos o tipo
    const locationMismatches: AuditDiscrepancy[] = [];
    const conditionIssues: AuditDiscrepancy[] = [];

    countedItems.forEach(item => {
      if (item.condition && item.condition_found && item.condition !== item.condition_found) {
        conditionIssues.push({
          chromebook_id: item.display_id || item.chromebook_id,
          condition_expected: item.condition,
          condition_found: item.condition_found,
        });
      }
      if (item.expected_location && item.location_found && item.expected_location !== item.location_found) {
        locationMismatches.push({
          chromebook_id: item.display_id || item.chromebook_id,
          expected_location: item.expected_location,
          location_found: item.location_found,
        });
      }
    });

    return {
      summary: {
        totalCounted,
        totalExpected,
        completionRate,
        duration: activeAudit ? calculateDuration(activeAudit.started_at) : '0m',
        itemsPerHour: calculateItemsPerHour(totalCounted, activeAudit?.started_at),
        averageTimePerItem: totalCounted > 0 ? `${Math.round((Date.now() - new Date(activeAudit?.started_at || 0).getTime()) / totalCounted / 1000)}s` : '0s',
      },
      discrepancies: { missing, extra, locationMismatches, conditionIssues },
      statistics: { byLocation: locationStats, byMethod: methodStats, byCondition: conditionStats, byTime: timeStats },
    };
  }, [countedItems, activeAudit, totalExpected, calculateStats, missingItems]);

  // Finalizar auditoria
  const completeAudit = async () => {
    if (!activeAudit) return;
    try {
      setIsProcessing(true);
      const report = generateReport();
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

  // Auxiliares
  function calculateDuration(startTime: string): string {
    const duration = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  }
  function calculateItemsPerHour(count: number, startTime?: string): number {
    if (!startTime || count === 0) return 0;
    const durationHours = (Date.now() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    return Math.round((count / durationHours) * 10) / 10;
  }

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
    generateReport,
    calculateStats,
    missingItems, // Exportando a lista de faltantes
    allChromebooks, // Exportando todos os chromebooks
  };
}