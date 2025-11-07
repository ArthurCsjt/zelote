import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, User, Search, Loader2 } from 'lucide-react';
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
    return professores.filter(p => p.nome_completo.toLowerCase().includes(lowerCaseSearch));
  }, [professores, searchTerm]);

  const handleSelect = (professor: Professor) => {
    onSelect(professor.id);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-input dark:bg-input dark:border-border"
          disabled={disabled}
        >
          <div className="flex items-center truncate">
            <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {selectedProfessor ? selectedProfessor.nome_completo : "Selecione o professor"}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[350px] p-0 bg-card border-border"
      >
        <Command>
          <CommandInput 
            placeholder="Buscar professor..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>Nenhum professor encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredProfessores.map((professor) => (
                <CommandItem
                  key={professor.id}
                  value={professor.nome_completo}
                  onSelect={() => handleSelect(professor)}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-foreground truncate">
                      {professor.nome_completo}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
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