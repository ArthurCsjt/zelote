import React, { useState } from 'react';
import { Check, ChevronsUpDown, Search, Loader2, CheckCircle, X, Monitor, Clock, AlertTriangle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from './ui/badge';
import { GlassCard } from './ui/GlassCard';
import { useChromebookSearch, ChromebookSearchResult } from '@/hooks/useChromebookSearch';

interface ChromebookAutocompleteProps {
  selectedChromebook: ChromebookSearchResult | null;
  onSelect: (chromebook: ChromebookSearchResult) => void;
  onClear: () => void;
  disabled: boolean;
  placeholder?: string;
  // Adicionado para permitir filtrar por status (ex: apenas 'disponivel' para empréstimo)
  filterStatus?: 'disponivel' | 'emprestado' | 'fixo' | 'manutencao' | 'fora_uso' | 'all';
}

const ChromebookAutocomplete: React.FC<ChromebookAutocompleteProps> = ({ 
  selectedChromebook, 
  onSelect, 
  onClear, 
  disabled, 
  placeholder = "Buscar ID, Série ou Patrimônio...",
  filterStatus = 'all'
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { chromebooks, loading } = useChromebookSearch(searchTerm);

  const getStatusBadge = (status: ChromebookSearchResult['status']) => {
    switch (status) {
      case 'disponivel':
        return { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100', icon: <CheckCircle className="h-3 w-3 mr-1" /> };
      case 'emprestado':
        return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100', icon: <Clock className="h-3 w-3 mr-1" /> };
      case 'fixo':
        return { variant: 'outline', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100', icon: <MapPin className="h-3 w-3 mr-1" /> };
      case 'manutencao':
      case 'fora_uso':
        return { variant: 'destructive', className: '', icon: <AlertTriangle className="h-3 w-3 mr-1" /> };
      default:
        return { variant: 'secondary', className: '', icon: <Monitor className="h-3 w-3 mr-1" /> };
    }
  };
  
  const filteredChromebooks = chromebooks.filter(cb => {
    if (filterStatus === 'all') return true;
    return cb.status === filterStatus;
  });

  const handleSelect = (chromebook: ChromebookSearchResult) => {
    onSelect(chromebook);
    setOpen(false);
    setSearchTerm(''); // Limpa o termo de pesquisa após a seleção
  };

  if (loading && !selectedChromebook && searchTerm.length >= 2) {
    return (
      <div className="flex items-center justify-center p-3 bg-muted rounded-md">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Buscando equipamentos...
      </div>
    );
  }

  if (selectedChromebook) {
    const statusInfo = getStatusBadge(selectedChromebook.status);
    
    return (
      <GlassCard className={`p-3 border-2 ${selectedChromebook.status === 'disponivel' ? 'border-green-400 bg-green-50/50' : 'border-red-400 bg-red-50/50'} shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {statusInfo.icon}
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
          <Badge variant="secondary" className={statusInfo.className}>
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
          {selectedChromebook.serial_number && <Badge variant="outline">Série: {selectedChromebook.serial_number}</Badge>}
          {selectedChromebook.patrimony_number && <Badge variant="outline">Patrimônio: {selectedChromebook.patrimony_number}</Badge>}
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
            {searchTerm || placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0">
        <Command>
          <CommandInput 
            placeholder={placeholder} 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading && searchTerm.length >= 2 ? (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Buscando...
                </div>
            ) : (
                <>
                    <CommandEmpty>
                      {searchTerm.length < 2 ? "Digite pelo menos 2 caracteres para buscar." : "Nenhum Chromebook encontrado."}
                    </CommandEmpty>
                    <CommandGroup>
                    {filteredChromebooks.map((cb) => {
                        const statusInfo = getStatusBadge(cb.status);
                        const isAvailable = cb.status === 'disponivel';
                        const isSelectable = filterStatus === 'all' || isAvailable;
                        
                        return (
                            <CommandItem
                                key={cb.id}
                                value={`${cb.chromebook_id} ${cb.model} ${cb.serial_number} ${cb.patrimony_number}`} 
                                onSelect={() => isSelectable && handleSelect(cb)}
                                className={cn(
                                    "flex items-center justify-between",
                                    !isSelectable && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={!isSelectable}
                            >
                                <div className="flex items-center">
                                    <Monitor className="mr-2 h-4 w-4 text-gray-500" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{cb.chromebook_id}</span>
                                        <span className="text-xs text-muted-foreground">{cb.model}</span>
                                    </div>
                                </div>
                                <Badge variant="secondary" className={statusInfo.className}>
                                    {statusInfo.icon}
                                    {statusInfo.label}
                                </Badge>
                            </CommandItem>
                        );
                    })}
                    </CommandGroup>
                </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ChromebookAutocomplete;