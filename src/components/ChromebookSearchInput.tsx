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
  /** Se true, o componente não exibe o cartão de confirmação, apenas o input. */
  isListMode?: boolean;
}

const ChromebookSearchInput: React.FC<ChromebookSearchInputProps> = ({
  selectedChromebook,
  onSelect,
  onClear,
  disabled,
  filterStatus = 'all',
  onScanClick,
  isListMode = false,
}) => {
  const { chromebooks, loading } = useChromebookSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredChromebooks = useMemo(() => {
    if (!searchTerm || !isFocused) return [];

    let filtered = chromebooks;

    // 1. Filtrar por status (apenas se NÃO for isListMode)
    if (!isListMode) {
      if (filterStatus === 'disponivel') {
        filtered = filtered.filter(cb => cb.status === 'disponivel');
      } else if (filterStatus === 'ativo') {
        filtered = filtered.filter(cb => cb.status === 'emprestado');
      }
    }

    // 2. Filtrar por termo de busca e ordenar por relevância
    const lowerCaseSearch = searchTerm.toLowerCase();
    const isNumeric = /^\d+$/.test(searchTerm);

    return filtered
      .map(cb => {
        let score = 0;
        const idLower = cb.chromebook_id.toLowerCase();

        // 1. Prioridade máxima: ID exato
        if (idLower === lowerCaseSearch) {
          score += 100;
        }
        // 2. Match numérico inteligente (ex: "1" encontra "CHR001")
        else if (isNumeric) {
          const idMatch = idLower.match(/\d+/);
          const idNumber = idMatch ? parseInt(idMatch[0], 10) : null;
          if (idNumber === parseInt(searchTerm, 10)) {
            score += 90;
          } else if (idLower.includes(lowerCaseSearch)) {
            score += 70;
          }
        }
        // 3. Começa com o termo (no ID)
        else if (idLower.startsWith(lowerCaseSearch)) {
          score += 80;
        }
        // 4. Contém no ID em qualquer parte
        else if (idLower.includes(lowerCaseSearch)) {
          score += 70;
        }
        // 5. Contém em outros campos (modelo, série, patrimônio, fabricante)
        else if (cb.searchable.includes(lowerCaseSearch)) {
          // Se for numérico e estiver apenas no modelo (ex: "1" em "100e"), a pontuação é baixa
          score += 10;
        }

        return { ...cb, score };
      })
      .filter(cb => (cb as any).score > 0)
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, 10); // Limita a 10 resultados
  }, [chromebooks, searchTerm, filterStatus, isFocused, isListMode]);

  const getStatusBadge = (status: ChromebookSearchResult['status']) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-success-bg text-success-foreground hover:bg-success-bg dark:bg-success-bg/50 dark:text-success-foreground">Disponível</Badge>;
      case 'emprestado':
        return <Badge className="bg-warning-bg text-warning-foreground hover:bg-warning-bg dark:bg-warning-bg/50 dark:text-warning-foreground">Emprestado</Badge>;
      case 'manutencao':
        return <Badge variant="destructive" className="bg-error-bg text-error-foreground hover:bg-error-bg dark:bg-error-bg/50 dark:text-error-foreground">Manutenção</Badge>;
      case 'fixo':
        return <Badge className="bg-info-bg text-info-foreground hover:bg-info-bg dark:bg-info-bg/50 dark:text-info-foreground">Fixo</Badge>;
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

  // Se isListMode for false E um item estiver selecionado, exibe o card de confirmação
  if (selectedChromebook && !isListMode) {
    const isAvailable = selectedChromebook.status === 'disponivel';
    const isEmprestado = selectedChromebook.status === 'emprestado';

    let cardClass = "p-3 border-2 shadow-md";
    let icon = <CheckCircle className="h-5 w-5 text-green-600" />;

    if (filterStatus === 'disponivel' && !isAvailable) {
      cardClass = "p-3 border-2 border-error/50 bg-error-bg/50 shadow-md dark:bg-error-bg/50 dark:border-error/50";
      icon = <AlertTriangle className="h-5 w-5 text-error dark:text-error-foreground" />;
    } else if (filterStatus === 'ativo' && !isEmprestado) {
      cardClass = "p-3 border-2 border-error/50 bg-error-bg/50 shadow-md dark:bg-error-bg/50 dark:border-error/50";
      icon = <AlertTriangle className="h-5 w-5 text-error dark:text-error-foreground" />;
    } else {
      cardClass = "p-3 border-2 border-success/50 bg-success-bg/50 shadow-md dark:bg-success-bg/50 dark:border-success/50";
    }

    return (
      <GlassCard className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <p className="font-semibold text-sm text-foreground">{selectedChromebook.chromebook_id}</p>
              <p className="text-xs text-muted-foreground">{selectedChromebook.model}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-border">
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

  // Se isListMode for true OU nenhum item estiver selecionado, exibe o campo de busca
  return (
    <div className="relative space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar ID, modelo ou patrimônio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Pequeno delay para permitir o clique
            className="pl-10 w-full bg-input-bg border-input dark:bg-input-bg dark:border-input" // CORRIGIDO
            disabled={disabled || loading}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-input bg-input-bg hover:bg-accent px-3 dark:bg-input-bg dark:border-input dark:hover:bg-accent" // CORRIGIDO
          onClick={onScanClick}
          disabled={disabled || loading}
        >
          <QrCode className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Lista de Sugestões (aparece abaixo do input) */}
      {isFocused && searchTerm && filteredChromebooks.length > 0 && (
        <ScrollArea className="absolute z-20 w-full max-h-60 rounded-md border bg-card shadow-lg dark:bg-card dark:border-border">
          <div className="p-1">
            {filteredChromebooks.map((chromebook) => (
              <div
                key={chromebook.id}
                className="flex items-center justify-between p-2 cursor-pointer hover:bg-accent rounded-md dark:hover:bg-accent"
                onMouseDown={() => handleSelect(chromebook)} // Usar onMouseDown para evitar que o onBlur feche antes do clique
              >
                <div className="flex items-center">
                  <Computer className="mr-2 h-4 w-4 text-gray-500 dark:text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-foreground">{chromebook.chromebook_id}</span>
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
        <div className="p-2 text-sm text-muted-foreground text-center border rounded-md bg-card dark:bg-card dark:border-border">
          Nenhum Chromebook encontrado.
        </div>
      )}
    </div>
  );
};

export default ChromebookSearchInput;