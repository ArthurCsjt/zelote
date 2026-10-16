import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeCSVValue } from '@/utils/security';

export interface CSVColumnDefinition<T> {
  key: keyof T & string;
  label: string;
  widthClass?: string;
  isMono?: boolean;
}

export interface UniqueCheckRule<T> {
  field: keyof T & string;
  label: string;
  tableName: 'alunos' | 'professores' | 'funcionarios';
  tableColumn: string;
  normalize?: (value: string) => string;
}

export interface GenericCSVImportProps<T extends Record<string, any>> {
  title: string;
  icon?: React.ReactNode;
  headerBgClass?: string;
  templateFilename: string;
  templateContent: string;
  columns: CSVColumnDefinition<T>[];
  expectedHeaders: (keyof T & string)[];
  validateRow: (row: Record<string, string>) => { valid: boolean; errors: string[] };
  uniqueChecks?: UniqueCheckRule<T>[];
  onSaveBatch: (items: T[]) => Promise<boolean>;
  itemName: string;
  pluralItemName: string;
}

export interface ParsedCSVRow<T> {
  data: T;
  valid: boolean;
  errors: string[];
}

export function GenericCSVImport<T extends Record<string, any>>({
  title,
  icon,
  headerBgClass = 'bg-blue-600 dark:bg-blue-800',
  templateFilename,
  templateContent,
  columns,
  expectedHeaders,
  validateRow,
  uniqueChecks = [],
  onSaveBatch,
  itemName,
  pluralItemName,
}: GenericCSVImportProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow<T>[]>([]);
  const [preview, setPreview] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelectRow = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === parsedRows.length && parsedRows.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedRows.map((_, i) => i)));
    }
  };

  const removeSelectedRows = () => {
    if (selectedIndices.size === 0) return;
    const count = selectedIndices.size;
    setParsedRows(prev => prev.filter((_, index) => !selectedIndices.has(index)));
    setSelectedIndices(new Set());
    toast({
      title: "Sucesso",
      description: `${count} registros removidos da lista.`,
    });
  };

  const removeRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Linha removida",
      description: `O registro foi removido da lista de importação.`,
    });
  };

  const updateRowField = (index: number, field: string, value: string) => {
    setParsedRows(prev => {
      const newData = [...prev];
      const currentItem = { ...newData[index].data, [field]: value };
      const validation = validateRow(currentItem as Record<string, string>);

      newData[index] = {
        data: currentItem,
        valid: validation.valid,
        errors: validation.errors,
      };
      return newData;
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = templateFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const processParsedRawData = (rawList: Record<string, any>[]) => {
    const parsed: ParsedCSVRow<T>[] = rawList.map((row) => {
      const sanitizedObj: Record<string, string> = {};
      columns.forEach(col => {
        const rawVal = row[col.key] || '';
        sanitizedObj[col.key] = sanitizeCSVValue(String(rawVal));
      });

      const validation = validateRow(sanitizedObj);
      return {
        data: sanitizedObj as unknown as T,
        valid: validation.valid,
        errors: validation.errors,
      };
    });

    setParsedRows(parsed);
    setPreview(true);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo no formato CSV.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: (results) => {
        const metaFields = results.meta.fields || [];
        const hasCorrectHeaders = expectedHeaders.every(field => metaFields.includes(field));

        if (hasCorrectHeaders && results.data.length > 0) {
          processParsedRawData(results.data as Record<string, any>[]);
        } else {
          // Fallback: tentar sem cabeçalho e mapear pela ordem das colunas
          Papa.parse(selectedFile, {
            header: false,
            skipEmptyLines: true,
            complete: (noHeaderResults) => {
              const rows = noHeaderResults.data as string[][];
              if (!rows || rows.length === 0) {
                toast({
                  title: "Arquivo vazio",
                  description: "O arquivo selecionado não contém dados.",
                  variant: "destructive",
                });
                return;
              }

              const mapped = rows.map(cols => {
                const rowObj: Record<string, string> = {};
                columns.forEach((col, idx) => {
                  rowObj[col.key] = cols[idx] || '';
                });
                return rowObj;
              });

              processParsedRawData(mapped);
            },
          });
        }
      },
      error: (error) => {
        toast({
          title: "Erro no processamento",
          description: error.message,
          variant: "destructive",
        });
      },
    });
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

  const checkDuplicates = async (): Promise<boolean> => {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0 || uniqueChecks.length === 0) return true;

    try {
      let hasAnyConflict = false;
      const rowConflictErrors = new Map<number, string[]>();

      for (const rule of uniqueChecks) {
        const norm = rule.normalize || ((v: string) => v.trim());
        const internalCounts = new Map<string, number>();

        validRows.forEach(r => {
          const val = r.data[rule.field];
          if (val) {
            const normalized = norm(String(val));
            internalCounts.set(normalized, (internalCounts.get(normalized) || 0) + 1);
          }
        });

        const internalDuplicates = new Set<string>();
        internalCounts.forEach((count, key) => {
          if (count > 1) internalDuplicates.add(key);
        });

        const allValues = validRows
          .map(r => r.data[rule.field])
          .filter(Boolean)
          .map(v => norm(String(v)));

        const existingInDb = new Set<string>();
        const BATCH_SIZE = 100;

        for (let i = 0; i < allValues.length; i += BATCH_SIZE) {
          const batch = allValues.slice(i, i + BATCH_SIZE);
          const { data, error } = await supabase
            .from(rule.tableName)
            .select(rule.tableColumn)
            .in(rule.tableColumn, batch);

          if (error) {
            console.error(`Erro ao consultar duplicados em ${rule.tableName}:`, error);
          } else if (data) {
            data.forEach((rowItem: any) => {
              const val = rowItem[rule.tableColumn];
              if (val) existingInDb.add(norm(String(val)));
            });
          }
        }

        parsedRows.forEach((row, idx) => {
          const val = row.data[rule.field];
          if (!val) return;
          const normalized = norm(String(val));
          const currentErrors = rowConflictErrors.get(idx) || [];

          if (internalDuplicates.has(normalized)) {
            currentErrors.push(`${rule.label} duplicado no arquivo`);
            hasAnyConflict = true;
          } else if (existingInDb.has(normalized)) {
            currentErrors.push(`${rule.label} já cadastrado`);
            hasAnyConflict = true;
          }

          if (currentErrors.length > 0) {
            rowConflictErrors.set(idx, currentErrors);
          }
        });
      }

      if (hasAnyConflict) {
        setParsedRows(prev =>
          prev.map((row, idx) => {
            const conflicts = rowConflictErrors.get(idx);
            if (!conflicts || conflicts.length === 0) return row;

            const existingWithoutDuplicates = row.errors.filter(e =>
              !e.includes('duplicado no arquivo') && !e.includes('já cadastrado')
            );

            return {
              ...row,
              valid: false,
              errors: [...existingWithoutDuplicates, ...conflicts],
            };
          })
        );

        toast({
          title: "Duplicados encontrados",
          description: `Foram encontrados registros com dados duplicados (no arquivo ou no sistema). Verifique as linhas em vermelho.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Erro na checagem de duplicidade:', error);
      toast({
        title: "Erro na validação",
        description: `Não foi possível verificar duplicados: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.valid);

    if (validRows.length === 0) {
      toast({
        title: "Erro",
        description: `Não há ${pluralItemName} válidos para importar.`,
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      const isClean = await checkDuplicates();
      if (!isClean) {
        setImporting(false);
        return;
      }

      const itemsToImport = validRows.map(r => r.data);
      const success = await onSaveBatch(itemsToImport);

      if (success) {
        toast({
          title: "Sucesso!",
          description: `${validRows.length} ${pluralItemName} importados com sucesso.`,
        });

        setFile(null);
        setParsedRows([]);
        setPreview(false);
        setSelectedIndices(new Set());
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({
          title: "Erro",
          description: `Erro ao importar ${pluralItemName}. Verifique se não há dados inválidos.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`Erro ao importar ${pluralItemName}:`, error);
      toast({
        title: "Erro",
        description: error?.message || "Erro interno do sistema.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="space-y-6">
      <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden">
        {/* Header */}
        <div className={cn("p-4 border-b-4 border-black dark:border-white flex items-center gap-3", headerBgClass)}>
          {icon || <Upload className="h-6 w-6 text-white" />}
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
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
                <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                  {selectedIndices.size > 0 && (
                    <Button
                      onClick={removeSelectedRows}
                      className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Selecionados ({selectedIndices.size})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreview(false);
                      setFile(null);
                      setParsedRows([]);
                      setSelectedIndices(new Set());
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
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white w-12 text-center p-0">
                          <input
                            type="checkbox"
                            checked={selectedIndices.size === parsedRows.length && parsedRows.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 cursor-pointer accent-black"
                          />
                        </TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white w-16 text-center">Status</TableHead>
                        {columns.map(col => (
                          <TableHead
                            key={col.key}
                            className={cn(
                              "text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white",
                              col.widthClass
                            )}
                          >
                            {col.label}
                          </TableHead>
                        ))}
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs border-r-2 border-black dark:border-white">Erros</TableHead>
                        <TableHead className="text-black dark:text-white font-black uppercase text-xs w-16 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, index) => (
                        <TableRow
                          key={index}
                          className={cn(
                            "hover:bg-gray-50 dark:hover:bg-zinc-900 border-b-2 border-black dark:border-white",
                            !row.valid && "bg-red-50 dark:bg-red-950/40",
                            selectedIndices.has(index) && "bg-blue-50 dark:bg-blue-900/20"
                          )}
                        >
                          <TableCell className="border-r-2 border-black dark:border-white text-center p-0">
                            <input
                              type="checkbox"
                              checked={selectedIndices.has(index)}
                              onChange={() => toggleSelectRow(index)}
                              className="w-4 h-4 cursor-pointer accent-black"
                            />
                          </TableCell>
                          <TableCell className="border-r-2 border-black dark:border-white text-center">
                            {row.valid ? (
                              <div className="p-1 bg-green-100 border-2 border-black rounded-full inline-block">
                                <CheckCircle className="h-4 w-4 text-green-700" />
                              </div>
                            ) : (
                              <div className="p-1 bg-red-100 border-2 border-black rounded-full inline-block">
                                <AlertCircle className="h-4 w-4 text-red-700" />
                              </div>
                            )}
                          </TableCell>
                          {columns.map(col => {
                            const hasErrorOnCol = row.errors.some(err =>
                              err.toLowerCase().includes(col.label.toLowerCase()) ||
                              err.toLowerCase().includes(col.key.toLowerCase())
                            );

                            return (
                              <TableCell
                                key={col.key}
                                className={cn(
                                  "border-r-2 border-black dark:border-white p-0",
                                  hasErrorOnCol && "bg-red-200 dark:bg-red-900/60"
                                )}
                              >
                                <input
                                  type="text"
                                  value={row.data[col.key] || ''}
                                  onChange={(e) => updateRowField(index, col.key, e.target.value)}
                                  className={cn(
                                    "w-full h-full bg-transparent p-2 font-bold text-xs focus:bg-blue-50 dark:focus:bg-blue-900/20 outline-none",
                                    col.isMono && "font-mono",
                                    hasErrorOnCol ? "text-red-700 dark:text-red-300" : "text-black dark:text-white"
                                  )}
                                />
                              </TableCell>
                            );
                          })}
                          <TableCell className="border-r-2 border-black dark:border-white p-2">
                            {row.errors.length > 0 ? (
                              <div className="space-y-1">
                                {row.errors.map((error, errIdx) => (
                                  <div key={errIdx} className="text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span>{error}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 font-bold text-xs">Válido</span>
                            )}
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 p-1 h-auto"
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
