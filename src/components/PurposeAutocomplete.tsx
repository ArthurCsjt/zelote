import React, { useState, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, User, GraduationCap, Briefcase, Search, Loader2, CheckCircle, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserSearch, UserSearchResult } from '@/hooks/useUserSearch';
import { Badge } from './ui/badge';

interface PurposeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  userType: 'aluno' | 'professor' | 'funcionario';
  /** Função chamada ao selecionar um item ou confirmar a digitação */
  onConfirm: (value: string) => void; 
}

const PurposeAutocomplete: React.FC<PurposeAutocompleteProps> = ({ value, onChange, disabled, placeholder, userType, onConfirm }) => {
  const { users, loading } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Filtra apenas Professores e Funcionários para sugestões de finalidade
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm || !isFocused) return [];
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    
    return users
      .filter(user => (user.type === 'professor' || user.type === 'funcionario') && user.searchable.includes(lowerCaseSearch))
      .slice(0, 5);
  }, [users, searchTerm, isFocused]);

  const getUserIcon = (type: string) => {
    switch (type) {
      case 'professor':
        return <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'funcionario':
        return <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };
  
  const getUserAvatarClasses = (type: string) => {
    switch (type) {
      case 'professor':
        return "bg-purple-500/10 dark:bg-purple-900/50";
      case 'funcionario':
        return "bg-orange-500/10 dark:bg-orange-900/50";
      default:
        return "bg-gray-100 dark:bg-gray-700/50";
    }
  };
  
  const getUserBadgeClasses = (type: string) => {
    switch (type) {
      case 'professor':
        return "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800";
      case 'funcionario':
        return "bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600";
    }
  };
  
  const handleSelectUser = (user: UserSearchResult) => {
    const purposeValue = `${user.type.charAt(0).toUpperCase() + user.type.slice(1)}: ${user.name}`;
    onChange(purposeValue);
    onConfirm(purposeValue);
    setIsFocused(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
        e.preventDefault();
        onConfirm(value.trim());
        setIsFocused(false);
        inputRef.current?.blur();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchTerm(newValue);
  };

  const commandPlaceholder = userType === 'aluno' 
    ? 'Buscar professor ou digitar aula...' 
    : 'Buscar departamento ou digitar finalidade...';

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="purpose-input"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          // Pequeno delay para permitir o clique na sugestão antes de fechar
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} 
          onKeyDown={handleKeyDown}
          className="w-full pl-10 bg-input-bg border-input dark:bg-input-bg dark:border-input"
          disabled={disabled}
        />
      </div>
      
      {/* Lista de Sugestões (aparece abaixo do input) */}
      {isFocused && searchTerm && (
        <ScrollArea className="absolute z-20 w-full max-h-60 rounded-md border bg-card shadow-lg dark:bg-card dark:border-border mt-1">
          <Command className="bg-transparent">
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Buscando...
                </div>
              )}
              
              {filteredSuggestions.length === 0 && !loading && (
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma sugestão encontrada. Digite a finalidade.
                </CommandEmpty>
              )}
              
              <CommandGroup heading="Sugestões (Professores/Funcionários)">
                {filteredSuggestions.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.searchable}
                    onSelect={() => handleSelectUser(user)}
                    className="flex items-center justify-between p-3"
                    // Usar onMouseDown para garantir que o clique funcione antes do onBlur
                    onMouseDown={(e) => { e.preventDefault(); handleSelectUser(user); }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar com cores sutis */}
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        getUserAvatarClasses(user.type)
                      )}>
                        {getUserIcon(user.type)}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Badge do tipo */}
                    <Badge variant="outline" className={cn(
                      "text-xs shrink-0 capitalize",
                      getUserBadgeClasses(user.type)
                    )}>
                      {user.type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </ScrollArea>
      )}
    </div>
  );
};

export default PurposeAutocomplete;