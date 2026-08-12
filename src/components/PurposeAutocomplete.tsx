import React, { useState, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, User, GraduationCap, Briefcase, Search, Loader2, CheckCircle, X, BookOpen, Calendar } from 'lucide-react';
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

const COMMON_PURPOSES = [
  { label: 'Aula Livre', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Palestra', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Reunião', icon: <Briefcase className="h-4 w-4" /> },
  { label: 'Evento', icon: <Calendar className="h-4 w-4" /> },
  { label: 'Manutenção', icon: <Briefcase className="h-4 w-4" /> },
];

const PurposeAutocomplete: React.FC<PurposeAutocompleteProps> = ({ value, onChange, disabled, placeholder, userType, onConfirm }) => {
  const { users, loading } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Filtra Sugestões Comuns
  const filteredCommon = useMemo(() => {
    if (!searchTerm || !isFocused) return COMMON_PURPOSES;
    const lower = searchTerm.toLowerCase();
    return COMMON_PURPOSES.filter(p => p.label.toLowerCase().includes(lower));
  }, [searchTerm, isFocused]);

  // 2. Filtra Professores e Funcionários
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

  const handleSelectCommon = (label: string) => {
    onChange(label);
    onConfirm(label);
    setIsFocused(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const finalValue = value.trim();
      // Permite confirmar mesmo vazio agora que é opcional
      onConfirm(finalValue);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchTerm(newValue);
  };

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
      {(isFocused) && (
        <ScrollArea className="absolute z-20 w-full max-h-72 rounded-md border-4 border-black bg-card shadow-[6px_6px_0px_0px_#000] dark:bg-card dark:border-white mt-2 overflow-hidden">
          <Command className="bg-transparent">
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Buscando dados...
                </div>
              )}

              <CommandGroup heading="Finalidades Comuns" className="p-1">
                {filteredCommon.map((p) => (
                  <CommandItem
                    key={p.label}
                    onSelect={() => handleSelectCommon(p.label)}
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectCommon(p.label); }}
                  >
                    <div className="w-8 h-8 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 flex items-center justify-center shadow-[2px_2px_0_0_#000] shrink-0">
                      <div className="text-black dark:text-white">
                        {p.icon}
                      </div>
                    </div>
                    <span className="font-bold uppercase text-xs text-foreground">{p.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              {filteredSuggestions.length > 0 && (
                <CommandGroup heading="Professores / Funcionários" className="p-1 border-t-2 border-black/10">
                  {filteredSuggestions.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.searchable}
                      onSelect={() => handleSelectUser(user)}
                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectUser(user); }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={cn(
                          "w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#000]",
                          getUserAvatarClasses(user.type)
                        )}>
                          {getUserIcon(user.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs uppercase truncate leading-tight text-foreground">
                            {user.name}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground truncate opacity-70">
                            {user.materia ? `Materia: ${user.materia}` : user.email}
                          </p>
                        </div>
                      </div>

                      <Badge variant="outline" className={cn(
                        "text-[8px] shrink-0 font-black uppercase rounded-none border-2 border-black dark:border-white ml-2",
                        getUserBadgeClasses(user.type)
                      )}>
                        {user.type}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchTerm && filteredSuggestions.length === 0 && filteredCommon.length === 0 && !loading && (
                <div className="p-4 text-center">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Pressione Enter para usar "{searchTerm}"</p>
                </div>
              )}
            </CommandList>
          </Command>
        </ScrollArea>
      )}
    </div>
  );
};

export default PurposeAutocomplete;