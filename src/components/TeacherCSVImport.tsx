import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Download, FileText, AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';
import { Button } from './ui/button';
import { CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard';
import type { TeacherData } from '@/types/database';
import { validateEmailDomain } from '@/utils/emailValidation';

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
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV.",
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
        const parsed: ParsedTeacher[] = results.data.map((row: any) => {
          const teacherData: TeacherCSVData = {
            nome_completo: row.nome_completo || '',
            email: row.email || '',
            materia: row.materia || '',
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
      },
      error: (error) => {
        toast({
          title: "Erro ao processar arquivo",
          description: error.message,
          variant: "destructive",
        });
      }
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
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            Importação de Professores via CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Arquivo Template</p>
                <p className="text-sm text-muted-foreground">
                  Baixe o modelo com os cabeçalhos corretos (nome_completo, email, materia)
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>

          {!preview && (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                Arraste e solte um arquivo CSV aqui
              </p>
              <p className="text-muted-foreground mb-4">
                ou clique para selecionar um arquivo
              </p>
              <Button variant="outline">
                Selecionar Arquivo
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

          {preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">Pré-visualização</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {validCount} válidos
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="outline" className="text-destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {invalidCount} inválidos
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
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
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || validCount === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {importing ? 'Importando...' : `Importar ${validCount} Professores`}
                  </Button>
                </div>
              </div>

              {invalidCount > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {invalidCount} linha(s) contém erros e não serão importadas.
                    Verifique os dados destacados em vermelho.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Matéria</TableHead>
                        <TableHead>Erros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((teacher, index) => (
                        <TableRow
                          key={index}
                          className={teacher.valid ? '' : 'bg-destructive/10'}
                        >
                          <TableCell>
                            {teacher.valid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell>{teacher.nome_completo}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>{teacher.materia || '-'}</TableCell>
                          <TableCell>
                            {teacher.errors.length > 0 && (
                              <div className="text-sm text-destructive">
                                {teacher.errors.join(', ')}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
}