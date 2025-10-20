import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, Search, Loader2, CheckCircle, X, Computer, AlertTriangle, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChromebookSearch, ChromebookSearchResult } from '@/hooks/useChromebookSearch';
import { Badge } from './ui/badge';
import { GlassCard } from './ui/GlassCard';

interface ChromebookSearchInputProps {
  selectedChromebook: ChromebookSearchResult | null;
  onSelect: (chromebook: ChromebookSearchResult) => void;
  onClear: () => void;
  disabled: boolean;
  filterStatus?: 'disponivel' | 'ativo' | 'all';
  onScanClick: () => void;
}

const ChromebookSearchInput: React.FC<ChromebookSearchInputProps> = ({ 
  selectedChromebook, 
  onSelect, 
  onClear, 
  disabled,
  filterStatus = 'all',
  onScanClick
}) => {
  const { chromebooks, loading } = useChromebookSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredChromebooks = useMemo(() => {
    if (!searchTerm || !isFocused) return [];
    
    let filtered = chromebooks;

    // 1. Filtrar por status
    if (filterStatus === 'disponivel') {
      filtered = filtered.filter(cb => cb.status === 'disponivel');
    } else if (filterStatus === 'ativo') {
      filtered = filtered.filter(cb => cb.status === 'emprestado');
    }

    // 2. Filtrar por termo de busca
    const lowerCaseSearch = searchTerm.toLowerCase();
    filtered = filtered.filter(cb => cb.searchable.includes(lowerCaseSearch));
    
    return filtered.slice(0, 10); // Limita a 10 resultados
  }, [chromebooks, searchTerm, filterStatus, isFocused]);

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
    setSearchTerm('');
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Se um item estiver selecionado, exibe o card de confirmação
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

  // Se nenhum item estiver selecionado, exibe o campo de busca
  return (
    <div className="relative space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            placeholder="Buscar ID, modelo ou patrimônio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Pequeno delay para permitir o clique
            className="pl-10 w-full bg-white border-gray-200"
            disabled={disabled || loading}
          />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          className="border-gray-200 bg-white hover:bg-gray-50 px-3"
          onClick={onScanClick}
          disabled={disabled || loading}
        >
          <QrCode className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Lista de Sugestões (aparece abaixo do input) */}
      {isFocused && searchTerm && filteredChromebooks.length > 0 && (
        <ScrollArea className="absolute z-20 w-full max-h-60 rounded-md border bg-white shadow-lg">
          <div className="p-1">
            {filteredChromebooks.map((chromebook) => (
              <div
                key={chromebook.id}
                className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                onMouseDown={() => handleSelect(chromebook)} // Usar onMouseDown para evitar que o onBlur feche antes do clique
              >
                <div className="flex items-center">
                  <Computer className="mr-2 h-4 w-4 text-gray-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{chromebook.chromebook_id}</span>
                    <span className="text-xs text-muted-foreground">{chromebook.model}</span>
                  </div>
                </div>
                {getStatusBadge(chromebook.status)}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {loading && (
        <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Buscando...
        </div>
      )}
      
      {isFocused && searchTerm && filteredChromebooks.length === 0 && !loading && (
        <div className="p-2 text-sm text-muted-foreground text-center border rounded-md bg-white">
          Nenhum Chromebook encontrado.
        </div>
      )}
    </div>
  );
};

export default ChromebookSearchInput;