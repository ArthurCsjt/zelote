import { useState, useMemo } from 'react';
import type { Chromebook } from '@/types/database';

// Hook especialista em gerenciar o estado e a lógica dos filtros do inventário
export const useInventoryFilters = (allChromebooks: Chromebook[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // useMemo é usado aqui para otimização. 
  // A lista só será recalculada se a lista original ou os filtros mudarem.
  const filteredChromebooks = useMemo(() => {
    return allChromebooks.filter(chromebook => {
      // Lógica de filtro para o termo de busca (procura no ID, modelo, série e patrimônio)
      const searchMatch = searchTerm.toLowerCase() === '' ||
        chromebook.chromebook_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chromebook.patrimony_number?.toLowerCase().includes(searchTerm.toLowerCase());

      // Lógica para o filtro de status
      const statusMatch = statusFilter === 'all' || chromebook.status === statusFilter;
      
      // Lógica para o filtro de localização (pode ser expandido no futuro)
      const locationMatch = locationFilter === 'all' || chromebook.location === locationFilter;

      return searchMatch && statusMatch && locationMatch;
    });
  }, [allChromebooks, searchTerm, statusFilter, locationFilter]);

  // Retorna os estados, as funções para modificá-los, e a lista já filtrada
  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    filteredChromebooks,
  };
};