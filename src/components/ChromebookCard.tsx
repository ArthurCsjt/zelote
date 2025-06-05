
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Edit, Trash2 } from "lucide-react";

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

interface ChromebookCardProps {
  chromebook: Chromebook;
  onEdit: (chromebook: Chromebook) => void;
  onDelete: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'disponivel':
      return 'bg-green-100 text-green-800';
    case 'emprestado':
      return 'bg-blue-100 text-blue-800';
    case 'manutencao':
      return 'bg-yellow-100 text-yellow-800';
    case 'danificado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
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

export function ChromebookCard({ chromebook, onEdit, onDelete }: ChromebookCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{chromebook.id}</CardTitle>
            <p className="text-sm text-gray-600">
              {chromebook.brand} {chromebook.model}
            </p>
          </div>
          <Badge className={getStatusColor(chromebook.status)}>
            {getStatusLabel(chromebook.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Serial:</span> {chromebook.serialNumber}
          </p>
          <p className="text-sm">
            <span className="font-medium">Patrimônio:</span> {chromebook.patrimony}
          </p>
          {chromebook.location && (
            <p className="text-sm">
              <span className="font-medium">Local:</span> {chromebook.location}
            </p>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(chromebook)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(chromebook.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
