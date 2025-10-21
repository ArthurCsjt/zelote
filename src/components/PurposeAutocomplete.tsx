import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, ChevronsUpDown, User, GraduationCap, Briefcase, Search, Loader2, CheckCircle, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUserSearch, UserSearchResult } from '@/hooks/useUserSearch';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

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
  const [searchTerm, setSearchTerm] = useState(value);

  // Sincroniza o searchTerm interno com o valor externo quando o popover fecha
  useEffect(() => {
    if (!open) {
      setSearchTerm(value);
    }
  }, [value, open]);

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
    // Formata o valor para ser claro no campo de finalidade
    const purposeValue = `${user.type.charAt(0).toUpperCase() + user.type.slice(1)}: ${user.name}`;
    onChange(purposeValue);
    setOpen(false);
    setSearchTerm(purposeValue);
  };
  
  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };
  
  const commandPlaceholder = userType === 'aluno' 
    ? 'Buscar professor ou digitar aula...' 
    : 'Buscar departamento ou digitar finalidade...';

  // Se um valor foi selecionado/digitado, exibe o GlassCard de confirmação
  if (value) {
    // Tenta identificar se o valor é um usuário formatado (ex: Professor: Nome)
    const isUserSelection = value.includes(': ');
    const displayValue = isUserSelection ? value.split(': ')[1] : value;
    const displayType = isUserSelection ? value.split(': ')[0] : 'Finalidade';
    
    return (
      <GlassCard className="p-3 border-2 border-green-400 bg-green-50/50 shadow-md dark:bg-green-950/50 dark:border-green-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-sm text-foreground">{displayValue}</p>
              <p className="text-xs text-muted-foreground">{displayType}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-green-200 dark:border-green-900">
          <Badge variant="secondary" className="capitalize">{displayType}</Badge>
        </div>
      </GlassCard>
    );
  }

  // Se nenhum valor estiver selecionado, exibe o Popover de busca
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
            {placeholder}
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
            <CommandEmpty>Nenhuma sugestão encontrada. Digite a finalidade.</CommandEmpty>
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