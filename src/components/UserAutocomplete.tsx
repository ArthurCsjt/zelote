import React, { useState, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, User, GraduationCap, Briefcase, Search, Loader2, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserSearch, UserSearchResult } from '@/hooks/useUserSearch';
import { Badge } from './ui/badge';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

interface UserAutocompleteProps {
  selectedUser: UserSearchResult | null;
  onSelect: (user: UserSearchResult) => void;
  onClear: () => void;
  disabled: boolean;
}

const UserAutocomplete: React.FC<UserAutocompleteProps> = ({ selectedUser, onSelect, onClear, disabled }) => {
  const { users, loading } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredUsers = useMemo(() => {
    if (!searchTerm || !isFocused) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return users.filter(user => user.searchable.includes(lowerCaseSearch));
  }, [users, searchTerm, isFocused]);

  const getUserIcon = (type: string) => {
    switch (type) {
      case 'aluno':
        return <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'professor':
      case 'super_admin':
      case 'admin':
        return <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'funcionario':
        return <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };
  
  const getUserBadgeClasses = (type: string) => {
    switch (type) {
      case 'aluno':
        return "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800";
      case 'professor':
        return "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800";
      case 'funcionario':
        return "bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600";
    }
  };
  
  const getUserAvatarClasses = (type: string) => {
    switch (type) {
      case 'aluno':
        return "bg-blue-500/10 dark:bg-blue-900/50";
      case 'professor':
        return "bg-purple-500/10 dark:bg-purple-900/50";
      case 'funcionario':
        return "bg-orange-500/10 dark:bg-orange-900/50";
      default:
        return "bg-gray-100 dark:bg-gray-700/50";
    }
  };

  const handleSelect = (user: UserSearchResult) => {
    onSelect(user);
    setSearchTerm('');
    setIsFocused(false);
    inputRef.current?.blur();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3 bg-muted rounded-md">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando lista de usuários...
      </div>
    );
  }

  if (selectedUser) {
    return (
      <GlassCard 
        className={cn(
          "p-3 border-2 shadow-md",
          "border-green-600/50 bg-green-50/80 dark:bg-green-950/50 dark:border-green-900"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-sm text-foreground">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-green-200 dark:border-green-900">
          <Badge variant="outline" className={cn("capitalize", getUserBadgeClasses(selectedUser.type))}>
            {selectedUser.type}
          </Badge>
          {selectedUser.ra && <Badge variant="outline">RA: {selectedUser.ra}</Badge>}
          {selectedUser.turma && <Badge variant="outline">Turma: {selectedUser.turma}</Badge>}
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Buscar nome, RA ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          // Pequeno delay para permitir o clique na sugestão antes de fechar
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} 
          className="w-full pl-10 bg-input-bg border-input dark:bg-input-bg dark:border-input"
          disabled={disabled}
        />
      </div>
      
      {/* Lista de Sugestões (aparece abaixo do input) */}
      {isFocused && searchTerm && filteredUsers.length > 0 && (
        <ScrollArea className="absolute z-20 w-full max-h-60 rounded-md border bg-card shadow-lg dark:bg-card dark:border-border mt-1">
          <Command className="bg-transparent">
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Buscando...
                </div>
              )}
              
              {filteredUsers.length === 0 && !loading && (
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </CommandEmpty>
              )}
              
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.searchable}
                    onSelect={() => handleSelect(user)}
                    className="flex items-center justify-between p-3"
                    // Usar onMouseDown para garantir que o clique funcione antes do onBlur
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(user); }}
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

export default UserAutocomplete;