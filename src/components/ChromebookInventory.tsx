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
import { toast } from "./ui/use-toast";
import { Search, Filter, Edit3, QrCode, CheckCircle, AlertCircle, XCircle, Clock, RefreshCw, Download, Trash2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { useProfileRole } from "@/hooks/use-profile-role";
import { supabase } from "@/integrations/supabase/client";
import { useDatabase } from "@/hooks/useDatabase";
import type { Chromebook } from "@/types/database";
import { InventoryStats } from "./InventoryStats";
import { GlassCard } from "./ui/GlassCard";
import { ChromebookEditDialog } from "./ChromebookEditDialog"; // NOVO IMPORT
import { ChromebookDeleteDialog } from "./ChromebookDeleteDialog"; // NOVO IMPORT

// Interface para o estado interno do formulário de edição (mantida para consistência)
interface ChromebookDataExtended extends Chromebook {
  classroom?: string;
  manufacturer?: string;
  is_deprovisioned?: boolean;
}

interface ChromebookInventoryProps {
  onBack?: () => void;
  onGenerateQrCode: (chromebookId: string) => void;
}

export function ChromebookInventory({ onBack, onGenerateQrCode }: ChromebookInventoryProps) {
  const { isAdmin } = useProfileRole();
  const { getChromebooks, updateChromebook } = useDatabase();
  
  const [chromebooks, setChromebooks] = useState<ChromebookDataExtended[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Estados para Diálogos
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<ChromebookDataExtended | null>(null);
  const [chromebookToDelete, setChromebookToDelete] = useState<ChromebookDataExtended | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isFetching, setIsFetching] = useState(false);

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
        return { color: 'text-gray-600 bg-gray-200', icon: XCircle, label: 'Inativo' };
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

    if ((newStatus === 'fixo' || newStatus === 'fora_uso') && !isAdmin) {
      toast({ title: 'Permissão negada', description: 'Apenas administradores podem marcar como Fixo ou Inativo.', variant: 'destructive' });
      return;
    }
    
    const isDeprovisioned = newStatus === 'fora_uso';

    const success = await updateChromebook(chromebookId, { 
      status: newStatus as any,
      is_deprovisioned: isDeprovisioned,
    });

    if (success) {
      toast({
        title: "Status atualizado",
        description: `Status do Chromebook alterado para ${getStatusInfo(newStatus).label}`,
      });
    }
  };

  // Handle edit click
  const handleEditClick = (chromebook: ChromebookDataExtended) => {
    setEditingChromebook(chromebook);
    setIsEditDialogOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (chromebook: ChromebookDataExtended) => {
    if (!isAdmin) {
      toast({ title: 'Permissão negada', description: 'Apenas administradores podem excluir equipamentos.', variant: 'destructive' });
      return;
    }
    setChromebookToDelete(chromebook);
    setIsDeleteDialogOpen(true);
  };
  
  // Função de callback para o diálogo de exclusão
  const handleDeleteSuccess = () => {
    // O Real-time já cuida da atualização, mas limpamos o estado do modal
    setChromebookToDelete(null);
  };

  return (
    <div className="p-0 glass-morphism animate-fade-in relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-3xl blur-2xl transform scale-110" />
      
      {/* Estatísticas e Gráfico */}
      <InventoryStats chromebooks={chromebooks} />

      {/* Painel de Busca e Filtros */}
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
              <TableHead className="w-[150px] hidden sm:table-cell">Fabricante</TableHead>
              <TableHead className="flex-1">Modelo</TableHead>
              <TableHead className="w-[150px] hidden md:table-cell">Série</TableHead>
              <TableHead className="w-[120px]">Status</TableHead> 
              <TableHead className="w-[180px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChromebooks.length > 0 ? (
              paginatedChromebooks.map((chromebook) => {
                const statusInfo = getStatusInfo(chromebook.status);
                const StatusIcon = statusInfo.icon;
                
                const mobilityStatus = chromebook.status === 'fixo' 
                  ? 'Fixo' 
                  : chromebook.status === 'fora_uso' 
                    ? 'Inativo' 
                    : 'Móvel';
                
                const mobilityColor = mobilityStatus === 'Fixo' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800' 
                  : mobilityStatus === 'Inativo' 
                    ? 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                    : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800';

                return (
                  <TableRow key={chromebook.id}>
                    <TableCell className="font-medium text-xs">
                      {chromebook.chromebook_id}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{chromebook.manufacturer || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{chromebook.model}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${mobilityColor} sm:hidden`}>
                          {mobilityStatus}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{chromebook.serial_number || 'N/A'}</TableCell>
                    <TableCell>
                      <div className={`inline-flex flex-col items-start gap-1 text-xs font-medium`}>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.color} dark:text-foreground dark:bg-card/50`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                        {chromebook.status === 'fixo' && chromebook.classroom && (
                          <span className="ml-1 text-[10px] text-blue-700 dark:text-blue-400">({chromebook.classroom})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onGenerateQrCode(chromebook.chromebook_id)}
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
                          disabled={!isAdmin}
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

      {/* Edit Dialog (Agora um componente externo) */}
      <ChromebookEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        chromebook={editingChromebook}
      />

      {/* Delete Confirmation Dialog (Agora um componente externo) */}
      <ChromebookDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        chromebook={chromebookToDelete}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}