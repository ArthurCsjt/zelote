import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Professor {
  id: string;
  nome_completo: string;
}

interface ProfessorAutocompleteProps {
  professores: Professor[];
  selectedProfessorId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export const ProfessorAutocomplete: React.FC<ProfessorAutocompleteProps> = ({
  professores,
  selectedProfessorId,
  onSelect,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedProfessor = useMemo(() => 
    professores.find(p => p.id === selectedProfessorId), 
    [professores, selectedProfessorId]
  );

  const filteredProfessores = useMemo(() => {
    if (!searchTerm) return professores;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return professores.filter(p => 
      p.nome_completo.toLowerCase().includes(lowerCaseSearch)
    );
  }, [professores, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11",
            "bg-input dark:bg-input dark:border-border",
            "hover:bg-accent transition-colors",
            !selectedProfessor && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {selectedProfessor ? (
            <div className="flex items-center gap-2 truncate">
              {/* Avatar com inicial */}
              <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 dark:bg-purple-900/50">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {selectedProfessor.nome_completo.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="truncate text-foreground">{selectedProfessor.nome_completo}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 opacity-50" />
              <span>Selecione o professor</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          "bg-card border-border shadow-xl",
          "max-h-[300px]" // LIMITE DE ALTURA
        )}
        align="start"
        side="bottom"
      >
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Buscar professor..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="border-b border-border dark:border-border"
          />
          <CommandList className="max-h-[240px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              Nenhum professor encontrado.
            </CommandEmpty>
            <CommandGroup>
              {filteredProfessores.map((professor) => (
                <CommandItem
                  key={professor.id}
                  value={professor.nome_completo}
                  onSelect={() => {
                    onSelect(professor.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2",
                    "hover:bg-accent cursor-pointer",
                    "transition-colors"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    selectedProfessorId === professor.id 
                      ? "bg-purple-600 text-white" 
                      : "bg-purple-500/10 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
                  )}>
                    <span className="text-sm font-semibold">
                      {professor.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Nome */}
                  <span className="flex-1 font-medium text-sm truncate text-foreground">
                    {professor.nome_completo}
                  </span>
                  
                  {/* Check */}
                  <Check
                    className={cn(
                      "h-4 w-4 text-primary transition-opacity",
                      selectedProfessorId === professor.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};