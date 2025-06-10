
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
  const statusColors = {
    'disponivel': 'bg-green-100 text-green-800 border-green-200',
    'emprestado': 'bg-blue-100 text-blue-800 border-blue-200',
    'manutencao': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'danificado': 'bg-red-100 text-red-800 border-red-200'
  };
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusLabel = (status: string) => {
  const statusLabels = {
    'disponivel': 'Disponível',
    'emprestado': 'Emprestado',
    'manutencao': 'Manutenção',
    'danificado': 'Danificado'
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
};

export function EditableChromebookCard({ chromebook, onSave, onDelete }: EditableChromebookCardProps) {
  console.log('EditableChromebookCard rendered for:', chromebook.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Chromebook>(chromebook);
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Chromebook data updated:', chromebook.id);
    setEditData(chromebook);
  }, [chromebook]);

  const validateData = (data: Chromebook): boolean => {
    console.log('Validating chromebook data:', data);
    
    if (!data.id?.trim()) {
      toast({
        title: "Erro de Validação",
        description: "ID é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    
    if (!data.brand?.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Fabricante é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    
    if (!data.model?.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Modelo é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    
    if (!data.serialNumber?.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Número de série é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    console.log('Attempting to save chromebook:', editData.id);
    
    if (!validateData(editData)) {
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simular pequeno delay
      onSave(editData);
      setIsEditing(false);
      
      console.log('Chromebook saved successfully:', editData.id);
      toast({
        title: "Sucesso",
        description: "Chromebook atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error saving chromebook:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar chromebook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('Canceling edit for chromebook:', chromebook.id);
    setEditData(chromebook);
    setIsEditing(false);
  };

  const handleEdit = () => {
    console.log('Starting edit for chromebook:', chromebook.id);
    setIsEditing(true);
    
    setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleDelete = () => {
    console.log('Deleting chromebook:', chromebook.id);
    
    if (window.confirm(`Tem certeza que deseja excluir o Chromebook ${chromebook.id}?`)) {
      onDelete(chromebook.id);
    }
  };

  const handleFieldChange = (field: keyof Chromebook, value: any) => {
    console.log(`Updating field ${field} for chromebook ${chromebook.id}:`, value);
    setEditData(prev => ({ ...prev, [field]: value }));
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
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ID *</label>
                <Input
                  value={editData.id || ''}
                  onChange={(e) => handleFieldChange('id', e.target.value)}
                  className="h-9"
                  placeholder="ID do Chromebook"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Fabricante *</label>
                <Input
                  value={editData.brand || ''}
                  onChange={(e) => handleFieldChange('brand', e.target.value)}
                  className="h-9"
                  placeholder="Ex: Acer, Lenovo"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Modelo *</label>
                <Input
                  value={editData.model || ''}
                  onChange={(e) => handleFieldChange('model', e.target.value)}
                  className="h-9"
                  placeholder="Modelo do equipamento"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Número de Série *</label>
                <Input
                  value={editData.serialNumber || ''}
                  onChange={(e) => handleFieldChange('serialNumber', e.target.value)}
                  className="h-9"
                  placeholder="Número de série"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Patrimônio</label>
                <Input
                  value={editData.patrimony || ''}
                  onChange={(e) => handleFieldChange('patrimony', e.target.value)}
                  className="h-9"
                  placeholder="Número do patrimônio"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                <Select
                  value={editData.status}
                  onValueChange={(value: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado') => 
                    handleFieldChange('status', value)
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
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  className="h-9"
                  placeholder="Ex: Sala 101"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ano de Fabricação</label>
                <Input
                  type="number"
                  value={editData.manufacturingYear || ''}
                  onChange={(e) => handleFieldChange('manufacturingYear', e.target.value)}
                  className="h-9"
                  placeholder="Ex: 2023"
                  min="2000"
                  max={new Date().getFullYear()}
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
                onChange={(e) => handleFieldChange('acquisitionDate', e.target.value)}
                className="h-9 max-w-xs"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isProvisioned"
                checked={editData.isProvisioned || false}
                onCheckedChange={(checked) => handleFieldChange('isProvisioned', checked)}
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
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
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
    <Card 
      className="group shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl overflow-hidden hover:scale-[1.02] cursor-pointer bg-gradient-to-r from-white to-gray-50"
      onClick={handleEdit}
    >
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
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 shadow-sm"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
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
              <span className="text-sm font-semibold text-gray-900">{chromebook.patrimony || 'N/A'}</span>
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
