
import { Card, CardContent } from "./ui/card";

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

interface ChromebookStatsProps {
  chromebooks: Chromebook[];
}

export function ChromebookStats({ chromebooks }: ChromebookStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {chromebooks.filter(cb => cb.status === 'disponivel').length}
          </div>
          <p className="text-sm text-gray-600">Disponíveis</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {chromebooks.filter(cb => cb.status === 'emprestado').length}
          </div>
          <p className="text-sm text-gray-600">Emprestados</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {chromebooks.filter(cb => cb.status === 'manutencao').length}
          </div>
          <p className="text-sm text-gray-600">Manutenção</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {chromebooks.filter(cb => cb.status === 'danificado').length}
          </div>
          <p className="text-sm text-gray-600">Danificados</p>
        </CardContent>
      </Card>
    </div>
  );
}
