import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { Search, Filter, Edit3, QrCode, Trash2, Save, AlertTriangle, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useProfileRole } from "@/hooks/use-profile-role";
import { supabase } from "@/integrations/supabase/client";
import type { Chromebook as ChromebookData } from "@/types/database"; // Ajuste o caminho se necessário

// (O resto do seu componente continua aqui...)

// ... (todas as suas funções: fetchChromebooks, handleSaveEdit, handleDeleteClick, etc.)

export function ChromebookInventory({ onBack }: { onBack?: () => void }) {
    // ... (todo o início do seu componente: useState, useEffects, etc.)

    // --- DENTRO DO SEU RETURN() ---
    // Encontre o <TableBody> e o loop .map() dos chromebooks.
    // O código abaixo é a parte que renderiza as ações, agora com a correção.

    return (
        // ... (o início do seu JSX: filtros, busca, etc.)
        <Table>
          {/* ... seu <TableHeader> ... */}
          <TableBody>
            {paginatedChromebooks.map((chromebook) => (
              <TableRow key={chromebook.id}>
                {/* ... suas outras <TableCell> ... */}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {/* ... botões de QR Code, Editar, Excluir ... */}
                    <Select 
                      value={chromebook.status} 
                      onValueChange={(value) => handleStatusChange(chromebook.id, value)}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      {/* --- AQUI ESTÁ A CORREÇÃO --- */}
                      <SelectContent position="popper"> 
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="emprestado">Emprestado</SelectItem>
                        <SelectItem value="fixo">Fixo</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        // ... (o resto do seu JSX: paginação, modais, etc.)
    );
}