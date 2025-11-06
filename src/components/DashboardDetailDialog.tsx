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
      return <Badge variant="destructive" className="flex items-center gap-1 bg-error-bg text-error-foreground"><AlertTriangle className="h-3 w-3" /> Atrasado</Badge>;
    }
    switch (status) {
      case 'disponivel':
        return <Badge variant="success" className="bg-success-bg text-success-foreground">Disponível</Badge>;
      case 'emprestado':
        return <Badge variant="warning" className="bg-warning-bg text-warning-foreground">Emprestado</Badge>;
      case 'fixo':
        return <Badge variant="info" className="bg-info-bg text-info-foreground">Fixo</Badge>;
      case 'manutencao':
        return <Badge variant="destructive" className="bg-error-bg text-error-foreground">Manutenção</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-modal border-modal-border">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Carregando detalhes...</p>
            </div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader className="bg-background-secondary">
                <TableRow>
                  <TableHead className="w-[150px] text-foreground">ID Chromebook</TableHead>
                  <TableHead className="text-foreground">Modelo</TableHead>
                  {isLoans && <TableHead className="text-foreground">Solicitante</TableHead>}
                  <TableHead className="text-foreground">{isLoans ? 'Empréstimo' : 'Status'}</TableHead>
                  {isLoans && <TableHead className="text-foreground">Prazo</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-card-hover">
                    <TableCell className="font-medium text-sm text-foreground">{item.chromebook_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.model}</TableCell>
                    {isLoans && (
                      <TableCell className="text-sm flex items-center gap-1 text-foreground">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {item.student_name}
                      </TableCell>
                    )}
                    <TableCell>
                      {isLoans ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                            <span className="text-xs text-muted-foreground">
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