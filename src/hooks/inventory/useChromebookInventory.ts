import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import type { Chromebook as ChromebookType } from "@/types/database";

// Interface para o formulário de edição, para manter a tipagem forte.
interface ChromebookFormData extends Partial<ChromebookType> {}

/**
 * Hook customizado para gerenciar toda a lógica do inventário de Chromebooks.
 * Centraliza o estado, busca de dados e ações (CRUD) em um único lugar.
 */
export const useChromebookInventory = () => {
  // Estado para armazenar la lista de todos os chromebooks
  const [chromebooks, setChromebooks] = useState<ChromebookType[]>([]);
  // Estado para controlar o feedback de carregamento
  const [loading, setLoading] = useState(true);
  
  // Estados para controlar o diálogo de Edição
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<ChromebookFormData | null>(null);

  // Estados para controlar o diálogo de Exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chromebookToDelete, setChromebookToDelete] = useState<ChromebookType | null>(null);

  // Função para carregar os dados do Supabase
  const fetchChromebooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chromebooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else if (data) {
      setChromebooks(data as ChromebookType[]);
    }
    setLoading(false);
  }, []);

  // Efeito que busca os dados iniciais quando o hook é utilizado pela primeira vez
  useEffect(() => {
    fetchChromebooks();
  }, [fetchChromebooks]);

  // Funções para ABRIR os diálogos
  const handleEditClick = (chromebook: ChromebookType) => {
    setEditingChromebook({ ...chromebook });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (chromebook: ChromebookType) => {
    setChromebookToDelete(chromebook);
    setIsDeleteDialogOpen(true);
  };

  // Função para SALVAR as alterações de um chromebook
  const handleSaveEdit = async () => {
    if (!editingChromebook || !editingChromebook.id) return;

    // Prepara os dados para o update, removendo campos que não devem ser alterados
    const { id, created_at, chromebook_id, ...updateData } = editingChromebook;

    const { error } = await supabase
      .from('chromebooks')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Chromebook atualizado." });
      // Atualiza o estado local para a UI refletir a mudança instantaneamente
      setChromebooks(current => 
        current.map(cb => (cb.id === id ? { ...cb, ...updateData } : cb))
      );
      setIsEditDialogOpen(false);
    }
  };

  // Função para CONFIRMAR a exclusão de um chromebook
  const handleConfirmDelete = async () => {
    if (!chromebookToDelete) return;

    const { error } = await supabase
      .from('chromebooks')
      .delete()
      .eq('id', chromebookToDelete.id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Chromebook excluído." });
      // Atualiza o estado local para a UI refletir a mudança instantaneamente
      setChromebooks(current => current.filter(cb => cb.id !== chromebookToDelete.id));
    }
    setIsDeleteDialogOpen(false);
    setChromebookToDelete(null);
  };
  
  // O hook expõe todos os estados e funções que a UI precisará para funcionar
  return {
    chromebooks,
    loading,
    fetchChromebooks,
    
    isEditDialogOpen,
    setIsEditDialogOpen,
    editingChromebook,
    setEditingChromebook,
    handleEditClick,
    handleSaveEdit,

    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    chromebookToDelete,
    handleDeleteClick,
    handleConfirmDelete,
  };
};