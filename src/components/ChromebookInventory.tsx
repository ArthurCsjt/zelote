import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
import { ExpandableChromebookCard } from "./ExpandableChromebookCard";
import { ChromebookFilters } from "./ChromebookFilters";
import { ChromebookStats } from "./ChromebookStats";
import { AddChromebookDialog } from "./AddChromebookDialog";

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

export function ChromebookInventory({ onBack }: { onBack: () => void }) {
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [filteredChromebooks, setFilteredChromebooks] = useState<Chromebook[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const savedChromebooks = localStorage.getItem('chromebooks');
    if (savedChromebooks) {
      const parsed = JSON.parse(savedChromebooks);
      setChromebooks(parsed);
      setFilteredChromebooks(parsed);
    }
  }, []);

  useEffect(() => {
    let filtered = chromebooks;

    if (searchTerm) {
      filtered = filtered.filter(chromebook =>
        chromebook.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.patrimony.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(chromebook => chromebook.status === statusFilter);
    }

    setFilteredChromebooks(filtered);
  }, [chromebooks, searchTerm, statusFilter]);

  const handleAddChromebook = (chromebook: Chromebook) => {
    const updatedChromebooks = [...chromebooks, chromebook];
    setChromebooks(updatedChromebooks);
    localStorage.setItem('chromebooks', JSON.stringify(updatedChromebooks));
    setIsAddDialogOpen(false);
  };

  const handleDeleteChromebook = (id: string) => {
    const updatedChromebooks = chromebooks.filter(cb => cb.id !== id);
    setChromebooks(updatedChromebooks);
    localStorage.setItem('chromebooks', JSON.stringify(updatedChromebooks));
    
    toast({
      title: "Sucesso",
      description: "Chromebook removido com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inventário de Chromebooks
            </h1>
            <p className="text-gray-600">
              Gerencie todos os Chromebooks cadastrados
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Chromebook
        </Button>
      </div>

      {/* Filters and Search */}
      <ChromebookFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Statistics */}
      <ChromebookStats chromebooks={chromebooks} />

      {/* Chromebooks List */}
      <div className="space-y-4">
        {filteredChromebooks.map((chromebook) => (
          <ExpandableChromebookCard
            key={chromebook.id}
            chromebook={chromebook}
            onDelete={handleDeleteChromebook}
          />
        ))}
      </div>

      {filteredChromebooks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum Chromebook encontrado</p>
        </div>
      )}

      {/* Add Dialog */}
      <AddChromebookDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddChromebook}
        existingIds={chromebooks.map(cb => cb.id)}
      />
    </div>
  );
}
