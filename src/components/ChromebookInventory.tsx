import { ChromebookDeleteDialog } from "@/components/inventory/chromebook/ChromebookDeleteDialog";
import { ChromebookEditDialog } from "@/components/inventory/chromebook/ChromebookEditDialog";
import { InventoryFilters } from "@/components/inventory/chromebook/InventoryFilters";
import { InventoryTable } from "@/components/inventory/chromebook/InventoryTable";

// As props que o componente principal recebe de fora (do InventoryHub)
interface ChromebookInventoryProps {
  onGenerateQrCode: (chromebookId: string) => void;
}

export function ChromebookInventory({ onGenerateQrCode }: ChromebookInventoryProps) {
  // 1. Chamamos nosso "cérebro" principal para toda a lógica de CRUD e estado dos modais.
  const {
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
  } = useChromebookInventory();

  // 2. Chamamos nosso "cérebro" especialista para a lógica de filtros.
  //    Ele recebe a lista completa de chromebooks e nos retorna a lista já filtrada.
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredChromebooks,
  } = useInventoryFilters(chromebooks);

  // 3. O componente agora apenas "monta" as peças, entregando os dados e funções
  //    para os componentes visuais correspondentes.
  return (
    <div className="space-y-6">
      <InventoryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <InventoryTable
        chromebooks={filteredChromebooks}
        loading={loading}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onGenerateQrCode={onGenerateQrCode}
      />
      
      {/* Os modais ficam aqui, invisíveis até serem ativados pelo estado do nosso hook */}
      <ChromebookEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingChromebook={editingChromebook}
        setEditingChromebook={setEditingChromebook}
        onSave={handleSaveEdit}
      />

      <ChromebookDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        chromebookToDelete={chromebookToDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}