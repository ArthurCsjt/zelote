import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import type { Chromebook } from "@/types/database";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, User, Monitor } from "lucide-react";

// Tipos duplicados do DashboardLayout para manter consistência sem exportação circular
type DetailItem = {
  id: string;
  chromebook_id: string;
  model: string;
  status?: Chromebook['status'];
  loan_date?: string;
  expected_return_date?: string;
  student_name?: string;
  isOverdue?: boolean;
};

interface DashboardDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  data: DetailItem[] | null;
  isLoading: boolean;
  dataType: 'chromebooks' | 'loans';
}

export function DashboardDetailDialog({
  open,
  onOpenChange,
  title,
  description,
  data,
  isLoading,
  dataType
}: DashboardDetailDialogProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase font-bold">Disponível</Badge>;
      case 'em_uso':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase font-bold">Em Uso</Badge>;
      case 'manutencao':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase font-bold">Manutenção</Badge>;
      default:
        return <Badge variant="outline" className="border-2 border-black rounded-none uppercase font-bold">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 border-4 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] rounded-none sm:rounded-none">

        <DialogHeader className="p-6 pb-4 border-b-4 border-black dark:border-white bg-yellow-300 dark:bg-yellow-900">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-black dark:text-white flex items-center gap-2">
            {dataType === 'loans' ? <User className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-black dark:text-white font-mono font-bold text-sm opacity-80">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-900 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full"></div>
              <p className="font-mono font-bold uppercase">Carregando dados...</p>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 dark:bg-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-700 m-4">
              <p className="text-muted-foreground font-mono">Nenhum registro encontrado para este critério.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4 max-h-[60vh]">
              <Table>
                <TableHeader className="bg-gray-100 dark:bg-zinc-800 border-b-2 border-black dark:border-white sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b-2 border-black dark:border-white">
                    <TableHead className="w-[100px] font-black text-black dark:text-white uppercase">ID</TableHead>
                    <TableHead className="font-black text-black dark:text-white uppercase">Modelo</TableHead>
                    {dataType === 'chromebooks' ? (
                      <TableHead className="font-black text-black dark:text-white uppercase">Status</TableHead>
                    ) : (
                      <>
                        <TableHead className="font-black text-black dark:text-white uppercase">Aluno / Usuário</TableHead>
                        <TableHead className="font-black text-black dark:text-white uppercase">Empréstimo</TableHead>
                        <TableHead className="font-black text-black dark:text-white uppercase">Prev. Devolução</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-200 dark:border-zinc-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors">
                      <TableCell className="font-mono font-bold">{item.chromebook_id}</TableCell>
                      <TableCell>{item.model}</TableCell>

                      {dataType === 'chromebooks' ? (
                        <TableCell>{getStatusBadge(item.status || 'desconhecido')}</TableCell>
                      ) : (
                        <>
                          <TableCell className="font-medium">{item.student_name || 'N/A'}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {item.loan_date ? format(new Date(item.loan_date), "dd/MM/yy HH:mm") : '-'}
                          </TableCell>
                          <TableCell>
                            {item.expected_return_date ? (
                              <div className={cn(
                                "flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 border-2 border-black w-fit",
                                item.isOverdue
                                  ? "bg-red-100 text-red-700 border-red-500"
                                  : "bg-green-100 text-green-700 border-green-500"
                              )}>
                                {item.isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {format(new Date(item.expected_return_date), "dd/MM HH:mm")}
                              </div>
                            ) : '-'}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        <div className="p-4 border-t-4 border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
          <div className="flex justify-between items-center text-xs font-mono text-gray-500">
            <span>Total de registros: {data?.length || 0}</span>
            <span>ZELOTE DASHBOARD v2.0 // NEO-BRUTALISM</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}