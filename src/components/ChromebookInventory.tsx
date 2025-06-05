import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, Plus, Search, Filter, Save, X, Monitor, Hash, FileText, MapPin, Calendar, StickyNote } from "lucide-react";
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
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

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
    console.log('Opening edit modal for:', chromebook.id);
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

      {/* EDIT INTERFACE - Mobile Sheet optimized for PWA */}
      {isMobile ? (
        <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <SheetContent 
            side="bottom" 
            className="h-[100dvh] max-h-[100dvh] p-0 bg-white border-0 rounded-t-2xl fixed inset-x-0 bottom-0 z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              height: '100vh',
              maxHeight: '100vh',
              width: '100vw',
              borderRadius: 0,
            }}
          >
            <div className="flex flex-col h-full bg-white">
              {/* Fixed Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0 safe-area-top">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Editar Chromebook</h2>
                      <p className="text-blue-100 text-sm">ID: {editingChromebook?.id}</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
                    onClick={handleSaveEdit}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-4 space-y-4 pb-8">
                  {/* Basic Information */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Hash className="h-4 w-4 mr-2 text-blue-600" />
                      Informações Básicas
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">ID *</Label>
                        <Input
                          value={editingChromebook?.id || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            id: e.target.value
                          })}
                          className="mt-1"
                          placeholder="Ex: CHR001"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Marca *</Label>
                          <Input
                            value={editingChromebook?.brand || ''}
                            onChange={(e) => editingChromebook && setEditingChromebook({
                              ...editingChromebook,
                              brand: e.target.value
                            })}
                            className="mt-1"
                            placeholder="Ex: Acer"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Modelo *</Label>
                          <Input
                            value={editingChromebook?.model || ''}
                            onChange={(e) => editingChromebook && setEditingChromebook({
                              ...editingChromebook,
                              model: e.target.value
                            })}
                            className="mt-1"
                            placeholder="Ex: CB314"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-green-600" />
                      Detalhes Técnicos
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Número de Série *</Label>
                        <Input
                          value={editingChromebook?.serialNumber || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            serialNumber: e.target.value
                          })}
                          className="mt-1"
                          placeholder="Ex: ABC123456789"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Patrimônio *</Label>
                        <Input
                          value={editingChromebook?.patrimony || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            patrimony: e.target.value
                          })}
                          className="mt-1"
                          placeholder="Ex: PAT001"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status *</Label>
                        <Select
                          value={editingChromebook?.status || 'disponivel'}
                          onValueChange={(value: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado') => 
                            editingChromebook && setEditingChromebook({
                              ...editingChromebook,
                              status: value
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disponivel">🟢 Disponível</SelectItem>
                            <SelectItem value="emprestado">🔵 Emprestado</SelectItem>
                            <SelectItem value="manutencao">🟡 Manutenção</SelectItem>
                            <SelectItem value="danificado">🔴 Danificado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Location & Additional Info */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                      Informações Adicionais
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Local</Label>
                        <Input
                          value={editingChromebook?.location || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            location: e.target.value
                          })}
                          className="mt-1"
                          placeholder="Ex: Sala 101"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Data de Aquisição
                        </Label>
                        <Input
                          type="date"
                          value={editingChromebook?.acquisitionDate || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            acquisitionDate: e.target.value
                          })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <StickyNote className="h-3 w-3 mr-1" />
                          Observações
                        </Label>
                        <Textarea
                          value={editingChromebook?.notes || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            notes: e.target.value
                          })}
                          className="mt-1 min-h-[80px] resize-none"
                          placeholder="Observações adicionais..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop Edit Dialog */
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl mx-auto max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg -m-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Editar Chromebook</DialogTitle>
                  <DialogDescription className="text-blue-100">
                    Atualize as informações do dispositivo
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <ScrollArea className="flex-1 pr-4">
              {/* ... keep existing code (desktop edit form content) */}
              <div className="space-y-6">
                {/* Basic Information Card */}
                <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-gray-800">
                      <Hash className="h-5 w-5 mr-2 text-blue-600" />
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-id-desktop" className="text-gray-700 font-medium">ID do Chromebook *</Label>
                        <Input
                          id="edit-id-desktop"
                          value={editingChromebook?.id || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            id: e.target.value
                          })}
                          placeholder="Ex: CHR001"
                          className="border-gray-200 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-brand-desktop" className="text-gray-700 font-medium">Marca *</Label>
                        <Input
                          id="edit-brand-desktop"
                          value={editingChromebook?.brand || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            brand: e.target.value
                          })}
                          placeholder="Ex: Acer, HP, Lenovo"
                          className="border-gray-200 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-model-desktop" className="text-gray-700 font-medium">Modelo *</Label>
                      <Input
                        id="edit-model-desktop"
                        value={editingChromebook?.model || ''}
                        onChange={(e) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          model: e.target.value
                        })}
                        placeholder="Ex: Chromebook 314"
                        className="border-gray-200 focus:border-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Details Card */}
                <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-gray-800">
                      <FileText className="h-5 w-5 mr-2 text-green-600" />
                      Detalhes Técnicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-serial-desktop" className="text-gray-700 font-medium">Número de Série *</Label>
                        <Input
                          id="edit-serial-desktop"
                          value={editingChromebook?.serialNumber || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            serialNumber: e.target.value
                          })}
                          placeholder="Ex: ABC123456789"
                          className="border-gray-200 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-patrimony-desktop" className="text-gray-700 font-medium">Patrimônio *</Label>
                        <Input
                          id="edit-patrimony-desktop"
                          value={editingChromebook?.patrimony || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            patrimony: e.target.value
                          })}
                          placeholder="Ex: PAT001"
                          className="border-gray-200 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-status-desktop" className="text-gray-700 font-medium">Status *</Label>
                      <Select
                        value={editingChromebook?.status || 'disponivel'}
                        onValueChange={(value: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado') => 
                          editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            status: value
                          })
                        }
                      >
                        <SelectTrigger className="border-gray-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">🟢 Disponível</SelectItem>
                          <SelectItem value="emprestado">🔵 Emprestado</SelectItem>
                          <SelectItem value="manutencao">🟡 Manutenção</SelectItem>
                          <SelectItem value="danificado">🔴 Danificado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Location & Additional Info Card */}
                <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-gray-800">
                      <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                      Localização e Informações Adicionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-location-desktop" className="text-gray-700 font-medium">Local</Label>
                        <Input
                          id="edit-location-desktop"
                          value={editingChromebook?.location || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            location: e.target.value
                          })}
                          placeholder="Ex: Sala 101"
                          className="border-gray-200 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-acquisition-desktop" className="text-gray-700 font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Data de Aquisição
                        </Label>
                        <Input
                          id="edit-acquisition-desktop"
                          type="date"
                          value={editingChromebook?.acquisitionDate || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            acquisitionDate: e.target.value
                          })}
                          className="border-gray-200 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-notes-desktop" className="text-gray-700 font-medium flex items-center">
                        <StickyNote className="h-4 w-4 mr-1" />
                        Observações
                      </Label>
                      <Textarea
                        id="edit-notes-desktop"
                        value={editingChromebook?.notes || ''}
                        onChange={(e) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          notes: e.target.value
                        })}
                        placeholder="Observações adicionais..."
                        className="min-h-[80px] border-gray-200 focus:border-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Salvar Alterações
              </Button>
            </DialogFooter>
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
