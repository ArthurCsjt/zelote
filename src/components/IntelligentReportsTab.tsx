import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, AlertCircle, CheckCircle, Download, TrendingUp } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

interface ReportResponse {
  response: string;
  userQuestion: string;
}

const IntelligentReportsTab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!prompt.trim()) {
      setError('Por favor, digite uma pergunta ou solicitação.');
      return;
    }

    setIsLoading(true);
    setError('');
    setReportData(null);

    try {
      const { data, error: edgeError } = await supabase.functions.invoke('ai-analyst', {
        body: { userQuestion: prompt },
      });

      if (edgeError) {
        let errorMessage = edgeError.message;
        try {
          const errorBody = JSON.parse(edgeError.message);
          errorMessage = errorBody.error || edgeError.message;
        } catch {
          // Se não for JSON, usa a mensagem padrão
        }
        throw new Error(errorMessage);
      }
      
      setReportData(data as ReportResponse);
      toast({
        title: "Análise Gerada",
        description: "O relatório de IA está pronto para visualização."
      });

    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      setError(err.message || "Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData?.response) return;
    
    const content = `# Relatório de Análise Inteligente\n\n## Pergunta:\n${reportData.userQuestion}\n\n## Resposta:\n${reportData.response}`;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-ia-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Concluído",
      description: "O relatório foi baixado como arquivo Markdown.",
    });
  };

  const exampleQuestions = [
    'Quais são os horários de maior demanda?',
    'Qual o tempo médio de uso por tipo de usuário?',
    'Quais Chromebooks precisam de manutenção?',
    'Resuma o desempenho desta semana'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h3 className="font-bold text-zinc-950 dark:text-white text-2xl">Relatórios Inteligentes</h3>
        </div>
        <p className="text-muted-foreground">
          Faça uma pergunta sobre os dados de empréstimos e inventário em linguagem natural.
        </p>
      </div>

      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-zinc-950 dark:text-white">
            <TrendingUp className="h-5 w-5 text-primary" />
            Gerar Análise
          </CardTitle>
          <CardDescription>
            Digite sua pergunta para que a IA analise os dados do seu inventário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium block">
              Sua Pergunta
            </label>
            <Textarea 
              id="question" 
              placeholder="Ex: Qual o perfil de uso dos professores?" 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              rows={3} 
              className="resize-none bg-white dark:bg-card" 
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Exemplos de perguntas:
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((example, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPrompt(example)} 
                  className="text-xs"
                >
                  💡 {example}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleGenerateReport} 
            disabled={isLoading || !prompt.trim()} 
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Gerando Análise...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Gerar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </GlassCard>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reportData && (
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                Resposta Gerada
              </CardTitle>
              <CardDescription>
                Pergunta: "{reportData.userQuestion}"
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Markdown
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg border dark:bg-muted/20">
              {/* Renderiza a resposta em Markdown */}
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{reportData.response}</pre>
            </div>
          </CardContent>
        </GlassCard>
      )}
    </div>
  );
};
export default IntelligentReportsTab;