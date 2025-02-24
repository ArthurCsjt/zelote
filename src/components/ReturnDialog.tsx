
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chromebookId: string;
  onChromebookIdChange: (id: string) => void;
  returnData: {
    name: string;
    ra?: string;
    email: string;
    type: 'individual' | 'lote';
    userType: 'aluno' | 'professor' | 'funcionario';
  };
  onReturnDataChange: (data: {
    name: string;
    ra?: string;  // Made ra optional here
    email: string;
    type: 'individual' | 'lote';
    userType: 'aluno' | 'professor' | 'funcionario';
  }) => void;
  onConfirm: () => void;
}

export function ReturnDialog({
  open,
  onOpenChange,
  chromebookId,
  onChromebookIdChange,
  returnData,
  onReturnDataChange,
  onConfirm
}: ReturnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devolução de Chromebook</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="returnType">Tipo de Devolução</Label>
            <Select
              value={returnData.type}
              onValueChange={(value: 'individual' | 'lote') =>
                onReturnDataChange({ ...returnData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de devolução" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="lote">Em Lote</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chromebookId">ID do Chromebook</Label>
            <Input
              id="chromebookId"
              value={chromebookId}
              onChange={(e) => onChromebookIdChange(e.target.value)}
              placeholder="Digite o ID do Chromebook"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userType">Tipo de Solicitante</Label>
            <Select
              value={returnData.userType}
              onValueChange={(value: 'aluno' | 'professor' | 'funcionario') =>
                onReturnDataChange({ ...returnData, userType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de solicitante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aluno">Aluno</SelectItem>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="funcionario">Funcionário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnerName">Nome do Solicitante</Label>
            <Input
              id="returnerName"
              value={returnData.name}
              onChange={(e) => onReturnDataChange({ ...returnData, name: e.target.value })}
              placeholder="Digite o nome do solicitante"
            />
          </div>

          {returnData.userType === 'aluno' && (
            <div className="space-y-2">
              <Label htmlFor="returnerRA">RA do Aluno (opcional)</Label>
              <Input
                id="returnerRA"
                value={returnData.ra}
                onChange={(e) => onReturnDataChange({ ...returnData, ra: e.target.value })}
                placeholder="Digite o RA"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="returnerEmail">Email</Label>
            <Input
              id="returnerEmail"
              type="email"
              value={returnData.email}
              onChange={(e) => onReturnDataChange({ ...returnData, email: e.target.value })}
              placeholder="Digite o email"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Confirmar Devolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
