import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type {
  Audit,
  CountedItem,
  CountedItemWithDetails,
  AuditFilters,
  AuditReport,
  LocationStats,
  MethodStats,
  ConditionStats,
  TimeStats,
  AuditDiscrepancy
} from '@/types/database';

type DisplayCountedItem = CountedItemWithDetails;

export const useInventoryAudit = () => {
  const { user } = useAuth();
  const [activeAudit, setActiveAudit] = useState<Audit | null>(null);
  const [completedAudits, setCompletedAudits] = useState<Audit[]>([]);
  const [countedItems, setCountedItems] = useState<DisplayCountedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DisplayCountedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [totalExpected, setTotalExpected] = useState(0);

  // Aplicar filtros aos itens contados
  useEffect(() => {
    let filtered = countedItems;

    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location);
    }

    if (filters.scanMethod && filters.scanMethod !== 'all') {
      filtered = filtered.filter(item => item.scan_method === filters.scanMethod);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.display_id?.toLowerCase().includes(searchLower) ||
        item.model?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.counted_at);
        return itemDate >= filters.dateRange!.start && itemDate <= filters.dateRange!.end;
      });
    }

    setFilteredItems(filtered);
  }, [countedItems, filters]);

  // Calcular estatísticas
  const calculateStats = useCallback(() => {
    const totalCounted = countedItems.length;
    const completionRate = totalExpected > 0 ? (totalCounted / totalExpected * 100).toFixed(1) : '0';

    // Estatísticas por localização
    const locationStats: LocationStats[] = [];
    const locationGroups = countedItems.reduce((acc, item) => {
      const location = item.location || 'Não informado';
      if (!acc[location]) {
        acc[location] = { counted: 0, expected: 0 };
      }
      acc[location].counted++;
      return acc;
    }, {} as Record<string, { counted: number; expected: number }>);

    Object.entries(locationGroups).forEach(([location, data]) => {
      locationStats.push({
        location,
        counted: data.counted,
        expected: data.expected,
        discrepancy: data.expected - data.counted
      });
    });

    // Estatísticas por método
    const qrCount = countedItems.filter(item => item.scan_method === 'qr_code').length;
    const manualCount = countedItems.filter(item => item.scan_method === 'manual_id').length;
    const methodStats: MethodStats = {
      qr_code: qrCount,
      manual: manualCount,
      percentage_qr: totalCounted > 0 ? (qrCount / totalCounted * 100) : 0,
      percentage_manual: totalCounted > 0 ? (manualCount / totalCounted * 100) : 0
    };

    // Estatísticas por condição
    const conditionGroups = countedItems.reduce((acc, item) => {
      const condition = item.condition_found || item.condition || 'Não informado';
      if (!acc[condition]) {
        acc[condition] = 0;
      }
      acc[condition]++;
      return acc;
    }, {} as Record<string, number>);

    const conditionStats: ConditionStats[] = Object.entries(conditionGroups).map(([condition, count]) => ({
      condition,
      count,
      percentage: totalCounted > 0 ? (count / totalCounted * 100) : 0
    }));

    // Estatísticas por hora
    const timeGroups = countedItems.reduce((acc, item) => {
      const hour = new Date(item.counted_at).getHours().toString();
      if (!acc[hour]) {
        acc[hour] = 0;
      }
      acc[hour]++;
      return acc;
    }, {} as Record<string, number>);

    let cumulative = 0;
    const timeStats: TimeStats[] = Object.entries(timeGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => {
        cumulative += count;
        return { hour, count, cumulative };
      });

    return {
      totalCounted,
      completionRate: `${completionRate}%`,
      locationStats,
      methodStats,
      conditionStats,
      timeStats
    };
  }, [countedItems, totalExpected]);

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
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      setActiveAudit(data);
      if (data) {
        // Carregar itens contados com informações expandidas
        const { data: items, error: itemsError } = await supabase
          .from('audit_items')
          .select('*')
          .eq('audit_id', data.id)
          .order('counted_at', { ascending: false });
        if (itemsError) throw itemsError;

        const itemPromises = items.map(async (item) => {
          const { data: chromebook } = await supabase
            .from('chromebooks')
            .select('*')
            .eq('id', item.chromebook_id)
            .single();

          return {
            ...item,
            display_id: chromebook?.chromebook_id || 'ID não encontrado',
            model: chromebook?.model,
            manufacturer: chromebook?.manufacturer,
            location: chromebook?.location,
            condition: chromebook?.condition,
            status: chromebook?.status
          } as DisplayCountedItem;
        });
        const fullItems = await Promise.all(itemPromises);
        setCountedItems(fullItems);

        // Calcular total esperado (todos os chromebooks ativos)
        const { count: totalChromebooks } = await supabase
          .from('chromebooks')
          .select('*', { count: 'exact', head: true })
          .in('status', ['disponivel', 'emprestado', 'fixo']);
        setTotalExpected(totalChromebooks || 0);
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

    // Debug: Verificar se há dados na tabela chromebooks
    const checkChromebooksData = async () => {
      try {
        const { data, error } = await supabase
          .from('chromebooks')
          .select('chromebook_id')
          .limit(5);

        console.log('Debug: Dados de exemplo na tabela chromebooks:', data);
        if (error) {
          console.error('Debug: Erro ao buscar chromebooks:', error);
        } else {
          console.log(`Debug: Encontrados ${data?.length || 0} chromebooks na tabela`);
        }
      } catch (e) {
        console.error('Debug: Erro ao verificar tabela chromebooks:', e);
      }
    };

    checkChromebooksData();
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
      setFilteredItems([]);
      toast({ title: 'Contagem iniciada!', description: `A auditoria "${name}" começou.` });
    } catch (e: any) {
      toast({ title: 'Erro ao iniciar contagem', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const countItem = async (identifier: string, method: 'manual_id' | 'qr_code') => {
    if (!activeAudit || !user) {
      console.error('countItem: activeAudit ou user não disponível', { activeAudit: !!activeAudit, user: !!user });
      return;
    }

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
      console.log('countItem: Buscando chromebook com identificador:', identifier);

      const { data: chromebook, error: findError } = await supabase
        .from('chromebooks')
        .select('*')
        .or(`chromebook_id.eq.${identifier},serial_number.eq.${identifier},patrimony_number.eq.${identifier}`)
        .single();

      console.log('countItem: Resultado da busca:', { chromebook, findError });

      if (findError || !chromebook) {
        throw new Error(`Chromebook com identificador "${identifier}" não encontrado.`);
      }

      console.log('countItem: Inserindo item de auditoria');

      const { data, error } = await supabase
        .from('audit_items')
        .insert({
          audit_id: activeAudit.id,
          chromebook_id: chromebook.id,
          counted_at: new Date().toISOString(),
          counted_by: user.id,
          scan_method: method,
          expected_location: chromebook.location,
          // Removendo actual_location que não existe no banco atual
          condition_found: chromebook.condition,
          model_found: chromebook.model,
        })
        .select('*')
        .single();

      console.log('countItem: Resultado da inserção:', { data, error });

      if (error) throw error;

      const displayItem: DisplayCountedItem = {
        ...data,
        display_id: chromebook.chromebook_id,
        model: chromebook.model,
        manufacturer: chromebook.manufacturer,
        location: chromebook.location,
        expected_location: chromebook.location,
        // Removendo actual_location que não existe no banco atual
        condition: chromebook.condition,
        condition_found: chromebook.condition,
        status: chromebook.status
      };

      console.log('countItem: Item criado:', displayItem);

      setCountedItems(prev => [displayItem, ...prev]);

      toast({
        title: 'Item contado!',
        description: `ID: ${chromebook.chromebook_id} - ${chromebook.model}`,
        duration: 2000
      });
    } catch (e: any) {
      console.error('countItem: Erro detalhado:', e);
      toast({ title: 'Erro ao contar item', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!activeAudit) return;

    try {
      setIsProcessing(true);

      // Remover do banco de dados
      const { error } = await supabase
        .from('audit_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Remover da lista local
      setCountedItems(prev => prev.filter(item => item.id !== itemId));

      toast({ title: 'Item removido', description: 'Item removido da contagem.' });
    } catch (e: any) {
      toast({ title: 'Erro ao remover item', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItemLocation = async (itemId: string, newLocation: string) => {
    if (!activeAudit) return;

    try {
      // Removendo atualização de actual_location que não existe no banco atual
      // Por enquanto, apenas atualizamos expected_location
      const { error } = await supabase
        .from('audit_items')
        .update({ expected_location: newLocation })
        .eq('id', itemId);

      if (error) throw error;

      setCountedItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, expected_location: newLocation } : item
      ));

      toast({ title: 'Localização atualizada' });
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar localização', description: e.message, variant: 'destructive' });
    }
  };

  const generateReport = useCallback((): AuditReport => {
    const stats = calculateStats();
    const { totalCounted, completionRate, locationStats, methodStats, conditionStats, timeStats } = stats;

    // Identificar discrepâncias
    const missing: AuditDiscrepancy[] = [];
    const extra: AuditDiscrepancy[] = [];
    const locationMismatches: AuditDiscrepancy[] = [];
    const conditionIssues: AuditDiscrepancy[] = [];

    // Chromebooks que deveriam estar no inventário mas não foram contados
    // (Esta lógica seria mais complexa com dados reais de inventário esperado)

    // Itens contados com localização diferente da esperada
    countedItems.forEach(item => {
      // Removendo verificação de actual_location que não existe no banco atual
      // Por enquanto, consideramos apenas condition_found diferente de condition
      if (item.condition && item.condition_found && item.condition !== item.condition_found) {
        conditionIssues.push({
          chromebook_id: item.display_id || item.chromebook_id,
          condition_expected: item.condition,
          condition_found: item.condition_found,
        });
      }
      if (item.expected_location && item.location && item.expected_location !== item.location) {
        locationMismatches.push({
          chromebook_id: item.display_id || item.chromebook_id,
          expected_location: item.expected_location,
          location_found: item.location,
        });
      }
    });

    return {
        totalCounted,
        totalExpected,
        completionRate,
        duration: activeAudit ? calculateDuration(activeAudit.started_at) : '0m',
        itemsPerHour: calculateItemsPerHour(totalCounted, activeAudit?.started_at),
        averageTimePerItem: totalCounted > 0 ? `${Math.round((Date.now() - new Date(activeAudit?.started_at || 0).getTime()) / totalCounted / 1000)}s` : '0s'
      },
      discrepancies: {
        missing,
        extra,
        locationMismatches,
        conditionIssues
      },
      statistics: {
        byLocation: locationStats,
        byMethod: methodStats,
        byCondition: conditionStats,
        byTime: timeStats
      }
    };
  }, [countedItems, activeAudit, totalExpected, calculateStats]);

  const completeAudit = async () => {
    if (!activeAudit) return;
    try {
      setIsProcessing(true);

      const report = generateReport();

      const { error } = await supabase
        .from('inventory_audits')
        .update({
          status: 'concluida',
          completed_at: new Date().toISOString(),
          total_counted: report.summary.totalCounted,
          total_expected: report.summary.totalExpected
        })
        .eq('id', activeAudit.id);

      if (error) throw error;

      toast({
        title: 'Contagem finalizada!',
        description: `Auditoria concluída com ${report.summary.totalCounted} itens (${report.summary.completionRate} de conclusão).`
      });
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

  // Funções auxiliares
  function calculateDuration(startTime: string): string {
    const duration = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  function calculateItemsPerHour(count: number, startTime: string | undefined): number {
    if (!startTime || count === 0) return 0;
    const durationHours = (Date.now() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    return Math.round(count / durationHours * 10) / 10; // Uma casa decimal
  }

  return {
    activeAudit,
    completedAudits,
    countedItems,
    filteredItems,
    totalExpected,
    isProcessing,
    filters,
    setFilters,
    startAudit,
    countItem,
    removeItem,
    updateItemLocation,
    completeAudit,
    generateReport,
    calculateStats
  };
};
