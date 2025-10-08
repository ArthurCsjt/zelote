import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Database, TrendingUp } from 'lucide-react';
interface ReportData {
  query: string;
  data: any[];
  userQuestion: string;
}
const IntelligentReportsTab: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleGenerateReport = async () => {
    if (!question.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma pergunta.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('report-assistant', {
        body: {
          userQuestion: question
        }
      });
      if (error) {
        throw error;
      }
      setReportData(data);
      toast({
        title: "Relatório Gerado",
        description: "Relatório criado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) {
      return <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            Nenhum resultado encontrado para esta consulta.
          </AlertDescription>
        </Alert>;
    }
    const columns = Object.keys(data[0]);
    return <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => <TableHead key={column} className="font-semibold">
                  {column}
                </TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => <TableRow key={index}>
                {columns.map(column => <TableCell key={column}>
                    {row[column] !== null && row[column] !== undefined ? String(row[column]) : '-'}
                  </TableCell>)}
              </TableRow>)}
          </TableBody>
        </Table>
      </div>;
  };
  const exampleQuestions = ["Quantos chromebooks estão disponíveis?", "Quais são os empréstimos ativos no momento?", "Qual o modelo de chromebook mais emprestado?", "Quantos empréstimos foram feitos este mês?", "Quais chromebooks estão atrasados para devolução?"];
  return <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h3 className="font-bold text-zinc-950 text-2xl">Relatórios Inteligentes</h3>
        </div>
        <p className="text-muted-foreground">
          Faça uma pergunta sobre os dados de empréstimos e inventário em linguagem natural
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-zinc-950">
            <TrendingUp className="h-5 w-5" />
            Gerar Relatório
          </CardTitle>
          <CardDescription>
            Digite sua pergunta e nossa IA gerará automaticamente um relatório personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium rounded-md bg-zinc-50">
              Sua Pergunta
            </label>
            <Textarea id="question" placeholder="Ex: Quantos chromebooks estão emprestados para alunos do ensino médio?" value={question} onChange={e => setQuestion(e.target.value)} rows={3} className="resize-none bg-zinc-100" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Exemplos de perguntas:
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((example, index) => <Button key={index} variant="outline" size="sm" onClick={() => setQuestion(example)} className="text-xs">
                  {example}
                </Button>)}
            </div>
          </div>

          <Button onClick={handleGenerateReport} disabled={isLoading || !question.trim()} className="w-full">
            {isLoading ? <>
                <LoadingSpinner size="sm" className="mr-2" />
                Gerando Relatório...
              </> : 'Gerar Relatório'}
          </Button>
        </CardContent>
      </Card>

      {reportData && <Card className="glass-card">
          <CardHeader>
            <CardTitle>Resultado do Relatório</CardTitle>
            <CardDescription>
              Pergunta: "{reportData.userQuestion}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Consulta SQL Gerada:</p>
              <code className="block p-3 bg-muted rounded-md text-sm overflow-x-auto">
                {reportData.query}
              </code>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Resultados:</p>
                <span className="text-sm text-muted-foreground">
                  {reportData.data.length} registro(s) encontrado(s)
                </span>
              </div>
              {renderTable(reportData.data)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default IntelligentReportsTab;