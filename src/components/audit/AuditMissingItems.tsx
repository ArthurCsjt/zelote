import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Search, Monitor, MapPin, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Chromebook } from '@/types/database';
import { GlassCard } from '@/components/ui/GlassCard'; // Importando GlassCard

interface AuditMissingItemsProps {
  missingItems: Chromebook[];
  totalExpected: number;
  totalCounted: number;
}

export const AuditMissingItems: React.FC<AuditMissingItemsProps> = ({
  missingItems,
  totalExpected,
  totalCounted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMissingItems = useMemo(() => {
    if (!searchTerm) return missingItems;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return missingItems.filter(item => 
      item.chromebook_id.toLowerCase().includes(lowerCaseSearch) ||
      item.model.toLowerCase().includes(lowerCaseSearch) ||
      (item.location?.toLowerCase().includes(lowerCaseSearch))
    );
  }, [missingItems, searchTerm]);

  const completionRate = totalExpected > 0 ? ((totalCounted / totalExpected) * 100).toFixed(1) : '0.0';
  const missingCount = missingItems.length;

  return (
    <GlassCard className="border-warning/50 bg-warning-bg/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning-foreground">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Itens Faltantes ({missingCount})
        </CardTitle>
        <CardDescription className="text-warning-foreground">
          {totalCounted} de {totalExpected} contados ({completionRate}% de conclusão).
          Estes são os {missingCount} Chromebooks que ainda não foram registrados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ID, modelo ou localização faltante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // CORREÇÃO: Usando bg-input-bg e border-input
            className="pl-10 bg-input-bg border-input text-foreground dark:bg-input-bg dark:border-input"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="absolute right-1 top-1 h-8 w-8 p-0 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-64 w-full rounded-md border border-border bg-card">
          {filteredMissingItems.length > 0 ? (
            <Table>
              <TableHeader className="bg-background-secondary">
                <TableRow>
                  <TableHead className="text-foreground">ID</TableHead>
                  <TableHead className="text-foreground">Modelo</TableHead>
                  <TableHead className="text-foreground">Localização Esperada</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMissingItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-card-hover">
                    <TableCell className="font-medium text-sm text-foreground">{item.chromebook_id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.model}</TableCell>
                    <TableCell className="text-xs flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 text-warning" />
                      {item.location || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center p-4">
                <Monitor className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm 
                    ? "Nenhum item faltante corresponde à busca."
                    : "Todos os itens foram contados! 🎉"
                  }
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </GlassCard>
  );
};