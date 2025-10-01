import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2, QrCode } from "lucide-react";
import type { Chromebook } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";

// Props que a nossa tabela espera receber
interface InventoryTableProps {
  chromebooks: Chromebook[]; // A lista de chromebooks para exibir
  loading: boolean; // Para sabermos se os dados ainda estão carregando
  onEditClick: (chromebook: Chromebook) => void;
  onDeleteClick: (chromebook: Chromebook) => void;
  onGenerateQrCode: (chromebookId: string) => void;
}

export const InventoryTable = ({
  chromebooks,
  loading,
  onEditClick,
  onDeleteClick,
  onGenerateQrCode,
}: InventoryTableProps) => {

  // Função para renderizar um "esqueleto" de carregamento
  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Patrimônio</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Fabricante</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            renderSkeleton()
          ) : chromebooks.length > 0 ? (
            chromebooks.map((chromebook) => (
              <TableRow key={chromebook.id}>
                <TableCell className="font-medium">{chromebook.chromebook_id}</TableCell>
                <TableCell>{chromebook.patrimony_number || 'N/A'}</TableCell>
                <TableCell>{chromebook.model}</TableCell>
                <TableCell>{chromebook.manufacturer || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={chromebook.status === 'disponivel' ? 'default' : 'secondary'}>
                    {chromebook.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onGenerateQrCode(chromebook.chromebook_id)}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEditClick(chromebook)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDeleteClick(chromebook)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};