
import { useState, useEffect, useCallback, useMemo } from "react";
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
  console.log('ChromebookInventory component mounted');
  
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage
  useEffect(() => {
    console.log('Loading chromebooks from localStorage');
    
    try {
      const savedChromebooks = localStorage.getItem('chromebooks');
      if (savedChromebooks) {
        const parsed = JSON.parse(savedChromebooks);
        console.log('Loaded chromebooks:', parsed.length);
        setChromebooks(parsed);
      } else {
        console.log('No saved chromebooks found');
      }
    } catch (error) {
      console.error('Error loading chromebooks from localStorage:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados salvos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filtrar chromebooks
  const filteredChromebooks = useMemo(() => {
    console.log('Filtering chromebooks, search:', searchTerm, 'status:', statusFilter);
    
    let filtered = chromebooks;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(chromebook =>
        chromebook.id.toLowerCase().includes(searchLower) ||
        chromebook.brand.toLowerCase().includes(searchLower) ||
        chromebook.model.toLowerCase().includes(searchLower) ||
        chromebook.serialNumber.toLowerCase().includes(searchLower) ||
        chromebook.patrimony.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(chromebook => chromebook.status === statusFilter);
    }

    console.log('Filtered chromebooks count:', filtered.length);
    return filtered;
  }, [chromebooks, searchTerm, statusFilter]);

  // Salvar no localStorage
  const saveToLocalStorage = useCallback((data: Chromebook[]) => {
    try {
      localStorage.setItem('chromebooks', JSON.stringify(data));
      console.log('Saved chromebooks to localStorage:', data.length);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados",
        variant: "destructive",
      });
    }
  }, []);

  const handleAddChromebook = useCallback((chromebook: Chromebook) => {
    console.log('Adding new chromebook:', chromebook.id);
    
    // Verificar se ID já existe
    if (chromebooks.some(cb => cb.id === chromebook.id)) {
      toast({
        title: "Erro",
        description: `Chromebook com ID ${chromebook.id} já existe`,
        variant: "destructive",
      });
      return;
    }

    const updatedChromebooks = [...chromebooks, chromebook];
    setChromebooks(updatedChromebooks);
    saveToLocalStorage(updatedChromebooks);
    setIsAddDialogOpen(false);
    
    toast({
      title: "Sucesso",
      description: `Chromebook ${chromebook.id} adicionado com sucesso`,
    });
  }, [chromebooks, saveToLocalStorage]);

  const handleDeleteChromebook = useCallback((id: string) => {
    console.log('Deleting chromebook:', id);
    
    if (window.confirm(`Tem certeza que deseja excluir o Chromebook ${id}?`)) {
      const updatedChromebooks = chromebooks.filter(cb => cb.id !== id);
      setChromebooks(updatedChromebooks);
      saveToLocalStorage(updatedChromebooks);
      
      toast({
        title: "Sucesso",
        description: "Chromebook removido com sucesso",
      });
    }
  }, [chromebooks, saveToLocalStorage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando inventário...</p>
        </div>
      </div>
    );
  }

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
              Gerencie todos os Chromebooks cadastrados
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
            Clique em um card para expandir
          </div>
        </div>
        
        {filteredChromebooks.length > 0 ? (
          <div className="space-y-4">
            {filteredChromebooks.map((chromebook) => (
              <ExpandableChromebookCard
                key={`${chromebook.id}-${chromebook.serialNumber}`}
                chromebook={chromebook}
                onDelete={handleDeleteChromebook}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all" ? "Nenhum Chromebook encontrado" : "Nenhum Chromebook cadastrado"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de pesquisa" 
                : "Comece adicionando seu primeiro Chromebook"
              }
            </p>
            {(!searchTerm && statusFilter === "all") && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Chromebook
              </Button>
            )}
          </div>
        )}
      </div>

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
