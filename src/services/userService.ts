import { supabase } from '@/integrations/supabase/client';
import type { UserType, TeacherData } from '@/types/database';
import { validateEmailDomain, EMAIL_DOMAINS } from '@/utils/emailValidation';
import logger from '@/utils/logger';

export interface StudentData {
  nome_completo: string;
  ra: string;
  email: string;
  turma: string;
}

export interface StaffData {
  nome_completo: string;
  email: string;
}

export const createStudent = async (data: StudentData): Promise<any> => {
  const emailValidation = validateEmailDomain(data.email, 'aluno');
  if (!emailValidation.valid) {
    throw new Error(emailValidation.message || 'Email institucional de aluno inválido');
  }

  const { data: result, error } = await supabase.rpc('create_student', {
    p_nome_completo: data.nome_completo,
    p_ra: data.ra,
    p_email: data.email,
    p_turma: data.turma
  });

  if (error) {
    if (error.message.includes('RA ou E-mail informado já está em uso')) {
      throw new Error('RA ou E-mail já cadastrado.');
    }
    throw error;
  }
  return result;
};

export const updateStudent = async (id: string, data: Partial<StudentData>): Promise<boolean> => {
  if (data.email) {
    const emailValidation = validateEmailDomain(data.email, 'aluno');
    if (!emailValidation.valid) {
      throw new Error(emailValidation.message || 'Email institucional de aluno inválido');
    }
  }

  const { error } = await supabase
    .from('alunos')
    .update(data)
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      throw new Error('RA ou E-mail já cadastrado para outro aluno.');
    }
    throw error;
  }
  return true;
};

export const bulkInsertStudents = async (students: StudentData[]): Promise<boolean> => {
  for (const student of students) {
    if (!validateEmailDomain(student.email, 'aluno')) {
      throw new Error(`Email de aluno inválido: ${student.email}. Deve terminar com ${EMAIL_DOMAINS.ALUNO}`);
    }
  }

  const BATCH_SIZE = 200;
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE).map(s => ({
      nome_completo: s.nome_completo,
      ra: s.ra,
      email: s.email.toLowerCase(),
      turma: s.turma
    }));

    const { error } = await supabase
      .from('alunos')
      .insert(batch);

    if (error) {
      if (error.code === '23505') {
        throw new Error('Pelo menos um RA ou E-mail já está cadastrado.');
      }
      throw error;
    }
  }

  return true;
};

export const deleteAllStudents = async (): Promise<boolean> => {
  const { error } = await supabase
    .from('alunos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
  return true;
};

export const createTeacher = async (data: TeacherData): Promise<any> => {
  const emailValidation = validateEmailDomain(data.email, 'professor');
  if (!emailValidation.valid) {
    throw new Error(emailValidation.message || 'Email institucional de professor inválido');
  }

  const { data: result, error } = await supabase.rpc('create_teacher', {
    p_nome_completo: data.nome_completo,
    p_email: data.email,
    p_materia: (data as any).materia || null
  });

  if (error) {
    if (error.message.includes('O e-mail informado já está em uso')) {
      throw new Error('E-mail já cadastrado para outro professor.');
    }
    throw error;
  }
  return result;
};

export const updateTeacher = async (id: string, data: Partial<TeacherData>): Promise<boolean> => {
  if (data.email) {
    const emailValidation = validateEmailDomain(data.email, 'professor');
    if (!emailValidation.valid) {
      throw new Error(emailValidation.message || 'Email institucional de professor inválido');
    }
  }

  const { error } = await supabase
    .from('professores')
    .update(data)
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      throw new Error('E-mail já cadastrado para outro professor.');
    }
    throw error;
  }
  return true;
};

export const bulkInsertTeachers = async (teachers: TeacherData[]): Promise<boolean> => {
  for (const teacher of teachers) {
    if (!validateEmailDomain(teacher.email, 'professor')) {
      throw new Error(`Email de professor inválido: ${teacher.email}. Deve terminar com ${EMAIL_DOMAINS.PROFESSOR}`);
    }
  }

  const BATCH_SIZE = 200;
  for (let i = 0; i < teachers.length; i += BATCH_SIZE) {
    const batch = teachers.slice(i, i + BATCH_SIZE).map(t => ({
      nome_completo: t.nome_completo,
      email: t.email.toLowerCase(),
      materia: t.materia || null,
    }));

    const { error } = await supabase
      .from('professores')
      .insert(batch);

    if (error) {
      if (error.code === '23505') {
        throw new Error('Pelo menos um E-mail já está cadastrado.');
      }
      throw error;
    }
  }

  return true;
};

export const createStaff = async (data: StaffData): Promise<any> => {
  if (!validateEmailDomain(data.email, 'funcionario')) {
    throw new Error(`Email de funcionário deve terminar com ${EMAIL_DOMAINS.FUNCIONARIO}`);
  }

  const { data: result, error } = await supabase.rpc('create_staff', {
    p_nome_completo: data.nome_completo,
    p_email: data.email
  });

  if (error) {
    if (error.message.includes('O e-mail informado já está em uso')) {
      throw new Error('E-mail já cadastrado para outro funcionário.');
    }
    throw error;
  }
  return result;
};

export const updateStaff = async (id: string, data: Partial<StaffData>): Promise<boolean> => {
  if (data.email) {
    const emailValidation = validateEmailDomain(data.email, 'funcionario');
    if (!emailValidation.valid) {
      throw new Error(emailValidation.message || 'Email institucional de funcionário inválido');
    }
  }

  const { error } = await supabase
    .from('funcionarios')
    .update(data)
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      throw new Error('E-mail já cadastrado para outro funcionário.');
    }
    throw error;
  }
  return true;
};

export const deleteUserRecord = async (id: string, userType: UserType): Promise<boolean> => {
  const tableName = userType === 'aluno' ? 'alunos' :
    userType === 'professor' ? 'professores' :
      'funcionarios';

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

/**
 * Busca eficiente de usuários no banco de dados com limite seguro para autocompletes
 */
export const searchUsersServer = async (
  term: string,
  userType?: UserType,
  limit: number = 20
) => {
  const cleanTerm = term.trim().toLowerCase();
  if (!cleanTerm) return [];

  const results: any[] = [];

  if (!userType || userType === 'aluno') {
    const { data: alunos } = await supabase
      .from('alunos')
      .select('id, nome_completo, ra, email, turma')
      .or(`nome_completo.ilike.%${cleanTerm}%,ra.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%`)
      .limit(limit);

    (alunos || []).forEach(a => results.push({ ...a, type: 'aluno' }));
  }

  if (!userType || userType === 'professor') {
    const { data: profs } = await supabase
      .from('professores')
      .select('id, nome_completo, email, materia')
      .or(`nome_completo.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%`)
      .limit(limit);

    (profs || []).forEach(p => results.push({ ...p, type: 'professor' }));
  }

  if (!userType || userType === 'funcionario') {
    const { data: funcs } = await supabase
      .from('funcionarios')
      .select('id, nome_completo, email')
      .or(`nome_completo.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%`)
      .limit(limit);

    (funcs || []).forEach(f => results.push({ ...f, type: 'funcionario' }));
  }

  return results.slice(0, limit);
};
