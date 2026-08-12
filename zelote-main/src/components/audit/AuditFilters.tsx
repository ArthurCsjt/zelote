import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Search, X } from 'lucide-react';
import type { AuditFilters, CountedItemWithDetails } from '@/types/database';
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard
import { cn } from '@/lib/utils';

interface AuditFiltersProps {
  filters: AuditFilters;
  onFiltersChange: (filters: AuditFilters) => void;
  items: CountedItemWithDetails[];
}

export const AuditFiltersComponent: React.FC<AuditFiltersProps> = ({
  filters,
  onFiltersChange,
  items,
}) => {
  // Obter valores únicos para filtros
  const locations = [...new Set(items.map(item => item.location).filter(Boolean))];
  const methods: Array<'qr_code' | 'manual_id'> = ['qr_code', 'manual_id'];

  const updateFilter = (key: keyof AuditFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const clearFilter = (key: keyof AuditFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className="neo-container p-0">
      <CardHeader className="border-b-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900/50 p-6">
        <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
          <Filter className="h-5 w-5" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="bg-yellow-300 text-black border-2 border-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{activeFiltersCount}</Badge>
          )}
        </CardTitle>
        <CardDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
          Filtre os itens contados por localização, método ou data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ID, modelo ou localização..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="neo-input pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase">Localização</label>
            <Select
              value={filters.location || 'all-locations'}
              onValueChange={(value) => updateFilter('location', value === 'all-locations' ? undefined : value)}
            >
              <SelectTrigger className="neo-input">
                <SelectValue placeholder="Todas as localizações" />
              </SelectTrigger>
              <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <SelectItem value="all-locations" className="uppercase font-bold text-xs">Todas as localizações</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location || 'N/A'} className="uppercase font-bold text-xs">
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase">Método</label>
            <Select
              value={filters.scanMethod || 'all'}
              onValueChange={(value) => updateFilter('scanMethod', value as any)}
            >
              <SelectTrigger className="neo-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <SelectItem value="all" className="uppercase font-bold text-xs">Todos os métodos</SelectItem>
                <SelectItem value="qr_code" className="uppercase font-bold text-xs">QR Code</SelectItem>
                <SelectItem value="manual_id" className="uppercase font-bold text-xs">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros ativos */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2 pt-4 border-t-2 border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase">Filtros ativos</label>
              <Button variant="outline" size="sm" onClick={clearFilters} className="neo-btn bg-white hover:bg-gray-100 text-black border-2 border-black h-8 px-3 text-xs">
                <X className="h-3 w-3 mr-1" />
                Limpar todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="cursor-pointer rounded-none border-2 border-black bg-yellow-300 text-black text-xs font-bold uppercase" onClick={() => clearFilter('search')}>
                  Busca: {filters.search}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="cursor-pointer rounded-none border-2 border-black bg-yellow-300 text-black text-xs font-bold uppercase" onClick={() => clearFilter('location')}>
                  Local: {filters.location}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {filters.scanMethod && filters.scanMethod !== 'all' && (
                <Badge variant="secondary" className="cursor-pointer rounded-none border-2 border-black bg-yellow-300 text-black text-xs font-bold uppercase" onClick={() => clearFilter('scanMethod')}>
                  Método: {filters.scanMethod === 'qr_code' ? 'QR Code' : 'Manual'}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
};