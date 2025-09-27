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
import { Search, Filter, Edit3, QrCode, Trash2, Save } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Chromebook as ChromebookType } from "@/types/database";

// Interface para o estado do formulário de edição
interface ChromebookFormData extends Partial<ChromebookType> {}

export function ChromebookInventory() {
  const [chromebooks, setChromebooks] = useState<ChromebookType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<ChromebookFormData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const handleEditClick = (chromebook: ChromebookType) => {
    // Carrega TODOS os dados do chromebook para o estado de edição
    setEditingChromebook({ ...chromebook }); 
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingChromebook || !editingChromebook.id) return;

    // Prepara o pacote de dados para o update, incluindo o fabricante
    const updateData = {
      manufacturer: editingChromebook.manufacturer,
      model: editingChromebook.model,
      patrimony_number: editingChromebook.patrimony_number,
      serial_number: editingChromebook.serial_number,
      status: editingChromebook.status,
      // Adicione outros campos que podem ser editados aqui
    };

    const { error } = await supabase
      .from('chromebooks')
      .update(updateData)
      .eq('id', editingChromebook.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Chromebook atualizado." });
      
      // --- CORREÇÃO 3: Atualiza a lista na tela instantaneamente ---
      setChromebooks(currentChromebooks => 
        currentChromebooks.map(cb => 
          cb.id === editingChromebook.id ? { ...cb, ...updateData } : cb
        )
      );
      setIsEditDialogOpen(false); // Fecha o modal
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
      setChromebooks(currentChromebooks => currentChromebooks.filter(cb => cb.id !== chromebookToDelete.id));
    }
    setIsDeleteDialogOpen(false);
    setChromebookToDelete(null);
  };

  const filteredChromebooks = chromebooks.filter(cb => {
    const search = searchTerm.toLowerCase();
    return (String(cb.patrimony_number || '').toLowerCase().includes(search) ||
            (cb.manufacturer || '').toLowerCase().includes(search) || // Permite buscar por fabricante
            cb.model.toLowerCase().includes(search) ||
            cb.chromebook_id.toLowerCase().includes(search)) &&
           (statusFilter === 'all' || cb.status === statusFilter);
  });
  
  const paginatedChromebooks = filteredChromebooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID, patrimônio, modelo, fabricante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="emprestado">Emprestado</SelectItem>
            <SelectItem value="fixo">Fixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Chromebooks */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fabricante</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Patrimônio</TableHead>
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
                <TableCell>{chromebook.patrimony_number || 'N/A'}</TableCell>
                <TableCell><span className={`px-2 py-1 text-xs rounded-full ${
                  chromebook.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                  chromebook.status === 'emprestado' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>{chromebook.status}</span></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => alert('Gerar QR Code')}><QrCode className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(chromebook)}><Edit3 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(chromebook)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <Pagination>{/* ... sua lógica de paginação ... */}</Pagination>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Chromebook</DialogTitle>
            <DialogDescription>
              Faça alterações nos dados do Chromebook e clique em salvar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* --- CORREÇÃO 1: Campo Fabricante agora lê e escreve no estado --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manufacturer" className="text-right">Fabricante</Label>
              <Input id="manufacturer" 
                     value={editingChromebook?.manufacturer || ''}
                     onChange={(e) => setEditingChromebook(prev => prev ? {...prev, manufacturer: e.target.value} : null)}
                     className="col-span-3" />
            </div>
            {/* Outros campos de edição (Modelo, Patrimônio, etc.) podem ser adicionados aqui da mesma forma */}
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