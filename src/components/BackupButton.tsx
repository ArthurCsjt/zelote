import React from 'react';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';

export function BackupButton() {
  const { exportChromebooksToCSV, loading } = useDatabase();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = await exportChromebooksToCSV();
      
      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-chromebooks-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Backup Concluído",
          description: "Todos os dados dos Chromebooks foram exportados para CSV.",
        });
      } else {
        toast({
          title: "Aviso",
          description: "Nenhum dado de Chromebook encontrado para exportar.",
          variant: "info",
        });
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: "Erro de Exportação",
        description: "Falha ao gerar o arquivo CSV.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting || loading}
      variant="outline"
      className="bg-white hover:bg-gray-50 border-gray-300"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Backup CSV
    </Button>
  );
}