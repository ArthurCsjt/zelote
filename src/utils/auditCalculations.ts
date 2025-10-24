import { differenceInMinutes, format } from 'date-fns';
import type {
  InventoryAudit,
  CountedItemWithDetails,
  AuditReport,
  LocationStats,
  MethodStats,
  ConditionStats,
  TimeStats,
  AuditDiscrepancy,
  Chromebook,
} from '@/types/database';

// Auxiliares
function calculateDuration(startTime: string, endTime?: string): string {
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const duration = end - new Date(startTime).getTime();
  const minutes = Math.floor(duration / 60000);
  const hours = Math.floor(minutes / 60);
  if (minutes < 1) return '< 1m';
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

function calculateItemsPerHour(count: number, startTime?: string, endTime?: string): number {
  if (!startTime || count === 0) return 0;
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationHours = (end - new Date(startTime).getTime()) / (1000 * 60 * 60);
  if (durationHours < 0.01) return count; // Evita divisão por zero ou números muito pequenos
  return Math.round((count / durationHours) * 10) / 10;
}

// Função utilitária pura para calcular estatísticas
function calculateAuditStats(
  countedItems: CountedItemWithDetails[],
  allChromebooks: Chromebook[],
  totalExpected: number
) {
  const totalCounted = countedItems.length;
  const completionRate = totalExpected > 0 ? (totalCounted / totalExpected * 100).toFixed(1) : '0.0';

  // 1. Estatísticas por Localização
  const expectedLocationMap = allChromebooks.reduce((acc, cb) => {
    const loc = cb.location || 'Não informado';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countedLocationMap = countedItems.reduce((acc, item) => {
    const loc = item.location_found || item.location || 'Não informado';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allLocations = new Set([...Object.keys(expectedLocationMap), ...Object.keys(countedLocationMap)]);
  const locationStats: LocationStats[] = Array.from(allLocations).map(location => {
    const expected = expectedLocationMap[location] || 0;
    const counted = countedLocationMap[location] || 0;
    return {
      location,
      counted,
      expected,
      discrepancy: counted - expected,
    };
  }).sort((a, b) => b.counted - a.counted);


  // 2. Estatísticas por Método
  const qrCount = countedItems.filter(i => i.scan_method === 'qr_code').length;
  const manualCount = countedItems.filter(i => i.scan_method === 'manual_id').length;
  const methodStats: MethodStats = {
    qr_code: qrCount,
    manual: manualCount,
    percentage_qr: totalCounted > 0 ? (qrCount / totalCounted * 100) : 0,
    percentage_manual: totalCounted > 0 ? (manualCount / totalCounted * 100) : 0,
  };

  // 3. Estatísticas por Condição
  const condMap = countedItems.reduce((acc, item) => {
    const c = item.condition_found || item.condition || 'Não informado';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const conditionStats: ConditionStats[] = Object.entries(condMap).map(([condition, count]) => ({
    condition,
    count,
    percentage: totalCounted > 0 ? (count / totalCounted * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // 4. Estatísticas por Tempo (Horário)
  const timeMap = countedItems.reduce((acc, i) => {
    const h = new Date(i.counted_at).getHours().toString().padStart(2, '0');
    acc[h] = (acc[h] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  let cumulative = 0;
  const timeStats: TimeStats[] = Object.entries(timeMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count, cumulative: (cumulative += count) }));

  return { 
    totalCounted, 
    completionRate: `${completionRate}%`, 
    locationStats, 
    methodStats, 
    conditionStats, 
    timeStats 
  };
}

// Função utilitária pura para gerar o relatório completo
export function generateAuditReport(
  audit: InventoryAudit,
  countedItems: CountedItemWithDetails[],
  allChromebooks: Chromebook[],
  totalExpected: number
): AuditReport {
  
  const stats = calculateAuditStats(countedItems, allChromebooks, totalExpected);
  const { totalCounted, completionRate, locationStats, methodStats, conditionStats, timeStats } = stats;

  // Itens Faltantes
  const countedIds = new Set(countedItems.map(item => item.chromebook_id));
  const missingItems = allChromebooks.filter(cb => !countedIds.has(cb.id));
  
  const missing: AuditDiscrepancy[] = missingItems.map(item => ({
    chromebook_id: item.chromebook_id,
    expected_location: item.location,
    condition_expected: item.condition,
  }));
  
  // Discrepâncias: Localização e Condição
  const locationMismatches: AuditDiscrepancy[] = [];
  const conditionIssues: AuditDiscrepancy[] = [];

  countedItems.forEach(item => {
    // Condição
    if (item.condition && item.condition_found && item.condition !== item.condition_found) {
      conditionIssues.push({
        chromebook_id: item.display_id || item.chromebook_id,
        condition_expected: item.condition,
        condition_found: item.condition_found,
      });
    }
    // Localização
    if (item.location && item.location_found && item.location !== item.location_found) {
      locationMismatches.push({
        chromebook_id: item.display_id || item.chromebook_id,
        expected_location: item.location,
        location_found: item.location_found,
      });
    }
  });

  const duration = audit.completed_at ? calculateDuration(audit.started_at, audit.completed_at) : calculateDuration(audit.started_at, new Date().toISOString());
  const itemsPerHour = calculateItemsPerHour(totalCounted, audit.started_at, audit.completed_at);
  const averageTimePerItem = totalCounted > 0 
    ? `${Math.round((Date.now() - new Date(audit.started_at).getTime()) / totalCounted / 1000)}s` 
    : '0s';

  return {
    summary: {
      totalCounted,
      totalExpected,
      completionRate,
      duration,
      itemsPerHour,
      averageTimePerItem,
    },
    discrepancies: { missing, extra: [], locationMismatches, conditionIssues },
    statistics: { byLocation: locationStats, byMethod: methodStats, byCondition: conditionStats, byTime: timeStats },
  };
}

// Função utilitária pura para calcular itens faltantes
export function calculateMissingItems(
  countedItems: CountedItemWithDetails[],
  allChromebooks: Chromebook[]
): Chromebook[] {
  const countedIds = new Set(countedItems.map(item => item.chromebook_id));
  return allChromebooks.filter(cb => !countedIds.has(cb.id));
}

// Exporta a função de cálculo de estatísticas para uso no hook principal
export { calculateAuditStats };