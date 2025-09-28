import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { Edit3, QrCode, Trash2, Save } from "lucide-react";
import { useDatabase } from "@/contexts/DatabaseContext";
import type { Chromebook as ChromebookType } from "@/types/database";

// Interface para o estado do formulário de edição
type ChromebookFormData = Partial<ChromebookType>;

interface ChromebookInventoryProps {
  onBack?: () => void;
  onGenerateQrCode: (chromebookId: string) => void;
}

  const { getChromebooks, updateChromebook, deleteChromebook, loading } = useDatabase();
  const [chromebooks, setChromebooks] = useState<ChromebookType[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingChromebook, setEditingChromebook] = useState<ChromebookFormData | null>(null);
  const [chromebookToDelete, setChromebookToDelete] = useState<ChromebookType | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getChromebooks();
      setChromebooks(data);
    })();
  }, [getChromebooks]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingChromebook || !editingChromebook.id) return;
    const { error } = await updateChromebook(editingChromebook.id, editingChromebook);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sucesso!", description: "Chromebook atualizado." });
    setChromebooks(current => current.map(cb => cb.id === editingChromebook.id ? { ...cb, ...editingChromebook } : cb));
    setIsEditDialogOpen(false);
  }, [editingChromebook, updateChromebook]);

  const handleConfirmDelete = useCallback(async () => {
    if (!chromebookToDelete) return;
    const { error } = await deleteChromebook(chromebookToDelete.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sucesso!", description: "Chromebook excluído." });
    setChromebooks(current => current.filter(cb => cb.id !== chromebookToDelete.id));
    setIsDeleteDialogOpen(false);
    setChromebookToDelete(null);
  }, [chromebookToDelete, deleteChromebook]);

  const handleEditClick = useCallback((chromebook: ChromebookType) => {
    setEditingChromebook({ ...chromebook });
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((chromebook: ChromebookType) => {
    setChromebookToDelete(chromebook);
    setIsDeleteDialogOpen(true);
  }, []);

  const renderTableRows = () => (
    chromebooks.length > 0 ? (
      chromebooks.map((chromebook) => (
        <TableRow key={chromebook.id}>
          <TableCell>{chromebook.chromebook_id}</TableCell>
          <TableCell>{chromebook.manufacturer}</TableCell>
          <TableCell>{chromebook.model}</TableCell>
          <TableCell>{chromebook.status}</TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="icon" onClick={() => onGenerateQrCode(chromebook.chromebook_id)} title="Gerar QR Code"><QrCode className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleEditClick(chromebook)} title="Editar"><Edit3 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(chromebook)} className="text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></Button>
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center">
          {loading ? "Carregando..." : "Nenhum Chromebook cadastrado ainda."}
        </TableCell>
      </TableRow>
    )
  );

  return (
    <div className="space-y-4">
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
            {renderTableRows()}
        </Table>
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Chromebook</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manufacturer" className="text-right">Fabricante</Label>
              <Input id="manufacturer" value={editingChromebook?.manufacturer || ''} onChange={(e) => setEditingChromebook(prev => prev ? {...prev, manufacturer: e.target.value} : null)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">Modelo</Label>
              <Input id="model" value={editingChromebook?.model || ''} onChange={(e) => setEditingChromebook(prev => prev ? {...prev, model: e.target.value} : null)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Input id="status" value={editingChromebook?.status || ''} onChange={(e) => setEditingChromebook(prev => prev ? {...prev, status: e.target.value} : null)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serial_number" className="text-right">Serial</Label>
              <Input id="serial_number" value={editingChromebook?.serial_number || ''} onChange={(e) => setEditingChromebook(prev => prev ? {...prev, serial_number: e.target.value} : null)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patrimony_number" className="text-right">Patrimônio</Label>
              <Input id="patrimony_number" value={editingChromebook?.patrimony_number || ''} onChange={(e) => setEditingChromebook(prev => prev ? {...prev, patrimony_number: e.target.value} : null)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">Localização</Label>
              <Input id="location" value={editingChromebook?.location || ''} onChange={(e) => setEditingChromebook(prev => prev ? {...prev, location: e.target.value} : null)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="classroom" className="text-right">Sala</Label>
              <Input id="classroom" value={editingChromebook?.classroom || ''} onChange={(e) => setEditingChromebook(prev => prev ? {...prev, classroom: e.target.value} : null)} className="col-span-3" />
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
              Tem certeza que deseja excluir o Chromebook <b>{chromebookToDelete?.model}</b>?
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