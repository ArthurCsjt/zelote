
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { toast } from "@/hooks/use-toast";

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

interface AddChromebookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (chromebook: Chromebook) => void;
  existingIds: string[];
}

export function AddChromebookDialog({ isOpen, onClose, onAdd, existingIds }: AddChromebookDialogProps) {
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

  const handleAdd = () => {
    if (!newChromebook.id || !newChromebook.brand || !newChromebook.model || 
        !newChromebook.serialNumber || !newChromebook.patrimony) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (existingIds.includes(newChromebook.id)) {
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

    onAdd(chromebook);
    
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
    
    toast({
      title: "Sucesso",
      description: "Chromebook adicionado com sucesso",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAdd}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
