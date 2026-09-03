import React, { useState, useMemo } from 'react';
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, School, Laptop, MapPin, Check, Copy, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { FixedClassroomGroup } from '@/hooks/useDashboardData';
import type { Chromebook } from '@/types/database';

interface FixedChromebooksPanelProps {
  groups: FixedClassroomGroup[];
  totalFixed: number;
  className?: string;
  onSelectChromebook?: (chromebook: Chromebook) => void;
}

export const FixedChromebooksPanel: React.FC<FixedChromebooksPanelProps> = ({
  groups,
  totalFixed,
  className,
  onSelectChromebook,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtra as salas e os chromebooks baseado na busca
  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return groups;

    return groups
      .map(group => {
        const roomMatches = group.classroom.toLowerCase().includes(term);
        const matchingItems = group.items.filter(
          item =>
            item.chromebook_id.toLowerCase().includes(term) ||
            item.model?.toLowerCase().includes(term) ||
            item.serial_number?.toLowerCase().includes(term)
        );

        if (roomMatches) {
          // Se a sala combina, exibe todos os itens dela
          return group;
        }

        if (matchingItems.length > 0) {
          return {
            ...group,
            items: matchingItems,
            count: matchingItems.length,
          };
        }

        return null;
      })
      .filter((g): g is FixedClassroomGroup => g !== null);
  }, [groups, searchTerm]);

  const toggleRoom = (room: string) => {
    setExpandedRooms(prev => ({
      ...prev,
      [room]: !prev[room]
    }));
  };

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast({
      title: "ID Copiado!",
      description: `${id} copiado para a área de transferência.`,
      duration: 2000,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={cn(
      "border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]",
      className
    )}>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-black dark:border-white bg-blue-50 dark:bg-blue-950/30 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 border-2 border-black dark:border-white bg-blue-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <School className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
              Chromebooks Fixos em Sala
              <Badge className="bg-black dark:bg-white text-white dark:text-black font-black text-xs rounded-none border-2 border-black">
                {totalFixed} TOTAL
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs font-mono font-bold text-muted-foreground mt-0.5">
              Mapeamento de equipamentos alocados permanentemente em salas de aula e laboratórios
            </CardDescription>
          </div>
        </div>

        {/* Barra de Busca Rápida */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar ID ou Sala..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 font-bold text-xs uppercase placeholder:text-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 rounded-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase bg-gray-200 px-1.5 py-0.5 border border-black hover:bg-gray-300"
            >
              Limpar
            </button>
          )}
        </div>
      </CardHeader>

      <div className="p-4 sm:p-6">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 dark:border-zinc-700">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="font-black uppercase text-sm text-gray-700 dark:text-gray-300">
              {searchTerm ? `Nenhum Chromebook ou sala encontrada para "${searchTerm}"` : 'Nenhum Chromebook cadastrado como fixo em sala.'}
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Para fixar um aparelho, selecione "Fixo em Sala" e informe a sala no cadastro ou edição do inventário.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredGroups.map((group) => {
              const isExpanded = expandedRooms[group.classroom] ?? true; // Inicia expandido

              return (
                <div
                  key={group.classroom}
                  className="border-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
                >
                  {/* Cabeçalho da Sala */}
                  <div
                    onClick={() => toggleRoom(group.classroom)}
                    className="p-3.5 bg-white dark:bg-zinc-900 border-b-2 border-black dark:border-white flex items-center justify-between cursor-pointer hover:bg-blue-50/50 dark:hover:bg-zinc-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-black text-sm uppercase tracking-tight truncate">
                        {group.classroom}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 text-xs font-black bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200 border border-black uppercase font-mono">
                        {group.count} {group.count === 1 ? 'Aparelho' : 'Aparelhos'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-black dark:text-white" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-black dark:text-white" />
                      )}
                    </div>
                  </div>

                  {/* Lista de Chromebooks da Sala */}
                  {isExpanded && (
                    <div className="p-3 flex-1 flex flex-wrap gap-2 content-start min-h-[60px]">
                      {group.items.map((item) => {
                        const isCopied = copiedId === item.chromebook_id;
                        const isSearchMatch = searchTerm && (
                          item.chromebook_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.model?.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        return (
                          <div
                            key={item.id}
                            onClick={() => onSelectChromebook && onSelectChromebook(item)}
                            title={`Modelo: ${item.model || 'N/A'}${item.serial_number ? ` | Série: ${item.serial_number}` : ''}`}
                            className={cn(
                              "group inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold font-mono border-2 border-black dark:border-white transition-all",
                              isSearchMatch
                                ? "bg-yellow-300 text-black ring-2 ring-black font-black scale-105"
                                : "bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-blue-100 dark:hover:bg-blue-950",
                              "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
                            )}
                          >
                            <Laptop className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span>{item.chromebook_id}</span>
                            <button
                              onClick={(e) => handleCopyId(e, item.chromebook_id)}
                              className="opacity-60 hover:opacity-100 p-0.5 ml-0.5 transition-opacity"
                              title="Copiar ID"
                            >
                              {isCopied ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
