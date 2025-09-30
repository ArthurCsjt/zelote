import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Chromebook } from "@/types/database";

// Definimos as props que o componente de edição precisa
interface ChromebookEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // O estado do chromebook que está sendo editado
  editingChromebook: Partial<Chromebook> | null;
  // A função para atualizar esse estado enquanto o usuário digita
  setEditingChromebook: (data: Partial<Chromebook> | null) => void;
  // A função para chamar quando o usuário clica em "Salvar"
  onSave: () => void;
}

export const ChromebookEditDialog = ({
  isOpen,
  onOpenChange,
  editingChromebook,
  setEditingChromebook,
  onSave,
}: ChromebookEditDialogProps) => {
  
  // Função interna para lidar com a mudança nos campos do formulário
  const handleChange = (field: keyof Chromebook, value: string | null) => {
    if (editingChromebook) {
      setEditingChromebook({ ...editingChromebook, [field]: value });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Chromebook</DialogTitle>
          <DialogDescription>
            Faça alterações nos detalhes do equipamento. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        
        {/* Corpo do formulário */}
        <div className="grid gap-4 py-4">
          {/* Usamos um 'grid' para organizar os campos em duas colunas */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="manufacturer" className="text-right">Fabricante</Label>
            <Input
              id="manufacturer"
              value={editingChromebook?.manufacturer || ""}
              onChange={(e) => handleChange('manufacturer', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">Modelo</Label>
            <Input
              id="model"
              value={editingChromebook?.model || ""}
              onChange={(e) => handleChange('model', e.target.value)}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patrimony_number" className="text-right">Patrimônio</Label>
            <Input
              id="patrimony_number"
              value={editingChromebook?.patrimony_number || ""}
              onChange={(e) => handleChange('patrimony_number', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select 
              value={editingChromebook?.status || ""}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="emprestado">Emprestado</SelectItem>
                <SelectItem value="manutencao">Em Manutenção</SelectItem>
                <SelectItem value="fixo">Fixo em Sala</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observations" className="text-right">Observações</Label>
            <Textarea
              id="observations"
              value={editingChromebook?.observations || ""}
              onChange={(e) => handleChange('observations', e.target.value)}
              className="col-span-3"
              placeholder="Adicione qualquer observação sobre o equipamento"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};