
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { X, Save } from "lucide-react";

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
  manufacturingYear?: string;
  isProvisioned?: boolean;
}

interface EditChromebookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chromebook: Chromebook | null;
  onSave: (chromebook: Chromebook) => void;
}

export function EditChromebookDialog({ isOpen, onClose, chromebook, onSave }: EditChromebookDialogProps) {
  const { isMobile } = useMobile();
  const [editingChromebook, setEditingChromebook] = useState<Chromebook | null>(null);

  useEffect(() => {
    if (chromebook) {
      setEditingChromebook({ ...chromebook });
    }
  }, [chromebook]);

  const handleSave = () => {
    if (!editingChromebook) return;

    if (!editingChromebook.id || !editingChromebook.brand || !editingChromebook.model || 
        !editingChromebook.serialNumber) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    onSave(editingChromebook);
    onClose();
    
    toast({
      title: "Sucesso",
      description: "Chromebook atualizado com sucesso",
    });
  };

  const handleCancel = () => {
    onClose();
    setEditingChromebook(null);
  };

  const FormContent = () => (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Editar Chromebook</h2>
        <p className="text-sm text-gray-600">
          Atualize as informações do Chromebook. Os campos marcados com * são obrigatórios.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-id" className="text-sm font-medium text-gray-700">
            ID do Chromebook *
          </Label>
          <Input
            id="edit-id"
            value={editingChromebook?.id || ''}
            onChange={(e) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              id: e.target.value
            })}
            placeholder="Digite o ID"
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-brand" className="text-sm font-medium text-gray-700">
            Fabricante *
          </Label>
          <Input
            id="edit-brand"
            value={editingChromebook?.brand || ''}
            onChange={(e) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              brand: e.target.value
            })}
            placeholder="Digite o fabricante"
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-model" className="text-sm font-medium text-gray-700">
            Modelo *
          </Label>
          <Input
            id="edit-model"
            value={editingChromebook?.model || ''}
            onChange={(e) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              model: e.target.value
            })}
            placeholder="Digite o modelo"
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-serial" className="text-sm font-medium text-gray-700">
            Série *
          </Label>
          <Input
            id="edit-serial"
            value={editingChromebook?.serialNumber || ''}
            onChange={(e) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              serialNumber: e.target.value
            })}
            placeholder="Digite a série"
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-year" className="text-sm font-medium text-gray-700">
            Ano de Fabricação
          </Label>
          <Input
            id="edit-year"
            type="number"
            value={editingChromebook?.manufacturingYear || ''}
            onChange={(e) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              manufacturingYear: e.target.value
            })}
            placeholder="Digite o ano"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-patrimony" className="text-sm font-medium text-gray-700">
            Patrimônio
          </Label>
          <Input
            id="edit-patrimony"
            value={editingChromebook?.patrimony || ''}
            onChange={(e) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              patrimony: e.target.value
            })}
            placeholder="Digite o número do patrimônio"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">
            Status
          </Label>
          <Select
            value={editingChromebook?.status || 'disponivel'}
            onValueChange={(value: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado') => 
              editingChromebook && setEditingChromebook({
                ...editingChromebook,
                status: value
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disponivel">🟢 Disponível</SelectItem>
              <SelectItem value="emprestado">🔵 Emprestado</SelectItem>
              <SelectItem value="manutencao">🟡 Manutenção</SelectItem>
              <SelectItem value="danificado">🔴 Danificado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-location" className="text-sm font-medium text-gray-700">
            Local
          </Label>
          <Input
            id="edit-location"
            value={editingChromebook?.location || ''}
            onChange={(e) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              location: e.target.value
            })}
            placeholder="Ex: Sala 101"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-acquisition" className="text-sm font-medium text-gray-700">
            Data de Aquisição
          </Label>
          <Input
            id="edit-acquisition"
            type="date"
            value={editingChromebook?.acquisitionDate || ''}
            onChange={(e) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              acquisitionDate: e.target.value
            })}
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isProvisioned"
            checked={editingChromebook?.isProvisioned || false}
            onCheckedChange={(checked) => editingChromebook && setEditingChromebook({
              ...editingChromebook,
              isProvisioned: checked as boolean
            })}
          />
          <Label htmlFor="isProvisioned" className="text-sm font-medium text-gray-700">
            Equipamento já provisionado
          </Label>
        </div>

        {editingChromebook?.isProvisioned && (
          <div className="space-y-2">
            <Label htmlFor="edit-notes" className="text-sm font-medium text-gray-700">
              Observações
            </Label>
            <Textarea
              id="edit-notes"
              value={editingChromebook?.notes || ''}
              onChange={(e) => editingChromebook && setEditingChromebook({
                ...editingChromebook,
                notes: e.target.value
              })}
              placeholder="Digite observações relevantes sobre o equipamento"
              className="min-h-[80px] resize-none w-full"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 bg-green-600 text-white hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[100dvh] max-h-[100dvh] p-0 bg-white border-0 rounded-t-2xl fixed inset-x-0 bottom-0 z-[100] overflow-y-auto"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            height: '100vh',
            maxHeight: '100vh',
            width: '100vw',
            borderRadius: 0,
          }}
        >
          <FormContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <FormContent />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
