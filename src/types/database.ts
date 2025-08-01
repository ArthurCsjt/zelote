// Tipos do banco de dados centralizados
export type UserType = 'aluno' | 'professor' | 'funcionario';
export type ChromebookStatus = 'disponivel' | 'emprestado' | 'manutencao' | 'fora_uso';
export type LoanType = 'individual' | 'lote';

export interface Chromebook {
  id: string;
  chromebook_id: string;
  model: string;
  serial_number?: string;
  patrimony_number?: string;
  status: ChromebookStatus;
  condition?: string;
  location?: string;
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
  status: 'ativo' | 'devolvido';
}

// Interface para dados do Chromebook no inventário (mantendo compatibilidade)
export interface ChromebookData {
  id?: string;
  chromebookId: string;
  model: string;
  serialNumber?: string;
  patrimonyNumber?: string;
  status: ChromebookStatus;
  condition?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}