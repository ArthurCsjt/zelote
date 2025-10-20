import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Loader2, CheckCircle, X, Computer, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChromebookSearch, ChromebookSearchResult } from '@/hooks/useChromebookSearch';
import { Badge } from './ui/badge';
import { GlassCard } from './ui/GlassCard';

interface ChromebookAutocompleteProps {
  selectedChromebook: ChromebookSearchResult | null;
  onSelect: (chromebook: ChromebookSearchResult) => void;
  onClear: () => void;
  disabled: boolean;
  // Opcional: Filtro para mostrar apenas status 'disponivel'
  filterStatus?: 'disponivel' | 'ativo' | 'all';
}

const ChromebookAutocomplete: React.FC<ChromebookAutocompleteProps> = ({ 
  selectedChromebook, 
  onSelect, 
  onClear, 
  disabled,
  filterStatus = 'all'
}) => {
  const [open, setOpen] = useState(false);
  const { chromebooks, loading } = useChromebookSearch();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChromebooks = useMemo(() => {
    let filtered = chromebooks;

    // 1. Filtrar por status
    if (filterStatus === 'disponivel') {
      filtered = filtered.filter(cb => cb.status === 'disponivel');
    } else if (filterStatus === 'ativo') {
      // Para devolução, queremos itens que estão emprestados
      filtered = filtered.filter(cb => cb.status === 'emprestado');
    }

    // 2. Filtrar por termo de busca
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(cb => cb.searchable.includes(lowerCaseSearch));
    }
    
    return filtered;
  }, [chromebooks, searchTerm, filterStatus]);

  const getStatusBadge = (status: ChromebookSearchResult['status']) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Disponível</Badge>;
      case 'emprestado':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Emprestado</Badge>;
      case 'manutencao':
        return <Badge variant="destructive">Manutenção</Badge>;
      case 'fixo':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Fixo</Badge>;
      default:
        return <Badge variant="secondary">Outro</Badge>;
    }
  };

  const handleSelect = (chromebook: ChromebookSearchResult) => {
    onSelect(chromebook);
    setOpen(false);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3 bg-muted rounded-md">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando inventário...
      </div>
    );
  }

  if (selectedChromebook) {
    const isAvailable = selectedChromebook.status === 'disponivel';
    const isEmprestado = selectedChromebook.status === 'emprestado';
    
    let cardClass = "p-3 border-2 shadow-md";
    let icon = <CheckCircle className="h-5 w-5 text-green-600" />;
    
    if (filterStatus === 'disponivel' && !isAvailable) {
        cardClass = "p-3 border-2 border-red-400 bg-red-50/50 shadow-md";
        icon = <AlertTriangle className="h-5 w-5 text-red-600" />;
    } else if (filterStatus === 'ativo' && !isEmprestado) {
        cardClass = "p-3 border-2 border-red-400 bg-red-50/50 shadow-md";
        icon = <AlertTriangle className="h-5 w-5 text-red-600" />;
    } else {
        cardClass = "p-3 border-2 border-green-400 bg-green-50/50 shadow-md";
    }

    return (
      <GlassCard className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <p className="font-semibold text-sm">{selectedChromebook.chromebook_id}</p>
              <p className="text-xs text-muted-foreground">{selectedChromebook.model}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200">
          {getStatusBadge(selectedChromebook.status)}
          {filterStatus === 'disponivel' && !isAvailable && (
            <Badge variant="destructive">Status: {selectedChromebook.status.toUpperCase()}</Badge>
          )}
          {filterStatus === 'ativo' && !isEmprestado && (
            <Badge variant="destructive">Status: {selectedChromebook.status.toUpperCase()}</Badge>
          )}
        </div>
      </GlassCard>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white border-gray-200"
          disabled={disabled}
        >
          <div className="flex items-center">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {"Buscar ID, modelo ou patrimônio..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar Chromebook..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>Nenhum Chromebook encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredChromebooks.map((chromebook) => (
                <CommandItem
                  key={chromebook.id}
                  value={chromebook.searchable}
                  onSelect={() => handleSelect(chromebook)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Computer className="mr-2 h-4 w-4 text-gray-500" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{chromebook.chromebook_id}</span>
                      <span className="text-xs text-muted-foreground">{chromebook.model}</span>
                    </div>
                  </div>
                  {getStatusBadge(chromebook.status)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ChromebookAutocomplete;