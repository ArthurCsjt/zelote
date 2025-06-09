
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ExpandableChromebookCardProps {
  chromebook: Chromebook;
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

export function ExpandableChromebookCard({ chromebook, onDelete }: ExpandableChromebookCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 rounded-xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{chromebook.id}</h3>
                  <Badge className={cn("text-xs", getStatusColor(chromebook.status))}>
                    {getStatusLabel(chromebook.status)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {chromebook.brand} {chromebook.model}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Série: {chromebook.serialNumber}
                </p>
              </div>
              <ChevronDown 
                className={cn(
                  "h-5 w-5 text-gray-400 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
            <div className="pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID</span>
                    <span className="text-sm font-medium text-gray-900">{chromebook.id}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fabricante</span>
                    <span className="text-sm text-gray-900">{chromebook.brand}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Modelo</span>
                    <span className="text-sm text-gray-900">{chromebook.model}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Série</span>
                    <span className="text-sm text-gray-900">{chromebook.serialNumber}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {chromebook.manufacturingYear && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ano de Fabricação</span>
                      <span className="text-sm text-gray-900">{chromebook.manufacturingYear}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patrimônio</span>
                    <span className="text-sm text-gray-900">{chromebook.patrimony}</span>
                  </div>
                  
                  {chromebook.location && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Local</span>
                      <span className="text-sm text-gray-900">{chromebook.location}</span>
                    </div>
                  )}
                  
                  {chromebook.acquisitionDate && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Aquisição</span>
                      <span className="text-sm text-gray-900">
                        {new Date(chromebook.acquisitionDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Provisionado</span>
                  <Badge variant={chromebook.isProvisioned ? "default" : "secondary"} className="text-xs">
                    {chromebook.isProvisioned ? "Sim" : "Não"}
                  </Badge>
                </div>
                
                {chromebook.notes && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Observações</span>
                    <span className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200 mt-1">
                      {chromebook.notes}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chromebook.id);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
