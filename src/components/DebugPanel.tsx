import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, Database, Loader2 } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { useQueryClient } from '@tanstack/react-query'; // Importando useQueryClient

const sampleChromebooks = [
  {
    chromebook_id: 'CB001',
    serial_number: 'SN001',
    patrimony_number: 'PAT001',
    model: 'Chromebook Acer C733',
    manufacturer: 'Acer',
    location: 'Sala 101',
    condition: 'bom',
    status: 'disponivel'
  },
  {
    chromebook_id: 'CB002',
    serial_number: 'SN002',
    patrimony_number: 'PAT002',
    model: 'Chromebook Lenovo 300e',
    manufacturer: 'Lenovo',
    location: 'Sala 102',
    condition: 'excelente',
    status: 'emprestado'
  },
  {
    chromebook_id: 'CB003',
    serial_number: 'SN003',
    patrimony_number: 'PAT003',
    model: 'Chromebook HP x360',
    manufacturer: 'HP',
    location: 'Sala 103',
    condition: 'regular',
    status: 'fixo'
  },
  {
    chromebook_id: 'CB004',
    serial_number: 'SN004',
    patrimony_number: 'PAT004',
    model: 'Chromebook Dell 3100',
    manufacturer: 'Dell',
    location: 'Laboratório 1',
    condition: 'bom',
    status: 'disponivel'
  },
  {
    chromebook_id: 'CB005',
    serial_number: 'SN005',
    patrimony_number: 'PAT005',
    model: 'Chromebook Samsung XE500',
    manufacturer: 'Samsung',
    location: 'Biblioteca',
    condition: 'excelente',
    status: 'fixo'
  }
];

export const DebugPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient(); // Inicializando o query client

  const addSampleData = async () => {
    setIsLoading(true);
    try {
      console.log('Adicionando dados de exemplo...');

      // Primeiro, vamos limpar dados existentes para evitar conflitos
      // Nota: Esta operação não invalida o cache automaticamente, mas a inserção sim.
      await supabase.from('chromebooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Adicionar dados de exemplo
      const { data, error } = await supabase
        .from('chromebooks')
        .insert(sampleChromebooks)
        .select();

      if (error) {
        console.error('Erro ao adicionar dados:', error);
        throw new Error(error.message);
      } else {
        console.log('Dados adicionados com sucesso:', data);
        toast({
          title: 'Dados de exemplo adicionados!',
          description: `Adicionados ${data?.length || 0} chromebooks para teste.`,
        });
        
        // Invalida o cache de chromebooks para forçar a recarga no inventário
        queryClient.invalidateQueries({ queryKey: ['chromebooks'] });
      }
    } catch (e: any) {
      console.error('Erro inesperado:', e);
      toast({
        title: 'Erro inesperado',
        description: e.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Database className="h-5 w-5" />
          Debug: Dados de Exemplo
        </CardTitle>
        <CardDescription className="text-orange-700">
          Para testar o sistema de auditoria, adicione alguns dados de exemplo na tabela chromebooks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-orange-700">
            <strong>Dados que serão adicionados:</strong>
          </p>
          <ul className="text-sm text-orange-600 space-y-1">
            {sampleChromebooks.map((cb, index) => (
              <li key={index}>
                {cb.chromebook_id} - {cb.model} ({cb.location})
              </li>
            ))}
          </ul>
          <Button
            onClick={addSampleData}
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Dados de Exemplo
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </GlassCard>
  );
};