import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Computer, Clock, User, AlertTriangle } from 'lucide-react';
import type { Chromebook, LoanHistoryItem } from '@/types/database';
import { format } from 'date-fns';

interface DetailItem {
  id: string;
  chromebook_id: string;
  model: string;
  status?: Chromebook['status'];
  loan_date?: string;
  expected_return_date?: string;
  student_name?: string;
  isOverdue?: boolean;
}

interface DashboardDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  data: DetailItem[] | null;
  isLoading: boolean;
  dataType: 'chromebooks' | 'loans';
}

export const DashboardDetailDialog: React.FC<DashboardDetailDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  data,
  isLoading,
  dataType,
}) => {
  const isLoans = dataType === 'loans';

  const getStatusBadge = (status: Chromebook['status'] | undefined, isOverdue: boolean = false) => {
    if (isOverdue) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Atrasado</Badge>;
    }
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Disponível</Badge>;
      case 'emprestado':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Emprestado</Badge>;
      case 'fixo':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Fixo</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Carregando detalhes...</p>
            </div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">ID Chromebook</TableHead>
                  <TableHead>Modelo</TableHead>
                  {isLoans && <TableHead>Solicitante</TableHead>}
                  <TableHead>{isLoans ? 'Empréstimo' : 'Status'}</TableHead>
                  {isLoans && <TableHead>Prazo</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-sm">{item.chromebook_id}</TableCell>
                    <TableCell className="text-sm">{item.model}</TableCell>
                    {isLoans && (
                      <TableCell className="text-sm flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {item.student_name}
                      </TableCell>
                    )}
                    <TableCell>
                      {isLoans ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(item.loan_date!), 'dd/MM HH:mm')}
                        </div>
                      ) : (
                        getStatusBadge(item.status)
                      )}
                    </TableCell>
                    {isLoans && (
                      <TableCell>
                        {item.expected_return_date ? (
                          <div className="flex flex-col">
                            <span className="text-xs">
                              {format(new Date(item.expected_return_date), 'dd/MM HH:mm')}
                            </span>
                            {item.isOverdue && getStatusBadge(item.status, true)}
                          </div>
                        ) : (
                          <Badge variant="secondary">Sem prazo</Badge>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Computer className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhum item encontrado para esta métrica.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};