import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, Plus, Search, Filter, Save, X } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface Chromebook {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  patrimony: string;
  status: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado';
  location?: string;
  acquisitionDate?: string;
  notes?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'disponivel':
      return 'bg-green-100 text-green-800';
    case 'emprestado':
      return 'bg-blue-100 text-blue-800';
    case 'manutencao':
      return 'bg-yellow-100 text-yellow-800';
    case 'danificado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'disponivel':
      return 'Disponível';
    case 'emprestado':
      return 'Emprestado';
    case 'manutencao':
      return 'Manutenção';
    case 'danificado':
      return 'Danificado';
    default:
      return status;
  }
};

export function ChromebookInventory({ onBack }: { onBack: () => void }) {
  const { isMobile } = useMobile();
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [filteredChromebooks, setFilteredChromebooks] = useState<Chromebook[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<Chromebook | null>(null);
  const [newChromebook, setNewChromebook] = useState<Partial<Chromebook>>({
    brand: '',
    model: '',
    serialNumber: '',
    patrimony: '',
    status: 'disponivel',
    location: '',
    acquisitionDate: '',
    notes: ''
  });

  useEffect(() => {
    const savedChromebooks = localStorage.getItem('chromebooks');
    if (savedChromebooks) {
      const parsed = JSON.parse(savedChromebooks);
      setChromebooks(parsed);
      setFilteredChromebooks(parsed);
    }
  }, []);

  useEffect(() => {
    let filtered = chromebooks;

    if (searchTerm) {
      filtered = filtered.filter(chromebook =>
        chromebook.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.patrimony.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(chromebook => chromebook.status === statusFilter);
    }

    setFilteredChromebooks(filtered);
  }, [chromebooks, searchTerm, statusFilter]);

  const handleAddChromebook = () => {
    if (!newChromebook.id || !newChromebook.brand || !newChromebook.model || 
        !newChromebook.serialNumber || !newChromebook.patrimony) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (chromebooks.some(cb => cb.id === newChromebook.id)) {
      toast({
        title: "Erro",
        description: "ID já existe no sistema",
        variant: "destructive",
      });
      return;
    }

    const chromebook: Chromebook = {
      id: newChromebook.id!,
      brand: newChromebook.brand!,
      model: newChromebook.model!,
      serialNumber: newChromebook.serialNumber!,
      patrimony: newChromebook.patrimony!,
      status: newChromebook.status || 'disponivel',
      location: newChromebook.location,
      acquisitionDate: newChromebook.acquisitionDate,
      notes: newChromebook.notes
    };

    const updatedChromebooks = [...chromebooks, chromebook];
    setChromebooks(updatedChromebooks);
    localStorage.setItem('chromebooks', JSON.stringify(updatedChromebooks));
    
    setNewChromebook({
      brand: '',
      model: '',
      serialNumber: '',
      patrimony: '',
      status: 'disponivel',
      location: '',
      acquisitionDate: '',
      notes: ''
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Chromebook adicionado com sucesso",
    });
  };

  const handleEditChromebook = (chromebook: Chromebook) => {
    setEditingChromebook({ ...chromebook });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingChromebook) return;

    if (!editingChromebook.id || !editingChromebook.brand || !editingChromebook.model || 
        !editingChromebook.serialNumber || !editingChromebook.patrimony) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const updatedChromebooks = chromebooks.map(cb => 
      cb.id === editingChromebook.id ? editingChromebook : cb
    );
    
    setChromebooks(updatedChromebooks);
    localStorage.setItem('chromebooks', JSON.stringify(updatedChromebooks));
    setIsEditDialogOpen(false);
    setEditingChromebook(null);
    
    toast({
      title: "Sucesso",
      description: "Chromebook atualizado com sucesso",
    });
  };

  const handleDeleteChromebook = (id: string) => {
    const updatedChromebooks = chromebooks.filter(cb => cb.id !== id);
    setChromebooks(updatedChromebooks);
    localStorage.setItem('chromebooks', JSON.stringify(updatedChromebooks));
    
    toast({
      title: "Sucesso",
      description: "Chromebook removido com sucesso",
    });
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingChromebook(null);
  };

  // Componente do formulário de edição
  const EditForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-id">ID do Chromebook *</Label>
        <Input
          id="edit-id"
          value={editingChromebook?.id || ''}
          onChange={(e) => editingChromebook && setEditingChromebook({
            ...editingChromebook,
            id: e.target.value
          })}
          placeholder="Ex: CHR001"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-brand">Marca *</Label>
        <Input
          id="edit-brand"
          value={editingChromebook?.brand || ''}
          onChange={(e) => editingChromebook && setEditingChromebook({
            ...editingChromebook,
            brand: e.target.value
          })}
          placeholder="Ex: Acer, HP, Lenovo"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-model">Modelo *</Label>
        <Input
          id="edit-model"
          value={editingChromebook?.model || ''}
          onChange={(e) => editingChromebook && setEditingChromebook({
            ...editingChromebook,
            model: e.target.value
          })}
          placeholder="Ex: Chromebook 314"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-serial">Número de Série *</Label>
        <Input
          id="edit-serial"
          value={editingChromebook?.serialNumber || ''}
          onChange={(e) => editingChromebook && setEditingChromebook({
            ...editingChromebook,
            serialNumber: e.target.value
          })}
          placeholder="Ex: ABC123456789"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-patrimony">Patrimônio *</Label>
        <Input
          id="edit-patrimony"
          value={editingChromebook?.patrimony || ''}
          onChange={(e) => editingChromebook && setEditingChromebook({
            ...editingChromebook,
            patrimony: e.target.value
          })}
          placeholder="Ex: PAT001"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-status">Status *</Label>
        <Select
          value={editingChromebook?.status || 'disponivel'}
          onValueChange={(value: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado') => 
            editingChromebook && setEditingChromebook({
              ...editingChromebook,
              status: value
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="emprestado">Emprestado</SelectItem>
            <SelectItem value="manutencao">Manutenção</SelectItem>
            <SelectItem value="danificado">Danificado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-location">Local</Label>
        <Input
          id="edit-location"
          value={editingChromebook?.location || ''}
          onChange={(e) => editingChromebook && setEditingChromebook({
            ...editingChromebook,
            location: e.target.value
          })}
          placeholder="Ex: Sala 101"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-acquisition">Data de Aquisição</Label>
        <Input
          id="edit-acquisition"
          type="date"
          value={editingChromebook?.acquisitionDate || ''}
          onChange={(e) => editingChromebook && setEditingChromebook({
            ...editingChromebook,
            acquisitionDate: e.target.value
          })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-notes">Observações</Label>
        <Textarea
          id="edit-notes"
          value={editingChromebook?.notes || ''}
          onChange={(e) => editingChromebook && setEditingChromebook({
            ...editingChromebook,
            notes: e.target.value
          })}
          placeholder="Observações adicionais..."
          className="w-full min-h-[80px]"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inventário de Chromebooks
            </h1>
            <p className="text-gray-600">
              Gerencie todos os Chromebooks cadastrados
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Chromebook
        </Button>
      </div>

      {/* Filters and Search Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por ID, marca, modelo, número de série..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="emprestado">Emprestado</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="danificado">Danificado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {chromebooks.filter(cb => cb.status === 'disponivel').length}
            </div>
            <p className="text-sm text-gray-600">Disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {chromebooks.filter(cb => cb.status === 'emprestado').length}
            </div>
            <p className="text-sm text-gray-600">Emprestados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {chromebooks.filter(cb => cb.status === 'manutencao').length}
            </div>
            <p className="text-sm text-gray-600">Manutenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {chromebooks.filter(cb => cb.status === 'danificado').length}
            </div>
            <p className="text-sm text-gray-600">Danificados</p>
          </CardContent>
        </Card>
      </div>

      {/* Chromebooks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChromebooks.map((chromebook) => (
          <Card key={chromebook.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{chromebook.id}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {chromebook.brand} {chromebook.model}
                  </p>
                </div>
                <Badge className={getStatusColor(chromebook.status)}>
                  {getStatusLabel(chromebook.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Serial:</span> {chromebook.serialNumber}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Patrimônio:</span> {chromebook.patrimony}
                </p>
                {chromebook.location && (
                  <p className="text-sm">
                    <span className="font-medium">Local:</span> {chromebook.location}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditChromebook(chromebook)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteChromebook(chromebook.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChromebooks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum Chromebook encontrado</p>
        </div>
      )}

      {/* Mobile Edit Sheet */}
      {isMobile ? (
        <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <SheetContent 
            side="bottom" 
            className="h-[90vh] flex flex-col p-0"
          >
            {/* Fixed Header with Action Buttons */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <SheetTitle className="text-lg font-semibold">Editar Chromebook</SheetTitle>
                  <SheetDescription className="text-sm text-gray-600">
                    Atualize as informações do Chromebook
                  </SheetDescription>
                </div>
              </div>
              
              {/* Action Buttons - Always visible at top */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <EditForm />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop Edit Dialog */
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-hidden flex flex-col">
            {/* Fixed Header with Action Buttons */}
            <div className="bg-white border-b border-gray-200 pb-4 flex-shrink-0">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-lg font-semibold">Editar Chromebook</DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Atualize as informações do Chromebook
                </DialogDescription>
              </DialogHeader>
              
              {/* Action Buttons - Always visible at top */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4">
              <EditForm />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Chromebook</DialogTitle>
            <DialogDescription>
              Cadastre um novo Chromebook no inventário
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-id">ID do Chromebook *</Label>
              <Input
                id="new-id"
                value={newChromebook.id || ''}
                onChange={(e) => setNewChromebook({
                  ...newChromebook,
                  id: e.target.value
                })}
                placeholder="Ex: CHR001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-brand">Marca *</Label>
              <Input
                id="new-brand"
                value={newChromebook.brand || ''}
                onChange={(e) => setNewChromebook({
                  ...newChromebook,
                  brand: e.target.value
                })}
                placeholder="Ex: Acer, HP, Lenovo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-model">Modelo *</Label>
              <Input
                id="new-model"
                value={newChromebook.model || ''}
                onChange={(e) => setNewChromebook({
                  ...newChromebook,
                  model: e.target.value
                })}
                placeholder="Ex: Chromebook 314"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-serial">Número de Série *</Label>
              <Input
                id="new-serial"
                value={newChromebook.serialNumber || ''}
                onChange={(e) => setNewChromebook({
                  ...newChromebook,
                  serialNumber: e.target.value
                })}
                placeholder="Ex: ABC123456789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-patrimony">Patrimônio *</Label>
              <Input
                id="new-patrimony"
                value={newChromebook.patrimony || ''}
                onChange={(e) => setNewChromebook({
                  ...newChromebook,
                  patrimony: e.target.value
                })}
                placeholder="Ex: PAT001"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddChromebook}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
