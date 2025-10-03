// Tipos do banco de dados centralizados
export type UserType = 'aluno' | 'professor' | 'funcionario';
export type ChromebookStatus = 'disponivel' | 'emprestado' | 'fixo' | 'fora_uso' | 'manutencao';
export type LoanType = 'individual' | 'lote';
export type AuditStatus = 'em_andamento' | 'concluida' | 'cancelada';

export interface Chromebook {
  id: string;
  chromebook_id: string;
  model: string;
  manufacturer?: string;
  serial_number?: string;
  patrimony_number?: string;
  status: ChromebookStatus;
  condition?: string;
  location?: string;
  classroom?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Loan {
  id: string;
  chromebook_id: string;
  student_name: string;
  student_ra?: string;
  student_email: string;
  purpose: string;
  user_type: UserType;
  loan_type: LoanType;
  loan_date: string;
  expected_return_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Return {
  id: string;
  loan_id: string;
  returned_by_name: string;
  returned_by_ra?: string;
  returned_by_email: string;
  returned_by_type: UserType;
  return_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// Interface para o formulário de empréstimo
export interface LoanFormData {
  studentName: string;
  ra?: string;
  email: string;
  chromebookId: string;
  purpose: string;
  userType: UserType;
  loanType: LoanType;
  expectedReturnDate?: Date;
}

// Interface para dados de devolução
export interface ReturnFormData {
  name: string;
  ra?: string;
  email: string;
  type: LoanType;
  userType: UserType;
}

// Interface combinada para histórico
export interface LoanHistoryItem {
  id: string;
  student_name: string;
  student_ra?: string;
  student_email: string;
  purpose: string;
  user_type: UserType;
  loan_type: LoanType;
  loan_date: string;
  expected_return_date?: string;
  chromebook_id: string;
  chromebook_model: string;
  return_date?: string;
  returned_by_name?: string;
  returned_by_email?: string;
  returned_by_type?: UserType;
  return_notes?: string;
  status: 'ativo' | 'devolvido' | 'atrasado';
}

// Interface para dados do Chromebook no inventário (mantendo compatibilidade)
export interface ChromebookData {
  id?: string;
  chromebookId?: string;
  model: string;
  manufacturer?: string;
  serialNumber?: string;
  patrimonyNumber?: string;
  status?: ChromebookStatus;
  condition?: string;
  location?: string;
  classroom?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// Tipos de auditoria
export interface InventoryAudit {
  id: string;
  audit_name: string;
  status: AuditStatus;
  started_at: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  notes?: string;
}

export interface AuditItem {
  id: string;
  audit_id: string;
  chromebook_id: string;
  counted_at: string;
  counted_by?: string;
  scan_method: 'qr_code' | 'manual_id';
  physical_status?: string;
  location_confirmed?: boolean;
  notes?: string;
  created_at: string;
}

// Tipo Database para compatibilidade com o Supabase
export interface Database {
  public: {
    Tables: {
      inventory_audits: {
        Row: InventoryAudit;
        Insert: Omit<InventoryAudit, 'id' | 'created_at' | 'started_at'>;
        Update: Partial<Omit<InventoryAudit, 'id'>>;
      };
      audit_items: {
        Row: AuditItem;
        Insert: Omit<AuditItem, 'id' | 'created_at' | 'counted_at'>;
        Update: Partial<Omit<AuditItem, 'id'>>;
      };
      chromebooks: {
        Row: Chromebook;
        Insert: Partial<Chromebook>;
        Update: Partial<Chromebook>;
      };
    };
  };
}