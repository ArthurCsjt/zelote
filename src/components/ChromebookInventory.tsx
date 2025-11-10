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
import { toast } from "@/hooks/use-toast";
import { Search, Filter, Edit3, QrCode, CheckCircle, AlertCircle, XCircle, Clock, RefreshCw, Download, Trash2, MapPin, FileText, Loader2, AlertTriangle, Printer, ListChecks, X } from "lucide-react";
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
import { ChromebookEditDialog } from "./ChromebookEditDialog";
import { ChromebookDeleteDialog } from "./ChromebookDeleteDialog";
import Papa from 'papaparse';
import { useNavigate } from "react-router-dom";
import { usePrintContext } from "@/contexts/PrintContext";
import { Checkbox } from "./ui/checkbox"; // NOVO IMPORT

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
  const navigate = useNavigate();
  const { printItems, addItemToPrint, removeItemFromPrint, clearPrintItems } = usePrintContext(); // USANDO NOVAS FUNÇÕES
  
  const [chromebooks, setChromebooks] = useState<ChromebookDataExtended[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Estados para Diálogos
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<ChromebookDataExtended | null>(null);
  const [chromebookToDelete, setChromebookToDelete] = useState<ChromebookDataExtended | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // ALTERADO: Agora é um estado
  const [isFetching, setIsFetching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  // Reset pagination when filters or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

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
    
    const success = await updateChromebook(chromebookId, { 
      status: newStatus as any,
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
  
  // Função para exportar dados para CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // 1. Buscar todos os dados (sem paginação ou filtros de UI)
      const allData = await getChromebooks();
      
      if (allData.length === 0) {
        toast({ title: "Atenção", description: "Nenhum dado para exportar.", variant: "info" });
        return;
      }

      // 2. Preparar os dados para exportação (garantindo que todos os campos estejam presentes)
      const dataToExport = allData.map(cb => ({
        id: cb.id,
        chromebook_id: cb.chromebook_id,
        model: cb.model,
        manufacturer: cb.manufacturer || '',
        serial_number: cb.serial_number || '',
        patrimony_number: cb.patrimony_number || '',
        status: cb.status,
        condition: cb.condition || '',
        location: cb.location || '',
        classroom: cb.classroom || '',
        is_deprovisioned: cb.is_deprovisioned ? 'Sim' : 'Não',
        created_at: cb.created_at,
        updated_at: cb.updated_at,
      }));

      // 3. Converter para CSV
      const csv = Papa.unparse(dataToExport);

      // 4. Criar e baixar o arquivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_chromebooks_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Sucesso", description: "Inventário exportado para CSV." });

    } catch (e: any) {
      console.error('Erro ao exportar CSV:', e);
      toast({ title: "Erro de Exportação", description: "Falha ao gerar o arquivo CSV.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };
  
  // NOVO: Handler para impressão em lote
  const handleBatchPrint = () => {
    if (printItems.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos um Chromebook para imprimir.", variant: "info" });
      return;
    }
    
    navigate('/print-preview');
  };
  
  // Lógica de seleção de item
  const isItemSelected = (chromebookId: string) => printItems.some(item => item.id === chromebookId);
  
  const handleToggleItem = (chromebook: ChromebookDataExtended) => {
    if (isItemSelected(chromebook.id)) {
      removeItemFromPrint(chromebook.id);
    } else {
      addItemToPrint(chromebook);
    }
  };
  
  // Lógica de seleção de todos os itens da página
  const handleToggleAllOnPage = () => {
    const allOnPageSelected = paginatedChromebooks.every(cb => isItemSelected(cb.id));
    
    if (allOnPageSelected) {
      // Desseleciona todos da página
      paginatedChromebooks.forEach(cb => removeItemFromPrint(cb.id));
    } else {
      // Seleciona todos da página
      paginatedChromebooks.forEach(cb => {
        if (!isItemSelected(cb.id)) {
          addItemToPrint(cb);
        }
      });
    }
  };
  
  // Verifica se todos os itens da página estão selecionados
  const isAllOnPageSelected = paginatedChromebooks.length > 0 && paginatedChromebooks.every(cb => isItemSelected(cb.id));


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
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, patrimônio, modelo, série, fabricante ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // CORREÇÃO: Usando bg-input para o fundo do input
              className="pl-10 bg-input dark:bg-input" 
            />
          </div>
          
          {/* Filtro de Status */}
          <div className="relative w-full sm:w-[180px]">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              {/* CORREÇÃO: Usando bg-input para o fundo do select trigger */}
              <SelectTrigger className="w-full pl-10 bg-input dark:bg-input">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border"> {/* Adicionando classes de fundo e borda */}
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
            {/* Botão de Impressão em Lote */}
            <Button 
              onClick={handleBatchPrint}
              variant="outline"
              title={`Imprimir QR Codes em Lote (${printItems.length} itens)`}
              disabled={printItems.length === 0 || isFetching || isExporting}
              // CORREÇÃO: Usando bg-card/hover:bg-accent e garantindo cor do ícone
              className="px-3 bg-card hover:bg-accent dark:bg-card dark:hover:bg-accent relative"
            >
              <Printer className="h-4 w-4 text-primary dark:text-primary" />
              {printItems.length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {printItems.length}
                </span>
              )}
            </Button>
            
            <Button 
              onClick={fetchChromebooks}
              variant="outline"
              disabled={isFetching || isExporting}
              title="Atualizar dados"
              // CORREÇÃO: Usando bg-card/hover:bg-accent e garantindo cor do ícone
              className="px-3 bg-card hover:bg-accent dark:bg-card dark:hover:bg-accent"
            >
              <RefreshCw className={`h-4 w-4 text-primary dark:text-primary ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              title="Fazer backup (Exportar CSV)"
              disabled={isExporting || isFetching}
              // CORREÇÃO: Usando bg-card/hover:bg-accent e garantindo cor do ícone
              className="px-3 bg-card hover:bg-accent dark:bg-card dark:hover:bg-accent"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary dark:text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-primary dark:text-primary" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500 flex items-center gap-4">
            Resultados: {filteredChromebooks.length} Chromebooks
            
            {/* NOVO: Seletor de Itens por Página */}
            <div className="flex items-center gap-2">
                <span className="text-xs">Itens por página:</span>
                <Select 
                    value={String(itemsPerPage)} 
                    onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                    {/* CORREÇÃO: Usando bg-input para o fundo do select trigger */}
                    <SelectTrigger className="w-[70px] h-8 text-xs bg-input dark:bg-input">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border"> {/* Adicionando classes de fundo e borda */}
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          {printItems.length > 0 && (
            <Button variant="link" size="sm" onClick={clearPrintItems} className="text-red-600 h-auto p-0 text-xs">
              <X className="h-3 w-3 mr-1" />
              Limpar Seleção ({printItems.length})
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Table of Chromebooks */}
      <GlassCard className="border-white/30 rounded-2xl overflow-x-auto relative z-10 p-0">
        <Table className="min-w-[800px] md:min-w-full"> {/* Garante largura mínima para mobile */}
          <TableHeader className="bg-gray-100 border-b border-gray-300 dark:bg-muted/50 dark:border-border"> {/* Adicionando borda inferior */}
            <TableRow className="bg-gray-50/80 dark:bg-muted/50"> {/* Fundo mais claro para a linha do cabeçalho */}
              <TableHead className="w-[50px] text-center">
                <Checkbox 
                  checked={isAllOnPageSelected}
                  onCheckedChange={handleToggleAllOnPage}
                  aria-label="Selecionar todos na página"
                />
              </TableHead>
              <TableHead className="w-[100px] text-xs font-extrabold text-gray-700 uppercase tracking-wider dark:text-gray-300">ID</TableHead>
              <TableHead className="w-[120px] text-xs font-extrabold text-gray-700 uppercase tracking-wider dark:text-gray-300">Fabricante</TableHead>
              <TableHead className="w-[200px] text-xs font-extrabold text-gray-700 uppercase tracking-wider dark:text-gray-300">Modelo</TableHead>
              <TableHead className="w-[150px] text-xs font-extrabold text-gray-700 uppercase tracking-wider dark:text-gray-300">Série</TableHead>
              <TableHead className="w-[120px] text-xs font-extrabold text-gray-700 uppercase tracking-wider dark:text-gray-300">Status</TableHead> 
              <TableHead className="w-[180px] text-center text-xs font-extrabold text-gray-700 uppercase tracking-wider dark:text-gray-300">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChromebooks.length > 0 ? (
              paginatedChromebooks.map((chromebook) => {
                const statusInfo = getStatusInfo(chromebook.status);
                const StatusIcon = statusInfo.icon;
                const isSelected = isItemSelected(chromebook.id);
                
                return (
                  <TableRow key={chromebook.id} className={isSelected ? 'bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/50 dark:hover:bg-blue-900/50' : ''}>
                    <TableCell className="text-center py-2 align-top">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleToggleItem(chromebook)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-xs py-2 align-top w-[100px]">
                      {chromebook.chromebook_id}
                    </TableCell>
                    <TableCell className="text-xs py-2 align-top w-[120px]">
                      {chromebook.manufacturer || 'N/A'}
                    </TableCell>
                    <TableCell className="py-2 align-top w-[200px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-xs leading-tight">{chromebook.model}</span>
                        {chromebook.patrimony_number && (
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            Patrimônio: {chromebook.patrimony_number}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-2 align-top w-[150px]">
                      {chromebook.serial_number || 'N/A'}
                    </TableCell>
                    <TableCell className="py-2 align-top w-[120px]">
                      <div className={`inline-flex flex-col items-start gap-1 text-xs font-medium`}>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.color} dark:text-foreground dark:bg-card/50`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="text-[10px]">{statusInfo.label}</span>
                        </div>
                        {chromebook.status === 'fixo' && chromebook.classroom && (
                          <span className="ml-1 text-[10px] text-blue-700 dark:text-blue-400 flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {chromebook.classroom}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2 align-top w-[180px]">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onGenerateQrCode(chromebook.chromebook_id)}
                          title="Ver QR Code"
                          className="h-8 w-8 p-0"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(chromebook)}
                          title="Editar"
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(chromebook)}
                          title="Excluir"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                          disabled={!isAdmin}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Select 
                          value={chromebook.status} 
                          onValueChange={(value) => handleStatusChange(chromebook.id, value)}
                        >
                          {/* CORREÇÃO: Usando bg-input para o fundo do select trigger */}
                          <SelectTrigger className="w-[100px] h-8 text-xs bg-input dark:bg-input">
                            <SelectValue />
                          </SelectTrigger>
                           <SelectContent className="bg-card border-border"> {/* Adicionando classes de fundo e borda */}
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