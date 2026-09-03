import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Search, Filter, Edit3, QrCode, CheckCircle, AlertCircle, XCircle, Clock, RefreshCw, Download, Trash2, MapPin, FileText, Loader2, AlertTriangle, Printer, ListChecks, X, Factory } from "lucide-react";
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
import { cn } from "@/lib/utils"; // IMPORTAÇÃO CORRIGIDA

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
  const [classroomFilter, setClassroomFilter] = useState<string>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');

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

  // Listas dinâmicas extraídas do inventário para filtros
  const availableClassrooms = useMemo(() => {
    const rooms = new Set<string>();
    chromebooks.forEach(cb => {
      if (cb.classroom && cb.classroom.trim()) {
        rooms.add(cb.classroom.trim());
      } else if (cb.location && cb.location.trim()) {
        rooms.add(cb.location.trim());
      }
    });
    return Array.from(rooms).sort((a, b) => a.localeCompare(b));
  }, [chromebooks]);

  const availableManufacturers = useMemo(() => {
    const brands = new Set<string>();
    chromebooks.forEach(cb => {
      if (cb.manufacturer && cb.manufacturer.trim()) {
        brands.add(cb.manufacturer.trim());
      }
    });
    return Array.from(brands).sort((a, b) => a.localeCompare(b));
  }, [chromebooks]);

  // Filter Chromebooks based on search term, status, classroom and manufacturer with intelligent scoring
  const filteredChromebooks = useMemo(() => {
    let filtered = chromebooks;

    // 1. Filtrar por status
    if (statusFilter !== 'all') {
      if (statusFilter === 'emprestado_fixo') {
        filtered = filtered.filter(cb => cb.status === 'emprestado' || cb.status === 'fixo');
      } else if (statusFilter === 'indisponiveis') {
        filtered = filtered.filter(cb => cb.status === 'manutencao' || cb.status === 'fora_uso');
      } else {
        filtered = filtered.filter(cb => cb.status === statusFilter);
      }
    }

    // 2. Filtrar por sala/localização
    if (classroomFilter !== 'all') {
      filtered = filtered.filter(cb => {
        const room = (cb.classroom || cb.location || '').trim().toLowerCase();
        return room === classroomFilter.trim().toLowerCase();
      });
    }

    // 3. Filtrar por fabricante
    if (manufacturerFilter !== 'all') {
      filtered = filtered.filter(cb => {
        return (cb.manufacturer || '').trim().toLowerCase() === manufacturerFilter.trim().toLowerCase();
      });
    }

    // 4. Se não houver termo de busca, retorna a lista filtrada
    if (!searchTerm.trim()) return filtered;

    const lowerCaseSearch = searchTerm.toLowerCase();
    const isNumeric = /^\d+$/.test(searchTerm);

    // 5. Aplicar sistema de pontuação (scoring)
    return filtered
      .map(cb => {
        let score = 0;
        const idLower = cb.chromebook_id.toLowerCase();
        const searchable = `${cb.chromebook_id} ${cb.model} ${cb.serial_number} ${cb.patrimony_number} ${cb.manufacturer} ${cb.location} ${cb.classroom}`.toLowerCase();

        // Pontuação baseada no ID
        if (idLower === lowerCaseSearch) {
          score += 100; // Match exato
        } else if (isNumeric) {
          const idMatch = idLower.match(/\d+/);
          const idNumber = idMatch ? parseInt(idMatch[0], 10) : null;
          if (idNumber === parseInt(searchTerm, 10)) {
            score += 90; // Match numérico (ex: "1" em "CHR001")
          } else if (idLower.includes(lowerCaseSearch)) {
            score += 70;
          }
        } else if (idLower.startsWith(lowerCaseSearch)) {
          score += 85;
        } else if (idLower.includes(lowerCaseSearch)) {
          score += 70;
        }

        // Pontuação baseada em outros campos
        if (searchable.includes(lowerCaseSearch) && score === 0) {
          score += isNumeric ? 10 : 30;
        } else if (searchable.includes(lowerCaseSearch)) {
          score += 5;
        }

        return { ...cb, score };
      })
      .filter(cb => (cb as any).score > 0)
      .sort((a, b) => (b as any).score - (a as any).score || a.chromebook_id.localeCompare(b.chromebook_id));
  }, [chromebooks, searchTerm, statusFilter, classroomFilter, manufacturerFilter]);

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
  }, [searchTerm, statusFilter, classroomFilter, manufacturerFilter, itemsPerPage]);

  // Get status information for display
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'disponivel':
        return {
          color: 'text-green-600 bg-green-50 dark:text-success dark:bg-success-bg/30',
          icon: CheckCircle,
          label: 'Disponível'
        };
      case 'emprestado':
        return {
          color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30',
          icon: Clock,
          label: 'Emprestado'
        };
      case 'fixo':
        return {
          color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
          icon: MapPin,
          label: 'Fixo'
        };
      case 'manutencao':
        return {
          color: 'text-red-600 bg-red-50 dark:text-error dark:bg-error-bg/30',
          icon: AlertTriangle,
          label: 'Manutenção'
        };
      case 'fora_uso':
        return {
          color: 'text-gray-600 bg-gray-200 dark:text-muted-foreground dark:bg-muted/30',
          icon: XCircle,
          label: 'Inativo'
        };
      case 'emprestado_fixo':
        return {
          color: 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-950/60',
          icon: Clock,
          label: 'Emprestados + Fixos'
        };
      case 'indisponiveis':
        return {
          color: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/60',
          icon: AlertTriangle,
          label: 'Indisponíveis'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 dark:text-muted-foreground dark:bg-muted/30',
          icon: XCircle,
          label: 'Desconhecido'
        };
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

  // NOVO: Handler para impressão em lote (USANDO NOVA ABORDAGEM)
  const handleBatchPrint = () => {
    if (printItems.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos um Chromebook para imprimir.", variant: "info" });
      return;
    }

    // 1. Salva os itens selecionados no LocalStorage
    localStorage.setItem('print_queue', JSON.stringify(printItems));

    // 2. Abre a rota de impressão em uma nova aba
    window.open('/print-preview', '_blank');

    // 3. Limpa a seleção local (opcional, mas boa prática)
    clearPrintItems();
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


  const hasActiveFilters = statusFilter !== 'all' || classroomFilter !== 'all' || manufacturerFilter !== 'all' || searchTerm.trim() !== '';

  const handleClearFilters = () => {
    setStatusFilter('all');
    setClassroomFilter('all');
    setManufacturerFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="p-0 glass-morphism animate-fade-in relative">
      {/* Estatísticas com Interatividade de Filtro (Cards Clicáveis) */}
      <InventoryStats
        chromebooks={chromebooks}
        selectedFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* Painel de Busca e Filtros - ESTILO NEO-BRUTALISM */}
      <div className="mb-8 p-6 border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] relative z-10 animate-fadeIn animation-delay-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h3 className="text-sm font-black uppercase flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros e Ações
          </h3>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-3 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-red-100 hover:bg-red-200 text-red-700 font-bold uppercase text-[11px] flex items-center gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar Todos os Filtros</span>
            </Button>
          )}
        </div>

        {/* Linha 1: Busca e Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 items-end mb-4">
          {/* Campo de Busca */}
          <div className="relative flex-1 w-full space-y-1">
            <span className="text-xs font-bold uppercase text-gray-500">Buscar Equipamento</span>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-black dark:text-white" />
              <Input
                placeholder="ID, PATRIMÔNIO, MODELO, SÉRIE, SALA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 uppercase font-mono text-sm border-2 border-black dark:border-white rounded-none h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950 focus-visible:ring-0"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-black dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 w-full sm:w-auto pb-0.5">
            {/* Botão de Impressão em Lote */}
            <Button
              onClick={handleBatchPrint}
              variant="outline"
              title={`IMPRIMIR (${printItems.length})`}
              disabled={printItems.length === 0 || isFetching || isExporting}
              className="h-12 w-12 p-0 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-blue-100 hover:bg-blue-200 dark:bg-blue-900"
            >
              <Printer className="h-5 w-5 text-black dark:text-white" />
              {printItems.length > 0 && (
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-none border-2 border-black bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {printItems.length}
                </span>
              )}
            </Button>

            <Button
              onClick={fetchChromebooks}
              variant="outline"
              disabled={isFetching || isExporting}
              title="ATUALIZAR"
              className="h-12 w-12 p-0 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-yellow-300 hover:bg-yellow-400"
            >
              <RefreshCw className={`h-5 w-5 text-black ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              title="EXPORTAR CSV"
              disabled={isExporting || isFetching}
              className="h-12 w-12 p-0 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white hover:bg-gray-100 dark:bg-zinc-800"
            >
              {isExporting ? (
                <Loader2 className="h-5 w-5 animate-spin text-black dark:text-white" />
              ) : (
                <FileText className="h-5 w-5 text-black dark:text-white" />
              )}
            </Button>
          </div>
        </div>

        {/* Linha 2: Os 3 Filtros Dropdown (Status, Sala/Localização, Fabricante) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t-2 border-black/10 dark:border-white/10">
          {/* Filtro de Status */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Status
            </span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-2 border-black dark:border-white rounded-none h-11 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950 font-bold uppercase text-xs focus:ring-0">
                <SelectValue placeholder="STATUS" />
              </SelectTrigger>
              <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <SelectItem value="all" className="uppercase font-bold text-xs">Todos os Status</SelectItem>
                <SelectItem value="disponivel" className="uppercase font-bold text-xs text-green-700">🟢 Disponível</SelectItem>
                <SelectItem value="emprestado" className="uppercase font-bold text-xs text-purple-700">🟣 Emprestado</SelectItem>
                <SelectItem value="fixo" className="uppercase font-bold text-xs text-blue-700">🔵 Fixo em Sala</SelectItem>
                <SelectItem value="manutencao" className="uppercase font-bold text-xs text-red-700">🔴 Em Manutenção</SelectItem>
                <SelectItem value="fora_uso" className="uppercase font-bold text-xs text-gray-700">⚪ Inativo / Fora de Uso</SelectItem>
                <SelectItem value="emprestado_fixo" className="uppercase font-bold text-xs">Emprestados + Fixos</SelectItem>
                <SelectItem value="indisponiveis" className="uppercase font-bold text-xs">Indisponíveis (Manutenção + Inativo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Sala / Localização */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Sala / Localização
            </span>
            <Select value={classroomFilter} onValueChange={setClassroomFilter}>
              <SelectTrigger className="w-full border-2 border-black dark:border-white rounded-none h-11 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950 font-bold uppercase text-xs focus:ring-0 truncate">
                <SelectValue placeholder="SALA / LOCAL" />
              </SelectTrigger>
              <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-60">
                <SelectItem value="all" className="uppercase font-bold text-xs">Todas as Salas</SelectItem>
                {availableClassrooms.map(room => {
                  const count = chromebooks.filter(c => (c.classroom || c.location || '').trim().toLowerCase() === room.toLowerCase()).length;
                  return (
                    <SelectItem key={room} value={room} className="uppercase font-bold text-xs">
                      📍 {room} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Fabricante / Marca */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-1">
              <Factory className="h-3 w-3" /> Fabricante / Marca
            </span>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-full border-2 border-black dark:border-white rounded-none h-11 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950 font-bold uppercase text-xs focus:ring-0 truncate">
                <SelectValue placeholder="FABRICANTE" />
              </SelectTrigger>
              <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-60">
                <SelectItem value="all" className="uppercase font-bold text-xs">Todos os Fabricantes</SelectItem>
                {availableManufacturers.map(brand => {
                  const count = chromebooks.filter(c => (c.manufacturer || '').trim().toLowerCase() === brand.toLowerCase()).length;
                  return (
                    <SelectItem key={brand} value={brand} className="uppercase font-bold text-xs">
                      🏭 {brand} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-black/10 dark:border-white/10 flex-wrap gap-2">
          <div className="text-xs font-black uppercase text-gray-500 flex items-center gap-4 flex-wrap">
            <span>Resultados: <strong className="text-black dark:text-white font-mono text-sm">{filteredChromebooks.length}</strong> de {chromebooks.length} Equipamentos</span>

            <span className="h-4 w-px bg-gray-300 hidden sm:inline"></span>

            {/* Seletor de Itens por Página */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Exibir:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[70px] h-8 text-xs font-bold border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectItem value="10" className="font-bold">10</SelectItem>
                  <SelectItem value="25" className="font-bold">25</SelectItem>
                  <SelectItem value="50" className="font-bold">50</SelectItem>
                  <SelectItem value="100" className="font-bold">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {printItems.length > 0 && (
            <Button variant="link" size="sm" onClick={clearPrintItems} className="text-red-600 font-bold uppercase tracking-wider text-xs h-auto p-0 hover:no-underline hover:text-red-800">
              <X className="h-4 w-4 mr-1 border-2 border-red-600 text-red-600 bg-red-100 p-0.5" />
              Limpar Seleção ({printItems.length})
            </Button>
          )}
        </div>
      </div>

      {/* Table of Chromebooks - ESTILO NEO-BRUTALISM */}
      <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-0 mb-8 animate-fadeIn animation-delay-500 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-yellow-300 dark:bg-yellow-900/50 border-b-4 border-black dark:border-white">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[50px] text-center border-r-2 border-black dark:border-white p-0">
                  <div className="flex items-center justify-center h-full w-full">
                    <Checkbox
                      checked={isAllOnPageSelected}
                      onCheckedChange={handleToggleAllOnPage}
                      aria-label="Selecionar todos na página"
                      className="border-2 border-black rounded-none data-[state=checked]:bg-black data-[state=checked]:text-white h-5 w-5"
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-xs font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white">ID</TableHead>
                <TableHead className="w-[120px] text-xs font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white">Fabricante</TableHead>
                <TableHead className="w-[200px] text-xs font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white">Modelo</TableHead>
                <TableHead className="w-[150px] text-xs font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white">Série</TableHead>
                <TableHead className="w-[140px] text-xs font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white">Status</TableHead>
                <TableHead className="w-[180px] text-center text-xs font-black text-black dark:text-white uppercase tracking-tight">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedChromebooks.length > 0 ? (
                paginatedChromebooks.map((chromebook) => {
                  const statusInfo = getStatusInfo(chromebook.status);
                  const StatusIcon = statusInfo.icon;
                  const isSelected = isItemSelected(chromebook.id);

                  return (
                    <TableRow
                      key={chromebook.id}
                      className={cn(
                        "border-b-2 border-black/10 dark:border-white/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors",
                        isSelected && "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                      )}
                    >
                      <TableCell className="text-center py-3 align-middle border-r-2 border-black/10 dark:border-white/10 p-0">
                        <div className="flex items-center justify-center h-full w-full">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleItem(chromebook)}
                            className="border-2 border-black rounded-none data-[state=checked]:bg-black data-[state=checked]:text-white h-5 w-5"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs py-3 align-middle border-r-2 border-black/10 dark:border-white/10">
                        {chromebook.chromebook_id}
                      </TableCell>
                      <TableCell className="text-xs font-bold uppercase py-3 align-middle border-r-2 border-black/10 dark:border-white/10">
                        {chromebook.manufacturer || 'N/A'}
                      </TableCell>
                      <TableCell className="py-3 align-middle border-r-2 border-black/10 dark:border-white/10">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs uppercase leading-tight">{chromebook.model}</span>
                          {chromebook.patrimony_number && (
                            <span className="text-[10px] font-mono font-bold text-gray-500 leading-tight">
                              PAT: {chromebook.patrimony_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold py-3 align-middle border-r-2 border-black/10 dark:border-white/10">
                        {chromebook.serial_number || 'N/A'}
                      </TableCell>
                      <TableCell className="py-3 align-middle border-r-2 border-black/10 dark:border-white/10">
                        <div className={`inline-flex flex-col items-start gap-1 text-xs font-bold`}>
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                            chromebook.status === 'disponivel' && "bg-green-200 text-green-900",
                            chromebook.status === 'emprestado' && "bg-purple-200 text-purple-900",
                            chromebook.status === 'fixo' && "bg-blue-200 text-blue-900",
                            chromebook.status === 'manutencao' && "bg-red-200 text-red-900",
                            chromebook.status === 'fora_uso' && "bg-gray-200 text-gray-900",
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="text-[10px] uppercase tracking-wide">{statusInfo.label}</span>
                          </div>
                          {chromebook.status === 'fixo' && chromebook.classroom && (
                            <span className="ml-0.5 text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {chromebook.classroom}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onGenerateQrCode(chromebook.chromebook_id)}
                            title="QR Code"
                            className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(chromebook)}
                            title="Editar"
                            className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(chromebook)}
                              title="Excluir"
                              className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-red-100 hover:bg-red-200 text-red-700 border-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Select
                            value={chromebook.status}
                            onValueChange={(value) => handleStatusChange(chromebook.id, value)}
                          >
                            <SelectTrigger className="w-[32px] h-8 p-0 text-xs bg-white dark:bg-zinc-800 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex justify-center items-center">
                              <RefreshCw className="h-3 w-3" />
                            </SelectTrigger>
                            <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <SelectItem value="disponivel" className="text-xs font-bold uppercase">Disponível</SelectItem>
                              <SelectItem value="emprestado" disabled={chromebook.status !== 'emprestado'} className="text-xs font-bold uppercase">Emprestado</SelectItem>
                              <SelectItem value="fixo" className="text-xs font-bold uppercase">Fixo</SelectItem>
                              <SelectItem value="manutencao" className="text-xs font-bold uppercase">Manutenção</SelectItem>
                              <SelectItem value="fora_uso" className="text-xs font-bold uppercase">Inativo</SelectItem>
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
                    className="h-32 text-center text-gray-500 font-mono uppercase"
                  >
                    {searchTerm || statusFilter !== 'all'
                      ? "Nenhum resultado encontrado."
                      : "Inventário Vazio."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination - ESTILO NEO-BRUTALISM */}
      {
        totalPages > 1 && (
          <Pagination className="mt-8 justify-center">
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={cn(
                    "border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-900 font-bold uppercase text-xs h-10 px-4",
                    currentPage === 1 ? "pointer-events-none opacity-50 shadow-none" : "cursor-pointer"
                  )}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "cursor-pointer border-2 border-black dark:border-white rounded-none h-10 w-10 font-bold",
                      currentPage === page
                        ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                        : "bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    )}
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
                  className={cn(
                    "border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-900 font-bold uppercase text-xs h-10 px-4",
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50 shadow-none"
                      : "cursor-pointer"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )
      }

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
    </div >
  );
}