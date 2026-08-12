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
import { cn } from '@/lib/utils';

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
    <div className="neo-container border-4 border-red-600 dark:border-red-500 shadow-[8px_8px_0px_0px_rgba(255,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] bg-red-100 dark:bg-red-900/50">
      <CardHeader className="border-b-4 border-black dark:border-white p-6">
        <CardTitle className="flex items-center gap-2 text-black dark:text-white font-black uppercase tracking-tight">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Itens Faltantes ({missingCount})
        </CardTitle>
        <CardDescription className="text-black/70 dark:text-white/70 font-bold text-xs uppercase tracking-wide">
          {totalCounted} de {totalExpected} contados (<span className="font-black">{completionRate}%</span> de conclusão).
          Estes são os {missingCount} Chromebooks que ainda não foram registrados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ID, modelo ou localização faltante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neo-input pl-10"
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

        <ScrollArea className="h-64 w-full rounded-none border-2 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {filteredMissingItems.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-100 dark:bg-zinc-800 sticky top-0">
                <TableRow className="border-b-2 border-black dark:border-white">
                  <TableHead className="font-black text-black dark:text-white uppercase text-xs">ID</TableHead>
                  <TableHead className="font-black text-black dark:text-white uppercase text-xs">Modelo</TableHead>
                  <TableHead className="font-black text-black dark:text-white uppercase text-xs">Localização Esperada</TableHead>
                  <TableHead className="font-black text-black dark:text-white uppercase text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMissingItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-b border-black/10 dark:border-white/10">
                    <TableCell className="font-mono font-bold text-sm text-foreground">{item.chromebook_id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{item.model}</TableCell>
                    <TableCell className="text-xs flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 text-red-600" />
                      {item.location || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn(
                            "text-[10px] font-bold uppercase rounded-none border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                            item.status === 'emprestado' ? 'bg-blue-200 text-blue-900' : 'bg-gray-200 text-gray-900'
                        )}
                      >
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
    </div>
  );
};