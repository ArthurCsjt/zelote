import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

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
      complete: (results) => {
        const parsed: ParsedStudent[] = results.data.map((row: any) => {
          const validation = validateStudent(row);
          return {
            nome_completo: row.nome_completo || '',
            ra: row.ra || '',
            email: row.email || '',
            turma: row.turma || '',
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
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importação de Alunos via CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Arquivo Template</p>
                <p className="text-sm text-muted-foreground">
                  Baixe o modelo com os cabeçalhos corretos
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>

          {/* File Upload Area */}
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

          {/* Preview */}
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
                  >
                    {importing ? 'Importando...' : `Importar ${validCount} Alunos`}
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

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>RA</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Erros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((student, index) => (
                        <TableRow 
                          key={index}
                          className={student.valid ? '' : 'bg-destructive/10'}
                        >
                          <TableCell>
                            {student.valid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell>{student.nome_completo}</TableCell>
                          <TableCell>{student.ra}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.turma}</TableCell>
                          <TableCell>
                            {student.errors.length > 0 && (
                              <div className="text-sm text-destructive">
                                {student.errors.join(', ')}
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