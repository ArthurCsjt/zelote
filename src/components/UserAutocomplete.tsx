import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, User, GraduationCap, Briefcase, Search, Loader2, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUserSearch, UserSearchResult } from '@/hooks/useUserSearch';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { GlassCard } from './ui/GlassCard'; // Importando GlassCard

interface UserAutocompleteProps {
  selectedUser: UserSearchResult | null;
  onSelect: (user: UserSearchResult) => void;
  onClear: () => void;
  disabled: boolean;
}

const UserAutocomplete: React.FC<UserAutocompleteProps> = ({ selectedUser, onSelect, onClear, disabled }) => {
  const [open, setOpen] = useState(false);
  const { users, loading } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return users.filter(user => user.searchable.includes(lowerCaseSearch));
  }, [users, searchTerm]);

  const getUserIcon = (type: string) => {
    switch (type) {
      case 'aluno':
        return <GraduationCap className="h-5 w-5 text-white" />;
      case 'professor':
      case 'super_admin':
      case 'admin':
        return <User className="h-5 w-5 text-white" />;
      case 'funcionario':
        return <Briefcase className="h-5 w-5 text-white" />;
      default:
        return <User className="h-5 w-5 text-white" />;
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
        return "from-blue-500 to-blue-600";
      case 'professor':
        return "from-purple-500 to-purple-600";
      case 'funcionario':
        return "from-orange-500 to-orange-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const handleSelect = (user: UserSearchResult) => {
    onSelect(user);
    setOpen(false);
    setSearchTerm('');
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
          // Ajuste para maior contraste no modo claro
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white border-gray-200 dark:bg-card dark:border-border"
          disabled={disabled}
        >
          <div className="flex items-center">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {"Buscar nome, RA ou email..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[350px] p-0 bg-card border-border shadow-xl border-border-strong" // ADICIONADO shadow-xl e border-border-strong
      >
        <Command>
          <CommandInput 
            placeholder="Buscar usuário..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.searchable}
                  onSelect={() => handleSelect(user)}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar com gradiente */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      "bg-gradient-to-br",
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
      </PopoverContent>
    </Popover>
  );
};

export default UserAutocomplete;