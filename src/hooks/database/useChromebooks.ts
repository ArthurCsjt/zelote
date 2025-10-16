import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Chromebook, ChromebookData } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

// Chave de cache para Chromebooks
const CHROMEBOOKS_QUERY_KEY = ['chromebooks'];

// 1. Hook para buscar todos os Chromebooks
export function useChromebooks() {
  return useQuery<Chromebook[]>({
    queryKey: CHROMEBOOKS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chromebooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Chromebook[];
    },
    staleTime: 60 * 1000, // Cache por 1 minuto
  });
}

// 2. Hook para criar um Chromebook
export function useCreateChromebook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ChromebookData): Promise<Chromebook> => {
      if (!user) throw new Error("Usuário não autenticado");

      const payload: any = {
        chromebook_id: data.chromebookId,
        model: data.model,
        serial_number: data.serialNumber,
        patrimony_number: data.patrimonyNumber,
        status: data.status as any,
        condition: data.condition,
        location: data.location,
        classroom: data.classroom,
        manufacturer: data.manufacturer,
        created_by: user.id,
      };

      const { data: result, error } = await supabase
        .from('chromebooks')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return result as Chromebook;
    },
    onSuccess: (newChromebook) => {
      // Invalida o cache para forçar a recarga da lista
      queryClient.invalidateQueries({ queryKey: CHROMEBOOKS_QUERY_KEY });
      toast({ title: "Sucesso", description: `Chromebook ${newChromebook.chromebook_id} cadastrado.` });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    },
  });
}

// 3. Hook para atualizar um Chromebook
export function useUpdateChromebook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ChromebookData> }): Promise<void> => {
      if (!user) throw new Error("Usuário não autenticado");

      const updatePayload: any = {
        chromebook_id: data.chromebookId,
        model: data.model,
        serial_number: data.serialNumber,
        patrimony_number: data.patrimonyNumber,
        status: data.status as any,
        condition: data.condition,
        location: data.location,
        classroom: data.classroom,
        manufacturer: data.manufacturer,
      };

      const { error } = await supabase
        .from('chromebooks')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHROMEBOOKS_QUERY_KEY });
      toast({ title: "Sucesso", description: "Chromebook atualizado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });
}

// 4. Hook para deletar um Chromebook
export function useDeleteChromebook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('chromebooks')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHROMEBOOKS_QUERY_KEY });
      toast({ title: "Sucesso", description: "Chromebook excluído com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });
}