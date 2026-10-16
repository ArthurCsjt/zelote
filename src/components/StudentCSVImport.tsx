import React from 'react';
import { Upload } from 'lucide-react';
import { GenericCSVImport } from './Shared/GenericCSVImport';
import { useDatabase } from '@/hooks/useDatabase';
import { validateEmailDomain } from '@/utils/emailValidation';

export interface StudentCSVData {
  nome_completo: string;
  ra: string;
  email: string;
  turma: string;
}

const TEMPLATE_CONTENT =
  'nome_completo,ra,email,turma\n' +
  'João Silva,12345,joao.silva@sj.g12.br,1A\n' +
  'Maria Santos,12346,maria.santos@sj.g12.br,1B';

export function StudentCSVImport() {
  const { bulkInsertStudents } = useDatabase();

  const validateStudent = (student: Record<string, string>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!student.nome_completo || student.nome_completo.trim() === '') {
      errors.push('Nome completo é obrigatório');
    }

    if (!student.ra || student.ra.trim() === '') {
      errors.push('RA é obrigatório');
    }

    if (!student.email || student.email.trim() === '') {
      errors.push('E-mail é obrigatório');
    } else {
      const emailVal = validateEmailDomain(student.email, 'aluno');
      if (!emailVal.valid) {
        errors.push(emailVal.message || 'E-mail institucional inválido');
      }
    }

    if (!student.turma || student.turma.trim() === '') {
      errors.push('Turma é obrigatória');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  return (
    <GenericCSVImport<StudentCSVData>
      title="Importação de Alunos via CSV"
      icon={<Upload className="h-6 w-6 text-white" />}
      headerBgClass="bg-blue-600 dark:bg-blue-800"
      templateFilename="template_alunos.csv"
      templateContent={TEMPLATE_CONTENT}
      columns={[
        { key: 'nome_completo', label: 'Nome Completo' },
        { key: 'ra', label: 'RA', widthClass: 'w-32', isMono: true },
        { key: 'email', label: 'E-mail' },
        { key: 'turma', label: 'Turma', widthClass: 'w-24' },
      ]}
      expectedHeaders={['nome_completo', 'ra', 'email', 'turma']}
      validateRow={validateStudent}
      uniqueChecks={[
        {
          field: 'ra',
          label: 'RA',
          tableName: 'alunos',
          tableColumn: 'ra',
          normalize: (v) => v.trim(),
        },
        {
          field: 'email',
          label: 'E-mail',
          tableName: 'alunos',
          tableColumn: 'email',
          normalize: (v) => v.trim().toLowerCase(),
        },
      ]}
      onSaveBatch={async (items) => {
        return await bulkInsertStudents(items);
      }}
      itemName="aluno"
      pluralItemName="alunos"
    />
  );
}
