import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, User, GraduationCap, Briefcase, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUserSearch, UserSearchResult } from '@/hooks/useUserSearch';
import { Badge } from './ui/badge';

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
        return <GraduationCap className="mr-2 h-4 w-4 text-blue-500" />;
      case 'professor':
        return <User className="mr-2 h-4 w-4 text-purple-500" />;
      case 'funcionario':
        return <Briefcase className="mr-2 h-4 w-4 text-orange-500" />;
      default:
        return <User className="mr-2 h-4 w-4 text-gray-500" />;
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
      <Card className="p-3 border-2 border-green-400 bg-green-50/50 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-sm">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-green-200">
          <Badge variant="secondary" className="capitalize">{selectedUser.type}</Badge>
          {selectedUser.ra && <Badge variant="outline">RA: {selectedUser.ra}</Badge>}
          {selectedUser.turma && <Badge variant="outline">Turma: {selectedUser.turma}</Badge>}
        </div>
      </Card>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white border-gray-200"
          disabled={disabled}
        >
          <div className="flex items-center">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {selectedUser ? selectedUser.name : "Buscar nome, RA ou email..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0">
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
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    {getUserIcon(user.type)}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{user.type}</Badge>
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