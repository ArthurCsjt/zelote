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
import { Search, Filter, Edit3, QrCode, Trash2, Save, AlertTriangle, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useProfileRole } from "@/hooks/use-profile-role";
import { supabase } from "@/integrations/supabase/client";
import type { Chromebook as ChromebookType } from "@/types/database";

// Renomeado para não conflitar com o tipo global
interface ChromebookFormData extends Partial<ChromebookType> {}

interface ChromebookInventoryProps {
  onBack?: () => void;
  onGenerateQrCode: (chromebookId: string) => void;
}

export function ChromebookInventory({ onBack, onGenerateQrCode }: ChromebookInventoryProps) {
  const { isAdmin } = useProfileRole();
  const [chromebooks, setChromebooks] = useState<ChromebookType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<ChromebookFormData | null>(null);
  const [chromebookToDelete, setChromebookToDelete] = useState<ChromebookType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchChromebooks();
  }, []);

  const fetchChromebooks = async () => {
    const { data, error } = await supabase.from('chromebooks').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setChromebooks(data as ChromebookType[]);
    }
  };

  const getStatusInfo = (status: string) => {
    // Sua função getStatusInfo...
  };
  
  const handleEditClick = (chromebook: ChromebookType) => {
    setEditingChromebook({ ...chromebook });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingChromebook || !editingChromebook.id) return;

    const updateData = {
      manufacturer: editingChromebook.manufacturer,
      model: editingChromebook.model,
      patrimony_number: editingChromebook.patrimony_number,
      serial_number: editingChromebook.serial_number,
      status: editingChromebook.status,
      condition: editingChromebook.condition,
      location: editingChromebook.location,
      classroom: editingChromebook.classroom,
    };

    const { error } = await supabase.from('chromebooks').update(updateData).eq('id', editingChromebook.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Chromebook atualizado." });
      setChromebooks(current => current.map(cb => cb.id === editingChromebook.id ? { ...cb, ...updateData } : cb));
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteClick = (chromebook: ChromebookType) => {
    setChromebookToDelete(chromebook);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!chromebookToDelete) return;
    const { error } = await supabase.from('chromebooks').delete().eq('id', chromebookToDelete.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Chromebook excluído." });
      setChromebooks(current => current.filter(cb => cb.id !== chromebookToDelete.id));
    }
    setIsDeleteDialogOpen(false);
    setChromebookToDelete(null);
  };

  const filteredChromebooks = chromebooks.filter(cb => { /* Sua lógica de filtro */ });
  const paginatedChromebooks = filteredChromebooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros - Seu código original aqui */}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fabricante</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChromebooks.map((chromebook) => (
              <TableRow key={chromebook.id}>
                <TableCell>{chromebook.chromebook_id}</TableCell>
                <TableCell>{chromebook.manufacturer}</TableCell>
                <TableCell>{chromebook.model}</TableCell>
                <TableCell>{chromebook.status}</TableCell>
                <TableCell className="text-right">
                  {/* --- BOTÕES RESTAURADOS --- */}
                  <Button variant="ghost" size="icon" onClick={() => onGenerateQrCode(chromebook.chromebook_id)} title="Gerar QR Code">
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(chromebook)} title="Editar">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(chromebook)} className="text-destructive" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação - Seu código original aqui */}

      {/* Modal de Edição (CORRIGIDO) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Chromebook</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manufacturer" className="text-right">Fabricante</Label>
              <Input 
                id="manufacturer" 
                value={editingChromebook?.manufacturer || ''}
                onChange={(e) => setEditingChromebook(prev => prev ? {...prev, manufacturer: e.target.value} : null)}
                className="col-span-3" 
              />
            </div>
            {/* Adicione outros inputs para outros campos aqui, seguindo o mesmo padrão */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">Modelo</Label>
                <Input id="model" value={editingChromebook?.model || ''} onChange={(e) => setEditingChromebook(prev => prev ? { ...prev, model: e.target.value } : null)} className="col-span-3"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}><Save className="h-4 w-4 mr-2"/>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o Chromebook <strong>{chromebookToDelete?.chromebook_id}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}