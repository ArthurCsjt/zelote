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
  /** NOVO: Função chamada ao selecionar um item ou confirmar a digitação */
  onConfirm: (value: string) => void; 
}

const PurposeAutocomplete: React.FC<PurposeAutocompleteProps> = ({ value, onChange, disabled, placeholder, userType, onConfirm }) => {
  const [open, setOpen] = useState(false);
  const { users, loading } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState(''); 

  // 1. Filtra apenas Professores e Funcionários para sugestões de finalidade
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
    onConfirm(purposeValue); // Confirma imediatamente após a seleção
    setOpen(false);
    setSearchTerm(''); // Limpa o termo de busca após a seleção
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
        e.preventDefault();
        onConfirm(value.trim()); // Confirma a digitação ao pressionar Enter
        setOpen(false);
    }
  };
  
  const commandPlaceholder = userType === 'aluno' 
    ? 'Buscar professor ou digitar aula...' 
    : 'Buscar departamento ou digitar finalidade...';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Usamos um Button como trigger para replicar o estilo de input com ícone de seta */}
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white border-gray-200 dark:bg-card dark:border-border h-10 px-3",
            "text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <div className="flex items-center flex-1 min-w-0">
            <BookOpen className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate text-foreground/80 dark:text-foreground/90">
              {value || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[350px] p-0 bg-card border-border shadow-xl border-border-strong"
      >
        <Command>
          {/* O input de busca agora está dentro do Command */}
          <CommandInput 
            placeholder={commandPlaceholder} 
            value={searchTerm}
            onValueChange={setSearchTerm}
            // Adicionando o valor do campo principal para permitir a confirmação por Enter
            onKeyDown={handleKeyDown} 
          />
          <CommandList>
            <CommandEmpty>Nenhuma sugestão encontrada. Digite a finalidade.</CommandEmpty>
            <CommandGroup heading="Sugestões (Professores/Funcionários)">
              {filteredSuggestions.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.searchable}
                  onSelect={() => handleSelectUser(user)}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      "bg-gradient-to-br from-purple-500 to-purple-600"
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
                    user.type === 'professor' ? "bg-purple-500/10 text-purple-600" : "bg-orange-500/10 text-orange-600"
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

export default PurposeAutocomplete;