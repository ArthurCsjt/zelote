import { generateAuditReport, calculateMissingItems } from './auditCalculations';
import type { InventoryAudit, CountedItemWithDetails, Chromebook } from '@/types/database';

// Dados de Mock
const mockAudit: InventoryAudit = {
  id: 'audit-123',
  audit_name: 'Teste Semanal',
  status: 'concluida',
  started_at: '2024-01-01T10:00:00Z',
  completed_at: '2024-01-01T11:00:00Z', // 1 hora de duração
  created_at: '2024-01-01T10:00:00Z',
  total_expected: 5,
  total_counted: 4,
};

const mockChromebooks: Chromebook[] = [
  { id: 'cb-a', chromebook_id: 'CHR001', model: 'M1', status: 'disponivel', location: 'Sala A', created_at: '', updated_at: '' },
  { id: 'cb-b', chromebook_id: 'CHR002', model: 'M2', status: 'emprestado', location: 'Sala B', created_at: '', updated_at: '' },
  { id: 'cb-c', chromebook_id: 'CHR003', model: 'M3', status: 'fixo', location: 'Sala C', created_at: '', updated_at: '' },
  { id: 'cb-d', chromebook_id: 'CHR004', model: 'M4', status: 'disponivel', location: 'Sala A', created_at: '', updated_at: '' },
  { id: 'cb-e', chromebook_id: 'CHR005', model: 'M5', status: 'disponivel', location: 'Sala D', created_at: '', updated_at: '' },
];

const mockCountedItems: CountedItemWithDetails[] = [
  // Item 1: Contado, Localização OK, QR Code
  { 
    id: 'item-1', audit_id: 'audit-123', chromebook_id: 'cb-a', display_id: 'CHR001', 
    counted_at: '2024-01-01T10:10:00Z', scan_method: 'qr_code', 
    location: 'Sala A', expected_location: 'Sala A', location_found: 'Sala A',
    condition: 'bom', condition_found: 'bom', status: 'disponivel'
  },
  // Item 2: Contado, Localização ERRADA
  { 
    id: 'item-2', audit_id: 'audit-123', chromebook_id: 'cb-b', display_id: 'CHR002', 
    counted_at: '2024-01-01T10:20:00Z', scan_method: 'manual_id', 
    location: 'Sala B', expected_location: 'Sala B', location_found: 'Sala A',
    condition: 'bom', condition_found: 'bom', status: 'emprestado'
  },
  // Item 3: Contado, Condição ERRADA
  { 
    id: 'item-3', audit_id: 'audit-123', chromebook_id: 'cb-c', display_id: 'CHR003', 
    counted_at: '2024-01-01T10:30:00Z', scan_method: 'qr_code', 
    location: 'Sala C', expected_location: 'Sala C', location_found: 'Sala C',
    condition: 'excelente', condition_found: 'danificado', status: 'fixo'
  },
  // Item 4: Contado, OK
  { 
    id: 'item-4', audit_id: 'audit-123', chromebook_id: 'cb-d', display_id: 'CHR004', 
    counted_at: '2024-01-01T10:40:00Z', scan_method: 'manual_id', 
    location: 'Sala A', expected_location: 'Sala A', location_found: 'Sala A',
    condition: 'bom', condition_found: 'bom', status: 'disponivel'
  },
];

describe('Audit Calculations', () => {
  
  describe('calculateMissingItems', () => {
    test('deve identificar corretamente os itens faltantes', () => {
      const missing = calculateMissingItems(mockCountedItems, mockChromebooks);
      expect(missing).toHaveLength(1);
      expect(missing[0].chromebook_id).toBe('CHR005');
    });
  });

  describe('generateAuditReport', () => {
    const report = generateAuditReport(mockAudit, mockCountedItems, mockChromebooks, mockAudit.total_expected!);

    test('deve calcular o resumo corretamente', () => {
      expect(report.summary.totalCounted).toBe(4);
      expect(report.summary.totalExpected).toBe(5);
      expect(report.summary.completionRate).toBe('80.0%');
      // 1 hora de duração (60 minutos) -> 4 itens / 1h = 4.0 itens/hora
      expect(report.summary.itemsPerHour).toBe(4.0); 
      expect(report.summary.duration).toBe('1h 0m');
    });

    test('deve identificar discrepâncias de localização', () => {
      expect(report.discrepancies.locationMismatches).toHaveLength(1);
      expect(report.discrepancies.locationMismatches[0].chromebook_id).toBe('CHR002');
      expect(report.discrepancies.locationMismatches[0].expected_location).toBe('Sala B');
      expect(report.discrepancies.locationMismatches[0].location_found).toBe('Sala A');
    });

    test('deve identificar discrepâncias de condição', () => {
      expect(report.discrepancies.conditionIssues).toHaveLength(1);
      expect(report.discrepancies.conditionIssues[0].chromebook_id).toBe('CHR003');
      expect(report.discrepancies.conditionIssues[0].condition_expected).toBe('excelente');
      expect(report.discrepancies.conditionIssues[0].condition_found).toBe('danificado');
    });

    test('deve identificar itens faltantes', () => {
      expect(report.discrepancies.missing).toHaveLength(1);
      expect(report.discrepancies.missing[0].chromebook_id).toBe('CHR005');
    });

    test('deve calcular estatísticas por método', () => {
      expect(report.statistics.byMethod.qr_code).toBe(2);
      expect(report.statistics.byMethod.manual).toBe(2);
      expect(report.statistics.byMethod.percentage_qr).toBe(50);
    });

    test('deve calcular estatísticas por localização', () => {
      const salaA = report.statistics.byLocation.find(s => s.location === 'Sala A');
      const salaB = report.statistics.byLocation.find(s => s.location === 'Sala B');
      const salaC = report.statistics.byLocation.find(s => s.location === 'Sala C');
      const salaD = report.statistics.byLocation.find(s => s.location === 'Sala D');

      // Sala A: 2 esperados, 3 contados (CHR001, CHR004, CHR002)
      expect(salaA?.expected).toBe(2);
      expect(salaA?.counted).toBe(3);
      expect(salaA?.discrepancy).toBe(1);

      // Sala B: 1 esperado, 0 contado (CHR002 foi contado em Sala A)
      expect(salaB?.expected).toBe(1);
      expect(salaB?.counted).toBe(0);
      expect(salaB?.discrepancy).toBe(-1);
      
      // Sala D: 1 esperado, 0 contado (CHR005 está faltando)
      expect(salaD?.expected).toBe(1);
      expect(salaD?.counted).toBe(0);
      expect(salaD?.discrepancy).toBe(-1);
    });
  });
});