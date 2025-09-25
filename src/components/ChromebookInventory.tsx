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

// Tipagem dos dados
interface ChromebookData extends Chromebook {}

// Tipagem das "ordens" recebidas do componente pai
interface ChromebookInventoryProps {
  onBack?: () => void;
  onGenerateQrCode: (chromebookId: string) => void;
}

export function ChromebookInventory({ onBack, onGenerateQrCode }: ChromebookInventoryProps) {
  const { isAdmin } = useProfileRole();
  const [chromebooks, setChromebooks] = useState<ChromebookData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<ChromebookData | null>(null);
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
  
  // (O resto das suas funções de filtro, paginação, edição e delete continuam aqui...)
  const filteredChromebooks = chromebooks.filter((cb) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = cb.chromebook_id.toLowerCase().includes(search) ||
                          String(cb.patrimony_number || '').toLowerCase().includes(search) ||
                          cb.model.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || cb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const paginatedChromebooks = filteredChromebooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (chromebook: ChromebookData) => {
    setEditingChromebook({ ...chromebook });
    setIsEditDialogOpen(true);
  };
  
  // ... suas outras funções ...

  return (
    <div className="max-w-6xl mx-auto p-6 glass-morphism animate-fade-in relative">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Seus filtros de busca e status continuam aqui... */}
        <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      
      <div className="glass-card rounded-2xl overflow-hidden">
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
                    {/* Botão de delete e outros... */}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Seus modais de edição, delete e paginação continuam aqui... */}
      {/* O MODAL DE QR CODE FOI REMOVIDO DAQUI E AGORA É CONTROLADO PELO 'INDEX.TSX' */}
    </div>
  );
}