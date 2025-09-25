import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { Search, Filter, Edit3, QrCode, Trash2, Save } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useProfileRole } from "@/hooks/use-profile-role";
import { supabase } from "@/integrations/supabase/client";
import type { Chromebook } from "@/types/database";

interface ChromebookData extends Chromebook {}

interface ChromebookInventoryProps {
  onBack?: () => void;
  onGenerateQrCode: (chromebookId: string) => void; // Recebe a função do "chefe"
}

export function ChromebookInventory({ onBack, onGenerateQrCode }: ChromebookInventoryProps) {
  const { isAdmin } = useProfileRole();
  const [chromebooks, setChromebooks] = useState<ChromebookData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<ChromebookData | null>(null);
  const [chromebookToDelete, setChromebookToDelete] = useState<ChromebookData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchChromebooks = async () => {
      const { data, error } = await supabase.from('chromebooks').select('*').order('created_at', { ascending: false });
      if (error) {
        toast({ title: "Erro", description: "Não foi possível carregar os Chromebooks", variant: "destructive" });
      } else {
        setChromebooks(data as ChromebookData[]);
      }
    };
    fetchChromebooks();
  }, []);

  const filteredChromebooks = chromebooks.filter((cb) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = cb.chromebook_id.toLowerCase().includes(search) ||
                          String(cb.patrimony_number || '').toLowerCase().includes(search) ||
                          cb.model.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || cb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredChromebooks.length / itemsPerPage);
  const paginatedChromebooks = filteredChromebooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (chromebook: ChromebookData) => {
    setEditingChromebook({ ...chromebook });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => { /* Sua lógica de salvar edição */ };
  const handleDeleteClick = (chromebook: ChromebookData) => { /* Sua lógica de apagar */ };
  const handleConfirmDelete = async () => { /* Sua lógica de confirmar apagar */ };

  return (
    <div className="max-w-6xl mx-auto p-6 glass-morphism animate-fade-in relative">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar por ID, patrimônio, modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] pl-10"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="emprestado">Emprestado</SelectItem>
              <SelectItem value="fixo">Fixo</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="glass-card border-white/30 rounded-2xl overflow-hidden relative z-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Patrimônio</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChromebooks.map((chromebook) => (
              <TableRow key={chromebook.id}>
                <TableCell>{chromebook.chromebook_id}</TableCell>
                <TableCell>{chromebook.patrimony_number || '-'}</TableCell>
                <TableCell>{chromebook.model}</TableCell>
                <TableCell>{chromebook.status}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" 
                      onClick={() => onGenerateQrCode(chromebook.chromebook_id)} // AQUI ESTÁ A CORREÇÃO FINAL
                      title="Ver QR Code">
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(chromebook)} title="Editar">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(chromebook)} title="Excluir" className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* A LÓGICA DE PAGINAÇÃO E OS MODAIS DE EDITAR/APAGAR CONTINUAM AQUI... */}
    </div>
  );
}