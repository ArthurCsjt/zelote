
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
import { Search, ArrowLeft, Filter, Edit3, QrCode, CheckCircle, AlertCircle, XCircle, MapPin, Eye, X, Trash2, Save } from "lucide-react";
import { QRCodeModal } from "./QRCodeModal";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { ScrollArea } from "./ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useProfileRole } from "@/hooks/use-profile-role";

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
  status: 'disponivel' | 'emprestado' | 'fixo' | 'inativo';
  classroom?: string;
}


interface ChromebookInventoryProps {
  onBack?: () => void;
}

export function ChromebookInventory({ onBack }: ChromebookInventoryProps) {
  // Check if on mobile device
  const isMobile = useIsMobile();
  const { isAdmin } = useProfileRole();
  
  // State for storing all Chromebooks
  const [chromebooks, setChromebooks] = useState<ChromebookData[]>([]);
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // State for fixed-in-classroom filter
  const [fixedFilter, setFixedFilter] = useState<string>('all');
  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // State for QR Code dialog
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  // State for the Chromebook being edited
  const [editingChromebook, setEditingChromebook] = useState<ChromebookData | null>(null);
  // State for the Chromebook being deleted
  const [chromebookToDelete, setChromebookToDelete] = useState<ChromebookData | null>(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

// Load Chromebooks from localStorage on component mount
useEffect(() => {
  const savedChromebooks = localStorage.getItem("chromebooks");
  if (savedChromebooks) {
    try {
      const parsed = JSON.parse(savedChromebooks);
      // Normalize data
      const chromebooksWithStatus = parsed.map((cb: any) => {
        const normalizedStatus = cb.status === 'manutencao' ? 'fixo' : (cb.status || 'disponivel');
        return {
          ...cb,
          status: normalizedStatus,
          manufacturer: cb.manufacturer || 'Não informado',
          model: cb.model || cb.modelo || 'Não informado',
          series: cb.series || cb.serie || 'Não informado',
          patrimonyNumber: cb.patrimonyNumber || cb.patrimonio || cb.id,
          classroom: cb.classroom || cb.sala || undefined,
        } as ChromebookData;
      });
      setChromebooks(chromebooksWithStatus);
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

  // Save chromebooks to localStorage whenever the state changes
  useEffect(() => {
    if (chromebooks.length > 0) {
      localStorage.setItem("chromebooks", JSON.stringify(chromebooks));
    }
  }, [chromebooks]);

  // Filter Chromebooks based on search term and status
  const filteredChromebooks = chromebooks.filter((chromebook) => {
    const matchesSearch = 
      chromebook.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(chromebook.patrimonyNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      chromebook.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chromebook.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chromebook.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
const matchesStatus = statusFilter === 'all' || chromebook.status === statusFilter;
const matchesFixed = fixedFilter === 'all' || (fixedFilter === 'fixo' ? chromebook.status === 'fixo' : chromebook.status !== 'fixo');

return matchesSearch && matchesStatus && matchesFixed;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredChromebooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChromebooks = filteredChromebooks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Get status information for display
  const getStatusInfo = (status: string) => {
switch (status) {
  case 'disponivel':
    return { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'Disponível' };
  case 'emprestado':
    return { color: 'text-purple-600 bg-purple-50', icon: AlertCircle, label: 'Emprestado' };
  case 'fixo':
    return { color: 'text-blue-700 bg-blue-50', icon: MapPin, label: 'Fixo' };
  case 'inativo':
    return { color: 'text-gray-600 bg-gray-50', icon: XCircle, label: 'Inativo' };
  default:
    return { color: 'text-gray-600 bg-gray-50', icon: XCircle, label: 'Desconhecido' };
}
  };

// Handle status change
const handleStatusChange = (chromebookId: string, newStatus: string) => {
  if (newStatus === 'emprestado') {
    toast({
      title: "Atenção",
      description: "Para emprestar um Chromebook, use a seção de Empréstimos",
      variant: "destructive",
    });
    return;
  }

  // Only admins can set FIXO
  if (newStatus === 'fixo' && !isAdmin) {
    toast({ title: 'Permissão negada', description: 'Apenas administradores podem marcar como Fixo.', variant: 'destructive' });
    return;
  }
  
  const updatedChromebooks = chromebooks.map((item) =>
    item.id === chromebookId ? { ...item, status: newStatus as ChromebookData['status'] } : item
  );
  
  setChromebooks(updatedChromebooks);
  toast({
    title: "Status atualizado",
    description: `Status do Chromebook alterado para ${getStatusInfo(newStatus).label}`,
  });
};

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

  // Handle status change in edit dialog
  const handleEditStatusChange = (value: string) => {
    if (!editingChromebook) return;

    setEditingChromebook({
      ...editingChromebook,
      status: value as ChromebookData['status'],
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

    setChromebooks(updatedChromebooks);
    setIsEditDialogOpen(false);
    setEditingChromebook(null);
    toast({
      title: "Sucesso",
      description: `Chromebook ${editingChromebook.patrimonyNumber || editingChromebook.id} atualizado com sucesso`,
    });
  };

  // Handle delete click
  const handleDeleteClick = (chromebook: ChromebookData) => {
    setChromebookToDelete(chromebook);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (!chromebookToDelete) return;

    const updatedChromebooks = chromebooks.filter((item) => item.id !== chromebookToDelete.id);
    setChromebooks(updatedChromebooks);
    setIsDeleteDialogOpen(false);
    setChromebookToDelete(null);
    toast({
      title: "Sucesso",
      description: `Chromebook ${chromebookToDelete.patrimonyNumber || chromebookToDelete.id} excluído com sucesso`,
    });
  };

  // Handle back button click
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 glass-morphism animate-fade-in relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-3xl blur-2xl transform scale-110" />
      

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por ID, patrimônio, modelo, série ou fabricante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] pl-10">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
<SelectContent>
  <SelectItem value="all">Todos os Status</SelectItem>
  <SelectItem value="disponivel">Disponível</SelectItem>
  <SelectItem value="emprestado">Emprestado</SelectItem>
  <SelectItem value="fixo">Fixo</SelectItem>
  <SelectItem value="inativo">Inativo</SelectItem>
</SelectContent>
          </Select>
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Select value={fixedFilter} onValueChange={setFixedFilter}>
            <SelectTrigger className="w-[200px] pl-10">
              <SelectValue placeholder="Filtrar por fixo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="fixo">Apenas Fixos</SelectItem>
              <SelectItem value="movel">Apenas Móveis</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-500 flex items-center">
          Total: {filteredChromebooks.length} Chromebooks
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
        <div className="glass-card p-4 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <p className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">{chromebooks.length}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
        <div className="glass-card p-4 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {chromebooks.filter(c => c.status === 'disponivel').length}
          </p>
          <p className="text-sm text-gray-600">Disponíveis</p>
        </div>
        <div className="glass-card p-4 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            {chromebooks.filter(c => c.status === 'emprestado').length}
          </p>
          <p className="text-sm text-gray-600">Emprestados</p>
        </div>
<div className="glass-card p-4 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
  <p className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
    {chromebooks.filter(c => c.status === 'fixo').length}
  </p>
  <p className="text-sm text-gray-600">Fixos</p>
</div>
      </div>

      {/* Table of Chromebooks */}
      <div className="glass-card border-white/30 rounded-2xl overflow-hidden relative z-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Patrimônio</TableHead>
              <TableHead>Fabricante</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Série</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChromebooks.length > 0 ? (
              paginatedChromebooks.map((chromebook) => {
                const statusInfo = getStatusInfo(chromebook.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <TableRow key={chromebook.id}>
                    <TableCell className="font-medium text-xs">
                      {chromebook.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {chromebook.patrimonyNumber || chromebook.id}
                    </TableCell>
                    <TableCell>{chromebook.manufacturer}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {chromebook.model}
{chromebook.status === 'fixo' && (
  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Fixo</span>
)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
<div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
  <StatusIcon className="w-3 h-3" />
  {statusInfo.label}
  {chromebook.status === 'fixo' && chromebook.classroom && (
    <span className="ml-1 text-[10px] text-blue-700">({chromebook.classroom})</span>
  )}
</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {chromebook.series}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQRCode(chromebook.patrimonyNumber || chromebook.id)}
                          title="Ver QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(chromebook)}
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(chromebook)}
                          title="Excluir"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Select 
                          value={chromebook.status} 
                          onValueChange={(value) => handleStatusChange(chromebook.id, value)}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
<SelectItem value="disponivel">Disponível</SelectItem>
<SelectItem value="emprestado">Emprestado</SelectItem>
<SelectItem value="fixo">Fixo</SelectItem>
<SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-gray-500"
                >
                  {searchTerm || statusFilter !== 'all'
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
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                  className="cursor-pointer"
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
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          className={`${isMobile ? 'w-[95vw] h-[95vh] max-w-none' : 'sm:max-w-2xl max-h-[90vh]'} flex flex-col p-0`}
        >
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <DialogTitle>Editar Chromebook</DialogTitle>
            <DialogDescription>
              Atualize as informações do Chromebook. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          {editingChromebook && (
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <div className={`space-y-${isMobile ? '3' : '4'}`}>
                {/* Informações Básicas */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Informações Básicas</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="id" className="text-xs font-medium">ID do Chromebook *</Label>
                      <Input
                        id="id"
                        value={editingChromebook.id}
                        onChange={handleEditChange}
                        disabled
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="patrimonyNumber" className="text-xs font-medium">Patrimônio</Label>
                      <Input
                        id="patrimonyNumber"
                        value={editingChromebook.patrimonyNumber || ""}
                        onChange={handleEditChange}
                        placeholder="Número do patrimônio"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="manufacturer" className="text-xs font-medium">Fabricante *</Label>
                      <Input
                        id="manufacturer"
                        value={editingChromebook.manufacturer}
                        onChange={handleEditChange}
                        placeholder="Ex: Lenovo, HP, Dell"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="model" className="text-xs font-medium">Modelo *</Label>
                      <Input
                        id="model"
                        value={editingChromebook.model}
                        onChange={handleEditChange}
                        placeholder="Ex: Chromebook 14e"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="series" className="text-xs font-medium">Série *</Label>
                      <Input
                        id="series"
                        value={editingChromebook.series}
                        onChange={handleEditChange}
                        placeholder="Número de série"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="manufacturingYear" className="text-xs font-medium">Ano de Fabricação</Label>
                      <Input
                        id="manufacturingYear"
                        value={editingChromebook.manufacturingYear || ""}
                        onChange={handleEditChange}
                        placeholder="Ex: 2023"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Status e Configurações */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Status e Configurações</h4>
                  
<div className="space-y-1.5">
  <Label className="text-xs font-medium">Status</Label>
  <Select value={editingChromebook.status} onValueChange={handleEditStatusChange}>
    <SelectTrigger className="h-9">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="disponivel">Disponível</SelectItem>
      <SelectItem value="emprestado">Emprestado</SelectItem>
      <SelectItem value="fixo" disabled={!isAdmin}>Fixo</SelectItem>
      <SelectItem value="inativo">Inativo</SelectItem>
    </SelectContent>
  </Select>
</div>

                  <div className="flex items-start space-x-3 pt-1">
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
                        className="font-medium text-xs cursor-pointer"
                      >
                        Equipamento Provisionado
                      </Label>
                      <p className="text-xs text-gray-500">
                        Marque se o Chromebook já está provisionado no console
                      </p>
                    </div>
                  </div>

<div className="space-y-1.5">
  <Label htmlFor="classroom" className="text-xs font-medium">Sala de Aula</Label>
  <Input
    id="classroom"
    value={editingChromebook.classroom || ''}
    onChange={handleEditChange}
    placeholder="Ex.: Sala 21"
    className="h-9"
  />
</div>
                </div>

                {/* Observações */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Observações</h4>
                  
                  <div className="space-y-1.5">
                    <Textarea
                      id="observations"
                      value={editingChromebook.observations || ""}
                      onChange={handleEditChange}
                      placeholder="Digite observações relevantes sobre o equipamento"
                      className={`resize-none ${isMobile ? 'min-h-[60px]' : 'min-h-[80px]'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fixed Footer */}
          <div className={`px-4 py-3 border-t bg-white shrink-0 ${isMobile ? 'space-y-2' : 'flex justify-end space-x-2'}`}>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingChromebook(null);
              }}
              className={`${isMobile ? 'w-full' : ''} h-9`}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className={`${isMobile ? 'w-full' : ''} h-9`}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o Chromebook <strong>{chromebookToDelete?.patrimonyNumber || chromebookToDelete?.id}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setChromebookToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <QRCodeModal
        open={!!showQRCode}
        onOpenChange={(open) => setShowQRCode(open ? showQRCode : null)}
        chromebookId={showQRCode || ""}
        chromebookData={showQRCode ? chromebooks.find(c => (c.patrimonyNumber || c.id) === showQRCode) : undefined}
        showSuccess={false}
      />
    </div>
  );
}
