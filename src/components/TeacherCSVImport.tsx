import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Download, FileText, AlertCircle, CheckCircle, GraduationCap, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard';
import { cn } from '@/lib/utils';
import type { TeacherData } from '@/types/database';
import { validateEmailDomain } from '@/utils/emailValidation';
import { supabase } from '@/integrations/supabase/client';

interface TeacherCSVData extends TeacherData {
  // Herda nome_completo, email, materia
}

interface ParsedTeacher extends TeacherCSVData {
  valid: boolean;
  errors: string[];
}

export function TeacherCSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTeacher[]>([]);
  const [preview, setPreview] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { bulkInsertTeachers } = useDatabase();

  const downloadTemplate = () => {
    const template = 'nome_completo,email,materia\n' +
      'Ana Souza,ana.souza@sj.pro.br,Português\n' +
      'Carlos Lima,carlos.lima@sj.pro.br,Matemática';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_professores.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const validateTeacher = (teacher: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!teacher.nome_completo || typeof teacher.nome_completo !== 'string' || teacher.nome_completo.trim() === '') {
      errors.push('Nome completo é obrigatório');
    }

    if (!teacher.email || typeof teacher.email !== 'string' || teacher.email.trim() === '') {
      errors.push('E-mail é obrigatório');
    } else {
      const emailVal = validateEmailDomain(teacher.email, 'professor');
      if (!emailVal.valid) {
        errors.push(emailVal.message || 'E-mail institucional inválido');
      }
    }

    // Matéria é opcional, mas se existir, deve ser string
    if (teacher.materia && typeof teacher.materia !== 'string') {
      errors.push('Matéria inválida');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo no formato CSV.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // ESTRATÉGIA DE IMPORTAÇÃO INTELIGENTE
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: (results) => {
        const expectedFields = ['nome_completo', 'email', 'materia'];
        const hasCorrectHeaders = expectedFields.every(field => results.meta.fields?.includes(field));

        if (hasCorrectHeaders && results.data.length > 0) {
          // Caso 1: Arquivo com cabeçalho correto
          processParsedData(results.data as any[]);
        } else {
          // Caso 2: Tentar sem cabeçalho (fallback)
          Papa.parse(selectedFile, {
            header: false,
            skipEmptyLines: true,
            complete: (noHeaderResults) => {
              const data = noHeaderResults.data as string[][];
              if (data.length === 0) {
                toast({
                  title: "Arquivo vazio",
                  description: "O arquivo selecionado não contém dados.",
                  variant: "destructive",
                });
                return;
              }

              // Mapeia por índice: Nome, Email, Matéria
              const mapped = data.map(row => ({
                nome_completo: row[0] || '',
                email: row[1] || '',
                materia: row[2] || ''
              }));

              processParsedData(mapped);
            }
          });
        }
      },
      error: (error) => {
        toast({
          title: "Erro no processamento",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const processParsedData = (data: any[]) => {
    const parsed: ParsedTeacher[] = data.map((row: any) => {
      const teacherData: TeacherCSVData = {
        nome_completo: String(row.nome_completo || row[0] || '').trim(),
        email: String(row.email || row[1] || '').trim(),
        materia: String(row.materia || row[2] || '').trim(),
      };

      const validation = validateTeacher(teacherData);
      return {
        ...teacherData,
        valid: validation.valid,
        errors: validation.errors
      };
    });

    setParsedData(parsed);
    setPreview(true);
  };

  const removeRow = (index: number) => {
    setParsedData(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Linha removida",
      description: "O professor foi removido da lista de importação.",
    });
  };

  const updateRow = (index: number, field: keyof TeacherCSVData, value: string) => {
    setParsedData(prev => {
      const newData = [...prev];
      const updatedTeacher = { ...newData[index], [field]: value };
      const validation = validateTeacher(updatedTeacher);

      newData[index] = {
        ...updatedTeacher,
        valid: validation.valid,
        errors: validation.errors
      };
      return newData;
    });
  };

  const checkDuplicates = async () => {
    const validRows = parsedData.filter(s => s.valid);
    if (validRows.length === 0) return true;

    const emails = validRows.map(t => t.email).filter(Boolean);

    if (emails.length === 0) return true;

    try {
      // 1. Identificar duplicados INTERNOS ao CSV
      const internalDuplicateEmails = new Set<string>();
      const emailCounts = new Map<string, number>();

      validRows.forEach(t => {
        if (t.email) {
          const emailLower = t.email.toLowerCase();
          emailCounts.set(emailLower, (emailCounts.get(emailLower) || 0) + 1);
        }
      });

      emailCounts.forEach((count, email) => { if (count > 1) internalDuplicateEmails.add(email); });

      // 2. Busca duplicados no banco usando processamento em lotes (batching)
      // para evitar erro de URL muito longa (Request-URI Too Large)
      const existingEmails = new Set<string>();
      const BATCH_SIZE = 100;

      if (emails.length > 0) {
        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
          const batch = emails.slice(i, i + BATCH_SIZE);
          const { data: existing, error } = await supabase
            .from('professores')
            .select('email')
            .in('email', batch);

          if (error) {
            console.error(`Erro ao buscar e-mails (lote ${i}):`, error);
            throw error;
          }

          if (existing) {
            existing.forEach(item => existingEmails.add(String(item.email).toLowerCase()));
          }
        }
      }

      // Se encontrou duplicados (internos ou no banco), marca as linhas
      const totalConflictEmails = new Set([...internalDuplicateEmails, ...existingEmails]);

      if (totalConflictEmails.size > 0) {
        // Calcula a contagem ANTES de atualizar o estado
        const duplicatesFound = validRows.filter(teacher => {
          return totalConflictEmails.has(teacher.email.toLowerCase());
        }).length;

        setParsedData(prev => prev.map(teacher => {
          const teacherErrors = [...teacher.errors].filter(e =>
            e !== 'E-mail já cadastrado' && e !== 'E-mail duplicado no arquivo'
          );

          let isValid = teacher.valid;
          let hasDuplicate = false;

          if (internalDuplicateEmails.has(teacher.email.toLowerCase())) {
            teacherErrors.push('E-mail duplicado no arquivo');
            isValid = false;
            hasDuplicate = true;
          } else if (existingEmails.has(teacher.email.toLowerCase())) {
            teacherErrors.push('E-mail já cadastrado');
            isValid = false;
            hasDuplicate = true;
          }

          return hasDuplicate ? {
            ...teacher,
            valid: isValid,
            errors: teacherErrors
          } : teacher;
        }));

        toast({
          title: "Duplicados encontrados",
          description: `${duplicatesFound} professor(es) com e-mails duplicados (no arquivo ou no sistema). Verifique as linhas em vermelho.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('Erro ao verificar duplicados:', error);
      toast({
        title: "Erro na validação",
        description: `Não foi possível verificar duplicados: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    const validTeachers = parsedData.filter(teacher => teacher.valid);

    if (validTeachers.length === 0) {
      toast({
        title: "Erro",
        description: "Não há professores válidos para importar.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      // PASSO 1: Verificar duplicados antes de tentar inserir
      const noDuplicates = await checkDuplicates();
      if (!noDuplicates) {
        setImporting(false);
        return;
      }

      // Usa a lista de validTeachers que foi filtrada no início
      // (checkDuplicates já atualizou o estado, mas usamos a lista original de válidos)
      const teachersToImport: TeacherData[] = validTeachers.map(teacher => ({
        nome_completo: teacher.nome_completo,
        email: teacher.email,
        materia: teacher.materia,
      }));

      const success = await bulkInsertTeachers(teachersToImport);

      if (success) {
        toast({
          title: "Sucesso!",
          description: `${validTeachers.length} professores importados com sucesso.`,
        });

        setFile(null);
        setParsedData([]);
        setPreview(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Erro ao importar professores:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedData.filter(s => s.valid).length;
  const invalidCount = parsedData.filter(s => !s.valid).length;

  return (
    <div className="space-y-6">
      <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden">
        <div className="bg-purple-600 dark:bg-purple-800 p-4 border-b-4 border-black dark:border-white flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-white" />
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Importação de Professores via CSV</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 border-4 border-black dark:border-white gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 border-2 border-black bg-white dark:bg-zinc-800">
                <FileText className="h-5 w-5 text-black dark:text-white" />
              </div>
              <div>
                <p className="font-black uppercase text-xs text-black dark:text-white">Arquivo Template</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Baixe o modelo se tiver dúvidas sobre as colunas.
                </p>
              </div>
            </div>
            <Button
              onClick={downloadTemplate}
              className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold uppercase text-xs"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>

          {/* File Upload Area */}
          {!preview && (
            <div
              className="border-4 border-dashed border-black dark:border-zinc-700 rounded-none p-12 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all group"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-purple-200 dark:bg-purple-900 border-4 border-black h-20 w-20 flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                <Upload className="h-10 w-10 text-black dark:text-white" />
              </div>
              <p className="text-xl font-black uppercase mb-2 text-black dark:text-white">
                Selecione o seu arquivo
              </p>
              <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-6 font-mono">
                Arraste e solte o CSV ou clique aqui
              </p>
              <Button className="bg-black dark:bg-white text-white dark:text-black font-black uppercase rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                Procurar no Computador
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-4 border-black dark:border-white pb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-black uppercase text-black dark:text-white tracking-tight">Pré-visualização</h3>
                  <div className="flex gap-2">
                    <div className="bg-green-500 text-white font-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> {validCount} Válidos
                    </div>
                    {invalidCount > 0 && (
                      <div className="bg-red-500 text-white font-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {invalidCount} Inválidos
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreview(false);
                      setFile(null);
                      setParsedData([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex-1 sm:flex-none border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    Trocar Arquivo
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || validCount === 0}
                    className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none"
                  >
                    {importing ? 'Processando...' : `Confirmar Importação`}
                  </Button>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="bg-red-100 dark:bg-red-900/30 border-4 border-black dark:border-white p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-black uppercase text-xs text-red-600">Atenção!</p>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300">
                      {invalidCount} linhas possuem erros (destacadas em vermelho) e não serão importadas.
                    </p>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="border-4 border-black dark:border-white overflow-hidden bg-white dark:bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                <div className="max-h-96 overflow-y-auto font-mono">
                  <Table>
                    <TableHeader className="bg-gray-100 dark:bg-zinc-800 border-b-4 border-black dark:border-white sticky top-0 z-20">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white w-16">Status</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white">Nome Completo</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white">E-mail</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white w-32">Matéria</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white">Erros</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs w-16 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((teacher, index) => (
                        <TableRow
                          key={index}
                          className={cn(
                            "hover:bg-gray-50 dark:hover:bg-zinc-900 border-b-2 border-black dark:border-white",
                            !teacher.valid && "bg-red-50 dark:bg-red-950/40"
                          )}
                        >
                          <TableCell className="border-r-2 border-black dark:border-white text-center">
                            {teacher.valid ? (
                              <div className="p-1 bg-green-100 border-2 border-black rounded-full inline-block">
                                <CheckCircle className="h-4 w-4 text-green-700" />
                              </div>
                            ) : (
                              <div className="p-1 bg-red-100 border-2 border-black rounded-full inline-block">
                                <AlertCircle className="h-4 w-4 text-red-700" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="border-r-2 border-black dark:border-white p-0">
                            <input
                              type="text"
                              value={teacher.nome_completo}
                              onChange={(e) => updateRow(index, 'nome_completo', e.target.value)}
                              className="w-full h-full bg-transparent p-2 font-bold text-xs focus:bg-blue-50 dark:focus:bg-blue-900/20 outline-none"
                            />
                          </TableCell>
                          <TableCell className={cn(
                            "border-r-2 border-black dark:border-white p-0",
                            teacher.errors.some(e => e.toLowerCase().includes('e-mail')) && "bg-red-200 dark:bg-red-900/60"
                          )}>
                            <input
                              type="text"
                              value={teacher.email}
                              onChange={(e) => updateRow(index, 'email', e.target.value)}
                              className={cn(
                                "w-full h-full bg-transparent p-2 font-bold text-xs focus:bg-blue-50 dark:focus:bg-blue-900/20 outline-none",
                                teacher.errors.some(e => e.toLowerCase().includes('e-mail')) && "text-red-700 dark:text-red-300"
                              )}
                            />
                          </TableCell>
                          <TableCell className="border-r-2 border-black dark:border-white p-0">
                            <input
                              type="text"
                              value={teacher.materia || ''}
                              onChange={(e) => updateRow(index, 'materia', e.target.value)}
                              className="w-full h-full bg-transparent p-2 font-bold text-xs focus:bg-blue-50 dark:focus:bg-blue-900/20 outline-none"
                            />
                          </TableCell>
                          <TableCell className="border-r-2 border-black dark:border-white">
                            {teacher.errors.length > 0 && (
                              <div className="text-[10px] font-black uppercase text-red-600 leading-tight">
                                {teacher.errors.join(' | ')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(index)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
