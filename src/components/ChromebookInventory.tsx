import { useState, useEffect, useCallback } from "react";
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
import { Search, ArrowLeft, Filter, Edit3, QrCode, CheckCircle, AlertCircle, XCircle, MapPin, Eye, X, Trash2, Save, AlertTriangle, Clock, Tag, Factory, Hash, Map, RefreshCw, Download } from "lucide-react";
import { QRCodeModal } from "./QRCodeModal";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useProfileRole } from "@/hooks/use-profile-role";
import { supabase } from "@/integrations/supabase/client";
import { useDatabase } from "@/hooks/useDatabase"; // Importando useDatabase
import type { Chromebook, ChromebookData } from "@/types/database";
import { InventoryStats } from "./InventoryStats"; // Importando o novo componente de estatísticas
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard

// Interface for Chromebook data structure (matching database)
interface ChromebookDataExtended extends Chromebook {
  // Adicionando campos que podem ser usados no formulário de edição
  classroom?: string;
  manufacturer?: string;
  is_deprovisioned?: boolean; // Adicionado para consistência
}


interface ChromebookInventoryProps {
  onBack?: () => void;
}

export function ChromebookInventory({ onBack }: ChromebookInventoryProps) {
  // Removido useIsMobile
  const { isAdmin } = useProfileRole();
  const { getChromebooks, updateChromebook, deleteChromebook } = useDatabase(); // Usando useDatabase
  
  // State for storing all Chromebooks
  const [chromebooks, setChromebooks] = useState<ChromebookDataExtended[]>([]);
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // State for QR Code dialog
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  // State for the Chromebook being edited
  const [editingChromebook, setEditingChromebook] = useState<ChromebookDataExtended | null>(null);
  // State for the Chromebook being deleted
  const [chromebookToDelete, setChromebookToDelete] = useState<ChromebookDataExtended | null>(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isFetching, setIsFetching] = useState(false); // Novo estado para o loading da busca

  // Função para carregar Chromebooks
  const fetchChromebooks = useCallback(async () => {
    setIsFetching(true);
    try {
      const data = await getChromebooks();
      setChromebooks(data as ChromebookDataExtended[]);
    } catch (e) {
      // O toast de erro já é tratado no useDatabase
    } finally {
      setIsFetching(false);
    }
  }, [getChromebooks]);

// Load Chromebooks from Supabase on component mount
useEffect(() => {
  fetchChromebooks();
}, [fetchChromebooks]);

// Real-time synchronization
useEffect(() => {
  const channel = supabase
    .channel('chromebooks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chromebooks'
      },
      (payload) => {
        console.log('Realtime change received:', payload);
        
        if (payload.eventType === 'INSERT') {
          setChromebooks(prev => [payload.new as ChromebookDataExtended, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setChromebooks(prev => 
            prev.map(cb => 
              cb.id === payload.new.id ? payload.new as ChromebookDataExtended : cb
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setChromebooks(prev => 
            prev.filter(cb => cb.id !== payload.old.id)
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  // Filter Chromebooks based on search term and status
  const filteredChromebooks = chromebooks.filter((chromebook) => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    
    const matchesSearch = 
      chromebook.chromebook_id.toLowerCase().includes(lowerCaseSearch) ||
      String(chromebook.patrimony_number || '').toLowerCase().includes(lowerCaseSearch) ||
      chromebook.model.toLowerCase().includes(lowerCaseSearch) ||
      String(chromebook.serial_number || '').toLowerCase().includes(lowerCaseSearch) ||
      String(chromebook.location || '').toLowerCase().includes(lowerCaseSearch) ||
      String(chromebook.manufacturer || '').toLowerCase().includes(lowerCaseSearch) ||
      String(chromebook.classroom || '').toLowerCase().includes(lowerCaseSearch);
    
    const matchesStatus = statusFilter === 'all' || chromebook.status === statusFilter;

    return matchesSearch && matchesStatus;
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
        return { color: 'text-yellow-600 bg-yellow-50', icon: Clock, label: 'Emprestado' };
      case 'fixo':
        return { color: 'text-blue-600 bg-blue-50', icon: MapPin, label: 'Fixo' };
      case 'manutencao':
        return { color: 'text-red-600 bg-red-50', icon: AlertTriangle, label: 'Manutenção' };
      case 'fora_uso':
        return { color: 'text-gray-600 bg-gray-200', icon: XCircle, label: 'Inativo' }; // Alterado para Inativo
      default:
        return { color: 'text-gray-600 bg-gray-50', icon: XCircle, label: 'Desconhecido' };
    }
  };

// Handle status change
const handleStatusChange = async (chromebookId: string, newStatus: string) => {
  if (newStatus === 'emprestado') {
    toast({
      title: "Atenção",
      description: "Para emprestar um Chromebook, use a seção de Empréstimos",
      variant: "destructive",
    });
    return;
  }

  // Only admins can set FIXO or FORA_USO
  if ((newStatus === 'fixo' || newStatus === 'fora_uso') && !isAdmin) {
    toast({ title: 'Permissão negada', description: 'Apenas administradores podem marcar como Fixo ou Inativo.', variant: 'destructive' });
    return;
  }
  
  // Se o status for 'fora_uso', definimos is_deprovisioned como true
  const isDeprovisioned = newStatus === 'fora_uso';

  // Usar a função centralizada do useDatabase
  const success = await updateChromebook(chromebookId, { 
    status: newStatus as any,
    is_deprovisioned: isDeprovisioned, // Atualiza o campo de desprovisionamento
  });

  if (success) {
    // A atualização do estado local será tratada pelo Real-time, mas podemos fazer uma atualização otimista
    // para feedback imediato, embora o Real-time garanta a consistência.
    // Vamos confiar no Real-time para evitar duplicação de lógica de estado.
    toast({
      title: "Status atualizado",
      description: `Status do Chromebook alterado para ${getStatusInfo(newStatus).label}`,
    });
  }
};

  // Handle edit click
  const handleEditClick = (chromebook: ChromebookDataExtended) => {
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

  // Handle condition change
  const handleConditionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingChromebook) return;

    setEditingChromebook({
      ...editingChromebook,
      condition: e.target.value,
    });
  };

  // Handle status change in edit dialog
  const handleEditStatusChange = (value: string) => {
    if (!editingChromebook) return;

    setEditingChromebook({
      ...editingChromebook,
      status: value as ChromebookDataExtended['status'],
      // Se o status for 'fora_uso', marca como desprovisionado no formulário de edição
      is_deprovisioned: value === 'fora_uso',
    });
  };
  
  // Handle is_deprovisioned checkbox change in edit dialog
  const handleDeprovisionedChange = (checked: boolean) => {
    if (!editingChromebook) return;
    
    // Se marcar como desprovisionado, o status deve ser 'fora_uso'
    const newStatus = checked ? 'fora_uso' : 'disponivel';

    setEditingChromebook({
      ...editingChromebook,
      is_deprovisioned: checked,
      status: newStatus,
    });
  };


  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingChromebook) return;

    // Validate required fields
    if (!editingChromebook.chromebook_id || !editingChromebook.model) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const updatePayload: Partial<ChromebookData> = {
      chromebookId: editingChromebook.chromebook_id,
      model: editingChromebook.model,
      manufacturer: editingChromebook.manufacturer,
      serialNumber: editingChromebook.serial_number,
      patrimonyNumber: editingChromebook.patrimony_number,
      status: editingChromebook.status,
      condition: editingChromebook.condition,
      location: editingChromebook.location,
      classroom: editingChromebook.classroom,
      is_deprovisioned: editingChromebook.is_deprovisioned, // Incluindo o novo campo
    };

    // Usar a função centralizada do useDatabase
    const success = await updateChromebook(editingChromebook.id, updatePayload);

    if (success) {
      setIsEditDialogOpen(false);
      setEditingChromebook(null);
      // O Real-time cuidará da atualização do estado local
    }
  };

  // Handle delete click
  const handleDeleteClick = (chromebook: ChromebookDataExtended) => {
    setChromebookToDelete(chromebook);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!chromebookToDelete) return;

    // Usar a função centralizada do useDatabase
    const success = await deleteChromebook(chromebookToDelete.id);

    if (success) {
      setIsDeleteDialogOpen(false);
      setChromebookToDelete(null);
      // O Real-time cuidará da atualização do estado local
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="p-0 glass-morphism animate-fade-in relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      {/* Estatísticas e Gráfico */}
      <InventoryStats chromebooks={chromebooks} />

      {/* Painel de Busca e Filtros (NOVO GLASS CARD) */}
      <GlassCard className="mb-6 p-4 relative z-10">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          
          {/* Campo de Busca */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID, patrimônio, modelo, série, fabricante ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtro de Status */}
          <div className="relative w-full sm:w-[180px]">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="emprestado">Emprestado</SelectItem>
                <SelectItem value="fixo">Fixo</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="fora_uso">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={fetchChromebooks}
              variant="outline"
              disabled={isFetching}
              title="Atualizar dados"
              className="px-3"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => toast({ title: "Backup", description: "Funcionalidade de backup em desenvolvimento.", variant: "info" })}
              variant="outline"
              title="Fazer backup"
              className="px-3"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-4">
          Resultados: {filteredChromebooks.length} Chromebooks
        </div>
      </GlassCard>

      {/* Table of Chromebooks */}
      <GlassCard className="border-white/30 rounded-2xl overflow-hidden relative z-10 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead className="w-[150px]">Fabricante</TableHead>
              <TableHead className="flex-1">Modelo</TableHead>
              <TableHead className="w-[150px]">Série</TableHead>
              <TableHead className="hidden md:table-cell w-[120px]">Status</TableHead>
              <TableHead className="w-[180px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChromebooks.length > 0 ? (
              paginatedChromebooks.map((chromebook) => {
                const statusInfo = getStatusInfo(chromebook.status);
                const StatusIcon = statusInfo.icon;
                
                // Lógica para exibir "Móvel" ou "Fixo"
                const mobilityStatus = chromebook.status === 'fixo' 
                  ? 'Fixo' 
                  : chromebook.status === 'fora_uso' 
                    ? 'Inativo' 
                    : 'Móvel';
                
                const mobilityColor = mobilityStatus === 'Fixo' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : mobilityStatus === 'Inativo' 
                    ? 'bg-gray-200 text-gray-700 border-gray-300'
                    : 'bg-orange-50 text-orange-700 border-orange-200';

                return (
                  <TableRow key={chromebook.id}>
                    <TableCell className="font-medium text-xs">
                      {chromebook.chromebook_id}
                    </TableCell>
                    <TableCell>{chromebook.manufacturer || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {chromebook.model}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${mobilityColor}`}>
                          {mobilityStatus}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{chromebook.serial_number || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                        {chromebook.status === 'fixo' && chromebook.classroom && (
                          <span className="ml-1 text-[10px] text-blue-700">({chromebook.classroom})</span>
                        )}
                        {chromebook.is_deprovisioned && (
                          <span className="ml-1 text-[10px] text-gray-700">(Desprovisionado)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQRCode(chromebook.chromebook_id)}
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
                             <SelectItem value="emprestado" disabled={chromebook.status !== 'emprestado'}>Emprestado</SelectItem>
                             <SelectItem value="fixo">Fixo</SelectItem>
                             <SelectItem value="manutencao">Manutenção</SelectItem>
                             <SelectItem value="fora_uso">Inativo</SelectItem>
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
                  colSpan={8}
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
      </GlassCard>

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
          // ALTERAÇÃO AQUI: Aumentando max-w para 5xl
          className="w-[95vw] h-[95vh] max-w-none sm:w-full sm:max-w-5xl sm:max-h-[90vh] flex flex-col p-0"
        >
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Editar Chromebook
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do Chromebook. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          {editingChromebook && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              
              {/* Seção 1: Identificação e Modelo */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
                <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  Identificação e Modelo
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="chromebook_id" className="text-xs font-medium flex items-center gap-1">
                      ID do Chromebook *
                    </Label>
                    <Input
                      id="chromebook_id"
                      value={editingChromebook.chromebook_id}
                      className="h-10 bg-gray-200 cursor-not-allowed font-mono text-sm"
                      readOnly
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="patrimony_number" className="text-xs font-medium flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Patrimônio
                    </Label>
                    <Input
                      id="patrimony_number"
                      value={editingChromebook.patrimony_number || ""}
                      onChange={handleEditChange}
                      placeholder="Número do patrimônio"
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="serial_number" className="text-xs font-medium flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Número de Série
                    </Label>
                    <Input
                      id="serial_number"
                      value={editingChromebook.serial_number || ""}
                      onChange={handleEditChange}
                      placeholder="Número de série"
                      className="h-10"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="manufacturer" className="text-xs font-medium flex items-center gap-1">
                      <Factory className="h-3 w-3" /> Fabricante
                    </Label>
                    <Input
                      id="manufacturer"
                      value={editingChromebook.manufacturer || ""}
                      onChange={handleEditChange}
                      placeholder="Ex: Lenovo"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="model" className="text-xs font-medium">Modelo *</Label>
                    <Input
                      id="model"
                      value={editingChromebook.model}
                      onChange={handleEditChange}
                      placeholder="Ex: Chromebook 14e"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Status e Localização */}
              <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Status e Localização
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Status</Label>
                    <Select value={editingChromebook.status} onValueChange={handleEditStatusChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="emprestado" disabled>Emprestado (Apenas via Empréstimo)</SelectItem>
                        <SelectItem value="fixo" disabled={!isAdmin}>Fixo</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="fora_uso" disabled={!isAdmin}>Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs font-medium flex items-center gap-1">
                      <Map className="h-3 w-3" /> Localização Geral
                    </Label>
                    <Input
                      id="location"
                      value={editingChromebook.location || ""}
                      onChange={handleEditChange}
                      placeholder="Ex: Sala de informática"
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="classroom" className="text-xs font-medium">Sala de Aula (Fixo)</Label>
                    <Input
                      id="classroom"
                      value={editingChromebook.classroom || ''}
                      onChange={handleEditChange}
                      placeholder="Ex.: Sala 21"
                      className="h-10"
                    />
                  </div>
                </div>
                
                {/* Checkbox de Desprovisionamento */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                  <Checkbox 
                    id="is_deprovisioned" 
                    checked={editingChromebook.is_deprovisioned} 
                    onCheckedChange={(checked) => handleDeprovisionedChange(!!checked)}
                    disabled={!isAdmin}
                  />
                  <Label htmlFor="is_deprovisioned" className="text-sm font-medium cursor-pointer">
                    Desprovisionado (Marca o equipamento como Inativo/Fora de Uso)
                  </Label>
                </div>
              </div>

              {/* Seção 3: Condição/Observações */}
              <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Condição e Notas
                </h4>
                
                <div className="space-y-1.5">
                  <Label htmlFor="condition" className="text-xs font-medium">Condição/Observações</Label>
                  <Textarea
                    id="condition"
                    value={editingChromebook.condition || ""}
                    onChange={handleConditionChange}
                    placeholder="Digite observações sobre a condição do equipamento (ex: tela trincada, bateria fraca)"
                    className="resize-none min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-white shrink-0 flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingChromebook(null);
              }}
              className="w-full sm:w-auto h-10"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="w-full sm:w-auto h-10"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o Chromebook <strong>{chromebookToDelete?.patrimony_number || chromebookToDelete?.chromebook_id}</strong>?
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
        chromebookData={
          showQRCode
            ? (chromebooks.find(c => c.chromebook_id === showQRCode) ?? chromebooks.find(c => c.id === showQRCode))
            : undefined
        }
        showSuccess={false}
      />
    </div>
  );
}