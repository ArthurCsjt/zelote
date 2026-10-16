import React from 'react';
import { GraduationCap } from 'lucide-react';
import { GenericCSVImport } from './Shared/GenericCSVImport';
import { useDatabase } from '@/hooks/useDatabase';
import { validateEmailDomain } from '@/utils/emailValidation';

export interface TeacherCSVData {
  nome_completo: string;
  email: string;
  materia?: string;
}

const TEMPLATE_CONTENT =
  'nome_completo,email,materia\n' +
  'Ana Souza,ana.souza@sj.pro.br,Português\n' +
  'Carlos Lima,carlos.lima@sj.pro.br,Matemática';

export function TeacherCSVImport() {
  const { bulkInsertTeachers } = useDatabase();

  const validateTeacher = (teacher: Record<string, string>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!teacher.nome_completo || teacher.nome_completo.trim() === '') {
      errors.push('Nome completo é obrigatório');
    }

    if (!teacher.email || teacher.email.trim() === '') {
      errors.push('E-mail é obrigatório');
    } else {
      const emailVal = validateEmailDomain(teacher.email, 'professor');
      if (!emailVal.valid) {
        errors.push(emailVal.message || 'E-mail institucional inválido');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  return (
    <GenericCSVImport<TeacherCSVData>
      title="Importação de Professores via CSV"
      icon={<GraduationCap className="h-6 w-6 text-white" />}
      headerBgClass="bg-emerald-600 dark:bg-emerald-800"
      templateFilename="template_professores.csv"
      templateContent={TEMPLATE_CONTENT}
      columns={[
        { key: 'nome_completo', label: 'Nome Completo' },
        { key: 'email', label: 'E-mail' },
        { key: 'materia', label: 'Matéria', widthClass: 'w-48' },
      ]}
      expectedHeaders={['nome_completo', 'email']}
      validateRow={validateTeacher}
      uniqueChecks={[
        {
          field: 'email',
          label: 'E-mail',
          tableName: 'professores',
          tableColumn: 'email',
          normalize: (v) => v.trim().toLowerCase(),
        },
      ]}
      onSaveBatch={async (items) => {
        return await bulkInsertTeachers(items);
      }}
      itemName="professor"
      pluralItemName="professores"
    />
  );
}
