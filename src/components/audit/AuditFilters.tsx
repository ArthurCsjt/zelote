import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Search, X } from 'lucide-react';
import type { AuditFilters, CountedItemWithDetails } from '@/types/database';
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard

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
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Filtre os itens contados por localização, método ou data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ID, modelo ou localização..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Localização</label>
            <Select
              value={filters.location || ''}
              onValueChange={(value) => updateFilter('location', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as localizações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as localizações</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location || ''}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Método</label>
            <Select
              value={filters.scanMethod || 'all'}
              onValueChange={(value) => updateFilter('scanMethod', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                <SelectItem value="qr_code">QR Code</SelectItem>
                <SelectItem value="manual_id">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros ativos */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Filtros ativos</label>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => clearFilter('search')}>
                  Busca: {filters.search}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => clearFilter('location')}>
                  Local: {filters.location}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {filters.scanMethod && filters.scanMethod !== 'all' && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => clearFilter('scanMethod')}>
                  Método: {filters.scanMethod === 'qr_code' ? 'QR Code' : 'Manual'}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
};