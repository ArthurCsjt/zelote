
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { Search } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";

// Interface for Chromebook data structure
interface ChromebookData {
  id: string;
  manufacturer: string;
  model: string;
  series: string;
  manufacturingYear?: string;
  patrimonyNumber?: string;
  observations?: string;
  isProvisioned: boolean;
}

export function ChromebookInventory() {
  // State for storing all Chromebooks
  const [chromebooks, setChromebooks] = useState<ChromebookData[]>([]);
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");
  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // State for the Chromebook being edited
  const [editingChromebook, setEditingChromebook] = useState<ChromebookData | null>(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load Chromebooks from localStorage on component mount
  useEffect(() => {
    const savedChromebooks = localStorage.getItem("chromebooks");
    if (savedChromebooks) {
      try {
        setChromebooks(JSON.parse(savedChromebooks));
      } catch (error) {
        console.error("Error parsing chromebooks from localStorage:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os Chromebooks salvos",
          variant: "destructive",
        });
      }
    }
  }, []);

  // Filter Chromebooks based on search term
  const filteredChromebooks = chromebooks.filter((chromebook) =>
    Object.values(chromebook).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredChromebooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChromebooks = filteredChromebooks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Handle edit click
  const handleEditClick = (chromebook: ChromebookData) => {
    setEditingChromebook({ ...chromebook });
    setIsEditDialogOpen(true);
  };

  // Handle edit form change
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editingChromebook) return;

    setEditingChromebook({
      ...editingChromebook,
      [e.target.id]: e.target.value,
    });
  };

  // Handle provisioning status change
  const handleProvisioningChange = (checked: boolean) => {
    if (!editingChromebook) return;

    setEditingChromebook({
      ...editingChromebook,
      isProvisioned: checked,
    });
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editingChromebook) return;

    // Validate required fields
    if (!editingChromebook.id || !editingChromebook.manufacturer || 
        !editingChromebook.model || !editingChromebook.series) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Update Chromebook in the list
    const updatedChromebooks = chromebooks.map((item) =>
      item.id === editingChromebook.id ? editingChromebook : item
    );

    // Save to state and localStorage
    setChromebooks(updatedChromebooks);
    localStorage.setItem("chromebooks", JSON.stringify(updatedChromebooks));

    // Close dialog and show success message
    setIsEditDialogOpen(false);
    setEditingChromebook(null);
    toast({
      title: "Sucesso",
      description: `Chromebook ${editingChromebook.id} atualizado com sucesso`,
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm(`Tem certeza que deseja excluir o Chromebook ${id}?`)) {
      const updatedChromebooks = chromebooks.filter((item) => item.id !== id);
      setChromebooks(updatedChromebooks);
      localStorage.setItem("chromebooks", JSON.stringify(updatedChromebooks));
      toast({
        title: "Sucesso",
        description: `Chromebook ${id} excluído com sucesso`,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Inventário de Chromebooks
      </h2>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar Chromebook..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          Total: {filteredChromebooks.length} Chromebooks
        </div>
      </div>

      {/* Table of Chromebooks */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fabricante</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Patrimônio</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChromebooks.length > 0 ? (
              paginatedChromebooks.map((chromebook) => (
                <TableRow key={chromebook.id}>
                  <TableCell className="font-medium">{chromebook.id}</TableCell>
                  <TableCell>{chromebook.manufacturer}</TableCell>
                  <TableCell>{chromebook.model}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        chromebook.isProvisioned
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {chromebook.isProvisioned
                        ? "Provisionado"
                        : "Não Provisionado"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {chromebook.patrimonyNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(chromebook)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(chromebook.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-gray-500"
                >
                  {searchTerm
                    ? "Nenhum resultado encontrado. Tente uma busca diferente."
                    : "Nenhum Chromebook cadastrado ainda."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Chromebook</DialogTitle>
            <DialogDescription>
              Atualize as informações do Chromebook. Os campos marcados com *
              são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          {editingChromebook && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="id">ID do Chromebook *</Label>
                <Input
                  id="id"
                  value={editingChromebook.id}
                  onChange={handleEditChange}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante *</Label>
                <Input
                  id="manufacturer"
                  value={editingChromebook.manufacturer}
                  onChange={handleEditChange}
                  placeholder="Ex: Lenovo, HP, Dell"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={editingChromebook.model}
                  onChange={handleEditChange}
                  placeholder="Ex: Chromebook 14e"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="series">Série *</Label>
                <Input
                  id="series"
                  value={editingChromebook.series}
                  onChange={handleEditChange}
                  placeholder="Digite o número de série"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturingYear">Ano de Fabricação</Label>
                <Input
                  id="manufacturingYear"
                  value={editingChromebook.manufacturingYear || ""}
                  onChange={handleEditChange}
                  placeholder="Ex: 2023"
                />
                <p className="text-xs text-gray-500">Campo opcional</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patrimonyNumber">Patrimônio</Label>
                <Input
                  id="patrimonyNumber"
                  value={editingChromebook.patrimonyNumber || ""}
                  onChange={handleEditChange}
                  placeholder="Digite o número do patrimônio"
                />
                <p className="text-xs text-gray-500">Campo opcional</p>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="isProvisioned"
                  checked={editingChromebook.isProvisioned}
                  onCheckedChange={(checked) =>
                    handleProvisioningChange(checked === true)
                  }
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="isProvisioned"
                    className="font-medium text-sm cursor-pointer"
                  >
                    Equipamento Provisionado
                  </Label>
                  <p className="text-xs text-gray-500">
                    Marque se o Chromebook já está provisionado no console de
                    administração
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={editingChromebook.observations || ""}
                  onChange={handleEditChange}
                  placeholder="Digite observações relevantes sobre o equipamento"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-gray-500">Campo opcional</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingChromebook(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
