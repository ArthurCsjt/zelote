
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { QRCodeReader } from "./QRCodeReader";
import { toast } from "./ui/use-toast";

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
    ra?: string;
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
  const [showScanner, setShowScanner] = useState(false);

  const handleQRCodeScan = (result: string) => {
    try {
      const data = JSON.parse(result);
      if (data.id) {
        onChromebookIdChange(data.id);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "QR Code inválido",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Devolução de Chromebook
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Return Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnType" className="text-gray-700">
                  Tipo de Devolução
                </Label>
                <Select
                  value={returnData.type}
                  onValueChange={(value: 'individual' | 'lote') =>
                    onReturnDataChange({ ...returnData, type: value })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Selecione o tipo de devolução" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="lote">Em Lote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chromebookId" className="text-gray-700">
                  ID do Chromebook
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="chromebookId"
                    value={chromebookId}
                    onChange={(e) => onChromebookIdChange(e.target.value)}
                    placeholder="Digite o ID do Chromebook"
                    className="bg-white border-gray-200"
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowScanner(true)}
                  >
                    Escanear QR
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userType" className="text-gray-700">
                  Tipo de Solicitante
                </Label>
                <Select
                  value={returnData.userType}
                  onValueChange={(value: 'aluno' | 'professor' | 'funcionario') =>
                    onReturnDataChange({ ...returnData, userType: value })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Selecione o tipo de solicitante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aluno">Aluno</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column - User Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnerName" className="text-gray-700">
                  Nome do Solicitante
                </Label>
                <Input
                  id="returnerName"
                  value={returnData.name}
                  onChange={(e) => onReturnDataChange({ ...returnData, name: e.target.value })}
                  placeholder="Digite o nome do solicitante"
                  className="bg-white border-gray-200"
                />
              </div>

              {returnData.userType === 'aluno' && (
                <div className="space-y-2">
                  <Label htmlFor="returnerRA" className="text-gray-700">
                    RA do Aluno (opcional)
                  </Label>
                  <Input
                    id="returnerRA"
                    value={returnData.ra}
                    onChange={(e) => onReturnDataChange({ ...returnData, ra: e.target.value })}
                    placeholder="Digite o RA"
                    className="bg-white border-gray-200"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="returnerEmail" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="returnerEmail"
                  type="email"
                  value={returnData.email}
                  onChange={(e) => onReturnDataChange({ ...returnData, email: e.target.value })}
                  placeholder="Digite o email"
                  className="bg-white border-gray-200"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QRCodeReader
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={handleQRCodeScan}
      />
    </>
  );
}
