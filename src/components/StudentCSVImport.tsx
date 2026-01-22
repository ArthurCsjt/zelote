import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface StudentCSVData {
  nome_completo: string;
  ra: string;
  email: string;
  turma: string;
}

interface ParsedStudent extends StudentCSVData {
  valid: boolean;
  errors: string[];
}

export function StudentCSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [preview, setPreview] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { bulkInsertStudents } = useDatabase();

  const downloadTemplate = () => {
    const template = 'nome_completo,ra,email,turma\n' +
      'João Silva,12345,joao.silva@sj.g12.br,1A\n' +
      'Maria Santos,12346,maria.santos@sj.g12.br,1B';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_alunos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const validateStudent = (student: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!student.nome_completo || typeof student.nome_completo !== 'string' || student.nome_completo.trim() === '') {
      errors.push('Nome completo é obrigatório');
    }

    if (!student.ra || typeof student.ra !== 'string' || student.ra.trim() === '') {
      errors.push('RA é obrigatório');
    }

    if (!student.email || typeof student.email !== 'string' || student.email.trim() === '') {
      errors.push('E-mail é obrigatório');
    } else if (!student.email.endsWith('@sj.g12.br')) {
      errors.push('E-mail deve terminar com @sj.g12.br');
    }

    if (!student.turma || typeof student.turma !== 'string' || student.turma.trim() === '') {
      errors.push('Turma é obrigatória');
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
      complete: (results) => {
        const expectedFields = ['nome_completo', 'ra', 'email', 'turma'];
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

              // Mapeia por índice se tiver pelo menos 4 colunas
              const mapped = data.map(row => ({
                nome_completo: row[0] || '',
                ra: row[1] || '',
                email: row[2] || '',
                turma: row[3] || ''
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
    const parsed: ParsedStudent[] = data.map((row: any) => {
      const studentData = {
        nome_completo: String(row.nome_completo || row[0] || '').trim(),
        ra: String(row.ra || row[1] || '').trim(),
        email: String(row.email || row[2] || '').trim(),
        turma: String(row.turma || row[3] || '').trim(),
      };

      const validation = validateStudent(studentData);
      return {
        ...studentData,
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
      description: "O aluno foi removido da lista de importação.",
    });
  };

  const updateRow = (index: number, field: keyof StudentCSVData, value: string) => {
    setParsedData(prev => {
      const newData = [...prev];
      const updatedStudent = { ...newData[index], [field]: value };
      const validation = validateStudent(updatedStudent);

      newData[index] = {
        ...updatedStudent,
        valid: validation.valid,
        errors: validation.errors
      };
      return newData;
    });
  };

  const checkDuplicates = async () => {
    const validRows = parsedData.filter(s => s.valid);
    if (validRows.length === 0) return true;

    const ras = validRows.map(s => s.ra).filter(Boolean);
    const emails = validRows.map(s => s.email).filter(Boolean);

    if (ras.length === 0 && emails.length === 0) return true;

    try {
      // Busca duplicados no banco - fazendo duas queries separadas para evitar problemas de sintaxe
      const existingRas = new Set<string>();
      const existingEmails = new Set<string>();

      // Query 1: Buscar RAs duplicados
      if (ras.length > 0) {
        const { data: raData, error: raError } = await supabase
          .from('alunos')
          .select('ra')
          .in('ra', ras);

        if (raError) {
          console.error('Erro ao buscar RAs:', raError);
        } else if (raData) {
          raData.forEach(item => existingRas.add(String(item.ra)));
        }
      }

      // Query 2: Buscar E-mails duplicados
      if (emails.length > 0) {
        const { data: emailData, error: emailError } = await supabase
          .from('alunos')
          .select('email')
          .in('email', emails);

        if (emailError) {
          console.error('Erro ao buscar e-mails:', emailError);
        } else if (emailData) {
          emailData.forEach(item => existingEmails.add(String(item.email).toLowerCase()));
        }
      }

      // Se encontrou duplicados, marca as linhas
      if (existingRas.size > 0 || existingEmails.size > 0) {
        // Calcula a contagem ANTES de atualizar o estado
        const duplicateCount = validRows.filter(student => {
          return existingRas.has(student.ra) || existingEmails.has(student.email.toLowerCase());
        }).length;

        setParsedData(prev => prev.map(student => {
          const studentErrors = [...student.errors].filter(e =>
            e !== 'RA já cadastrado' && e !== 'E-mail já cadastrado'
          );
          let isValid = student.valid;
          let hasDuplicate = false;

          if (existingRas.has(student.ra)) {
            studentErrors.push('RA já cadastrado');
            isValid = false;
            hasDuplicate = true;
          }

          if (existingEmails.has(student.email.toLowerCase())) {
            studentErrors.push('E-mail já cadastrado');
            isValid = false;
            hasDuplicate = true;
          }

          return hasDuplicate ? {
            ...student,
            valid: isValid,
            errors: studentErrors
          } : student;
        }));

        toast({
          title: "Duplicados encontrados",
          description: `${duplicateCount} aluno(s) já cadastrado(s). Verifique as linhas destacadas em vermelho na coluna "Erros".`,
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
    const validStudents = parsedData.filter(student => student.valid);

    if (validStudents.length === 0) {
      toast({
        title: "Erro",
        description: "Não há alunos válidos para importar.",
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

      // Usa a lista de validStudents que foi filtrada no início
      // (checkDuplicates já atualizou o estado, mas usamos a lista original de válidos)
      const studentsToImport = validStudents.map(student => ({
        nome_completo: student.nome_completo,
        ra: student.ra,
        email: student.email,
        turma: student.turma
      }));

      const result = await bulkInsertStudents(studentsToImport);

      if (result) {
        toast({
          title: "Sucesso!",
          description: `${validStudents.length} alunos importados com sucesso.`,
        });

        // Reset state
        setFile(null);
        setParsedData([]);
        setPreview(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({
          title: "Erro",
          description: "Erro ao importar alunos. Verifique se não há dados duplicados.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao importar alunos:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive",
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
        <div className="bg-blue-600 dark:bg-blue-800 p-4 border-b-4 border-black dark:border-white flex items-center gap-3">
          <Upload className="h-6 w-6 text-white" />
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Importação de Alunos via CSV</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-yellow-100 dark:bg-yellow-900/30 border-4 border-black dark:border-white gap-4">
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
              <div className="bg-blue-200 dark:bg-blue-900 border-4 border-black h-20 w-20 flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
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
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none"
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
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white w-32">RA</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white">E-mail</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white w-24">Turma</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white">Erros</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs w-16 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((student, index) => (
                        <TableRow
                          key={index}
                          className={cn(
                            "hover:bg-gray-50 dark:hover:bg-zinc-900 border-b-2 border-black dark:border-white",
                            !student.valid && "bg-red-50 dark:bg-red-950/40"
                          )}
                        >
                          <TableCell className="border-r-2 border-black dark:border-white text-center">
                            {student.valid ? (
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
                              value={student.nome_completo}
                              onChange={(e) => updateRow(index, 'nome_completo', e.target.value)}
                              className="w-full h-full bg-transparent p-2 font-bold text-xs focus:bg-blue-50 dark:focus:bg-blue-900/20 outline-none"
                            />
                          </TableCell>
                          <TableCell className="border-r-2 border-black dark:border-white p-0">
                            <input
                              type="text"
                              value={student.ra}
                              onChange={(e) => updateRow(index, 'ra', e.target.value)}
                              className="w-full h-full bg-transparent p-2 font-bold text-xs text-zinc-500 dark:text-zinc-400 focus:bg-blue-50 dark:focus:bg-blue-900/20 outline-none font-mono"
                            />
                          </TableCell>
                          <TableCell className="border-r-2 border-black dark:border-white p-0">
                            <input
                              type="text"
                              value={student.email}
                              onChange={(e) => updateRow(index, 'email', e.target.value)}
                              className="w-full h-full bg-transparent p-2 font-bold text-xs focus:bg-blue-50 dark:focus:bg-blue-900/20 outline-none"
                            />
                          </TableCell>
                          <TableCell className="border-r-2 border-black dark:border-white p-0">
                            <input
                              type="text"
                              value={student.turma}
                              onChange={(e) => updateRow(index, 'turma', e.target.value)}
                              className="w-full h-full bg-transparent p-2 font-bold text-xs focus:bg-blue-50 dark:focus:bg-blue-900/20 outline-none"
                            />
                          </TableCell>
                          <TableCell className="border-r-2 border-black dark:border-white">
                            {student.errors.length > 0 && (
                              <div className="text-[10px] font-black uppercase text-red-600 leading-tight">
                                {student.errors.join(' | ')}
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
