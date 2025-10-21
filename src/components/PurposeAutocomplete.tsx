import React, { useState, useMemo, useCallback } from 'react';
import { Check, ChevronsUpDown, User, GraduationCap, Briefcase, Search, Loader2, CheckCircle, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUserSearch, UserSearchResult } from '@/hooks/useUserSearch';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface PurposeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  userType: 'aluno' | 'professor' | 'funcionario';
}

const PurposeAutocomplete: React.FC<PurposeAutocompleteProps> = ({ value, onChange, disabled, placeholder, userType }) => {
  const [open, setOpen] = useState(false);
  const { users, loading } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra apenas Professores e Funcionários para sugestões de finalidade
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    
    return users
      .filter(user => (user.type === 'professor' || user.type === 'funcionario') && user.searchable.includes(lowerCaseSearch))
      .slice(0, 5);
  }, [users, searchTerm]);

  const getUserIcon = (type: string) => {
    switch (type) {
      case 'professor':
        return <GraduationCap className="mr-2 h-4 w-4 text-purple-500" />;
      case 'funcionario':
        return <Briefcase className="mr-2 h-4 w-4 text-orange-500" />;
      default:
        return <User className="mr-2 h-4 w-4 text-gray-500" />;
    }
  };
  
  const handleSelectUser = (user: UserSearchResult) => {
    const purposeValue = `${user.type.charAt(0).toUpperCase() + user.type.slice(1)}: ${user.name}`;
    onChange(purposeValue);
    setOpen(false);
    setSearchTerm('');
  };
  
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
  };
  
  // Se o usuário for um aluno, o campo deve ser de texto livre (aula)
  if (userType === 'aluno') {
    return (
      <div className="relative">
        <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 bg-white border-gray-200 dark:bg-card dark:border-border"
          disabled={disabled}
          required
        />
      </div>
    );
  }

  // Se for Professor ou Funcionário, permite busca e texto livre
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white border-gray-200 dark:bg-card dark:border-border"
          disabled={disabled}
        >
          <div className="flex items-center truncate">
            <BookOpen className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {value ? value : placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar professor/departamento ou digitar aula..." 
            value={searchTerm}
            onValueChange={(v) => {
                setSearchTerm(v);
                onChange(v); // Atualiza o valor do formulário em tempo real
            }}
          />
          <CommandList>
            <CommandEmpty>Nenhuma sugestão encontrada. Digite a finalidade (ex: Aula de Matemática).</CommandEmpty>
            <CommandGroup heading="Sugestões (Professores/Funcionários)">
              {filteredSuggestions.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.searchable}
                  onSelect={() => handleSelectUser(user)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    {getUserIcon(user.type)}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user.type}</span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === `${user.type.charAt(0).toUpperCase() + user.type.slice(1)}: ${user.name}` ? "opacity-100" : "opacity-0"
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

export default PurposeAutocomplete;