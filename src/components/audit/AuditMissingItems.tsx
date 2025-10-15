import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Search, Monitor, MapPin, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Chromebook } from '@/types/database';

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
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Itens Faltantes ({missingCount})
        </CardTitle>
        <CardDescription className="text-orange-700">
          {totalCounted} de {totalExpected} contados ({completionRate}% de conclusão).
          Estes são os {missingCount} Chromebooks que ainda não foram registrados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar ID, modelo ou localização faltante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-orange-300"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-500 hover:bg-orange-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-64 w-full rounded-md border border-orange-300 bg-white">
          {filteredMissingItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Localização Esperada</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMissingItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-orange-50">
                    <TableCell className="font-medium text-sm">{item.chromebook_id}</TableCell>
                    <TableCell className="text-xs">{item.model}</TableCell>
                    <TableCell className="text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-orange-500" />
                      {item.location || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
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
                <Monitor className="h-12 w-12 text-orange-300 mx-auto mb-4" />
                <p className="text-sm text-orange-700">
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
    </Card>
  );
};