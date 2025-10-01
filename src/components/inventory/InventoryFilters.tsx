import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

// Props que o componente de filtros espera receber.
// Ele recebe os valores e as funções para alterar esses valores.
interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  // Poderíamos adicionar locationFilter e setLocationFilter aqui no futuro
}

export const InventoryFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: InventoryFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
      {/* Campo de Busca */}
      <div className="relative w-full md:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, Modelo, Série ou Patrimônio..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filtro de Status */}
      <div className="w-full md:w-auto">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="emprestado">Emprestado</SelectItem>
            <SelectItem value="manutencao">Em Manutenção</SelectItem>
            <SelectItem value="fixo">Fixo em Sala</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};