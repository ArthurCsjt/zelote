
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Filter } from "lucide-react";

interface ChromebookFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function ChromebookFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange 
}: ChromebookFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por ID, marca, modelo, número de série..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="emprestado">Emprestado</SelectItem>
            <SelectItem value="manutencao">Manutenção</SelectItem>
            <SelectItem value="danificado">Danificado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
