
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Save, X, Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  manufacturingYear?: string;
  isProvisioned?: boolean;
}

interface EditableChromebookCardProps {
  chromebook: Chromebook;
  onSave: (chromebook: Chromebook) => void;
  onDelete: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'disponivel':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'emprestado':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'manutencao':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'danificado':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'disponivel':
      return 'Disponível';
    case 'emprestado':
      return 'Emprestado';
    case 'manutencao':
      return 'Manutenção';
    case 'danificado':
      return 'Danificado';
    default:
      return status;
  }
};

export function EditableChromebookCard({ chromebook, onSave, onDelete }: EditableChromebookCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Chromebook>(chromebook);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditData(chromebook);
  }, [chromebook]);

  const handleSave = () => {
    if (!editData.id || !editData.brand || !editData.model || !editData.serialNumber) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    onSave(editData);
    setIsEditing(false);
    
    toast({
      title: "Sucesso",
      description: "Chromebook atualizado com sucesso",
    });
  };

  const handleCancel = () => {
    setEditData(chromebook);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Scroll to card for better UX
    setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  if (isEditing) {
    return (
      <Card 
        ref={cardRef}
        className="shadow-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white transition-all duration-300 rounded-xl overflow-hidden"
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Editando Chromebook
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ID *</label>
                <Input
                  value={editData.id}
                  onChange={(e) => setEditData({ ...editData, id: e.target.value })}
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Fabricante *</label>
                <Input
                  value={editData.brand}
                  onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Modelo *</label>
                <Input
                  value={editData.model}
                  onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Número de Série *</label>
                <Input
                  value={editData.serialNumber}
                  onChange={(e) => setEditData({ ...editData, serialNumber: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Patrimônio</label>
                <Input
                  value={editData.patrimony}
                  onChange={(e) => setEditData({ ...editData, patrimony: e.target.value })}
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                <Select
                  value={editData.status}
                  onValueChange={(value: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado') => 
                    setEditData({ ...editData, status: value })
                  }
                >
                  <SelectTrigger className="h-9">
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
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Local</label>
                <Input
                  value={editData.location || ''}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="h-9"
                  placeholder="Ex: Sala 101"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ano de Fabricação</label>
                <Input
                  type="number"
                  value={editData.manufacturingYear || ''}
                  onChange={(e) => setEditData({ ...editData, manufacturingYear: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Data de Aquisição</label>
              <Input
                type="date"
                value={editData.acquisitionDate || ''}
                onChange={(e) => setEditData({ ...editData, acquisitionDate: e.target.value })}
                className="h-9 max-w-xs"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isProvisioned"
                checked={editData.isProvisioned || false}
                onCheckedChange={(checked) => setEditData({ ...editData, isProvisioned: checked as boolean })}
              />
              <label htmlFor="isProvisioned" className="text-sm font-medium text-gray-700">
                Equipamento já provisionado
              </label>
            </div>
            
            {editData.isProvisioned && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Observações</label>
                <Textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="min-h-[80px] resize-none"
                  placeholder="Digite observações relevantes sobre o equipamento"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl overflow-hidden hover:scale-[1.02] cursor-pointer bg-gradient-to-r from-white to-gray-50">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-xl text-gray-900">{chromebook.id}</h3>
              <Badge className={cn("text-xs font-medium border", getStatusColor(chromebook.status))}>
                {getStatusLabel(chromebook.status)}
              </Badge>
            </div>
            <p className="text-base text-gray-700 font-medium">
              {chromebook.brand} {chromebook.model}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Série: {chromebook.serialNumber}
            </p>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 shadow-sm"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(chromebook.id)}
              className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Patrimônio</span>
              <span className="text-sm font-semibold text-gray-900">{chromebook.patrimony}</span>
            </div>
            
            {chromebook.location && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Local</span>
                <span className="text-sm font-semibold text-gray-900">{chromebook.location}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {chromebook.manufacturingYear && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Ano</span>
                <span className="text-sm font-semibold text-gray-900">{chromebook.manufacturingYear}</span>
              </div>
            )}
            
            {chromebook.acquisitionDate && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Aquisição</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(chromebook.acquisitionDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Provisionado</span>
              <Badge variant={chromebook.isProvisioned ? "default" : "secondary"} className="text-xs">
                {chromebook.isProvisioned ? "Sim" : "Não"}
              </Badge>
            </div>
            
            {chromebook.notes && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Observações</span>
                <span className="text-sm text-gray-900 line-clamp-2">{chromebook.notes}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
