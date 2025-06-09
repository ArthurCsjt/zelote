
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
import { EditableChromebookCard } from "./EditableChromebookCard";
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

  const handleSaveChromebook = (updatedChromebook: Chromebook) => {
    const updatedChromebooks = chromebooks.map(cb => 
      cb.id === updatedChromebook.id ? updatedChromebook : cb
    );
    setChromebooks(updatedChromebooks);
    localStorage.setItem('chromebooks', JSON.stringify(updatedChromebooks));
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} className="shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Inventário de Chromebooks
            </h1>
            <p className="text-gray-600">
              Gerencie todos os Chromebooks cadastrados com edição inline
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Chromebook
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <ChromebookFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      {/* Statistics */}
      <ChromebookStats chromebooks={chromebooks} />

      {/* Chromebooks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Lista de Chromebooks ({filteredChromebooks.length})
          </h2>
          <div className="text-sm text-gray-500">
            Clique em um card para ver mais detalhes
          </div>
        </div>
        
        {filteredChromebooks.map((chromebook) => (
          <EditableChromebookCard
            key={chromebook.id}
            chromebook={chromebook}
            onSave={handleSaveChromebook}
            onDelete={handleDeleteChromebook}
          />
        ))}
      </div>

      {filteredChromebooks.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Chromebook encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Tente ajustar os filtros de pesquisa" 
              : "Comece adicionando seu primeiro Chromebook"
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Chromebook
            </Button>
          )}
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
