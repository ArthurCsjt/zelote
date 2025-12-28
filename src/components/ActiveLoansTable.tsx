import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { CheckCircle, RotateCcw, AlertTriangle, Clock, Monitor } from "lucide-react";
import type { LoanHistoryItem } from "@/types/database";
import { cn } from "@/lib/utils";

interface ActiveLoansTableProps {
  loans: LoanHistoryItem[];
  onNavigateToReturn: (chromebookId: string) => void;
}

export const ActiveLoansTable: React.FC<ActiveLoansTableProps> = ({ loans, onNavigateToReturn }) => {

  const isOverdue = (loan: LoanHistoryItem) => {
    return loan.expected_return_date && new Date(loan.expected_return_date) < new Date();
  };

  const isDueSoon = (loan: LoanHistoryItem) => {
    if (!loan.expected_return_date) return false;
    const dueDate = new Date(loan.expected_return_date);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff > 0 && hoursDiff <= 24;
  };

  return (
    <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
      <Table>
        <TableHeader>
          <TableRow className="bg-black dark:bg-white hover:bg-black dark:hover:bg-white border-b-2 border-black dark:border-white">
            <TableHead className="w-[150px] text-white dark:text-black font-black uppercase tracking-wider">ID Chromebook</TableHead>
            <TableHead className="w-[200px] text-white dark:text-black font-black uppercase tracking-wider">Solicitante</TableHead>
            <TableHead className="hidden sm:table-cell text-white dark:text-black font-black uppercase tracking-wider">Finalidade</TableHead>
            <TableHead className="w-[150px] hidden md:table-cell text-white dark:text-black font-black uppercase tracking-wider">Empréstimo</TableHead>
            <TableHead className="w-[150px] text-white dark:text-black font-black uppercase tracking-wider">Prazo</TableHead>
            <TableHead className="w-[100px] text-right text-white dark:text-black font-black uppercase tracking-wider">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => {
            const overdueStatus = isOverdue(loan);
            const dueSoonStatus = isDueSoon(loan);

            return (
              <TableRow
                key={loan.id}
                className={cn(
                  "border-b-2 border-black/10 dark:border-white/10 transition-colors",
                  "hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
                  overdueStatus && 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30',
                  dueSoonStatus && !overdueStatus && 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                )}
              >
                <TableCell className="font-bold text-sm flex items-center gap-2 py-4">
                  <Monitor className="h-4 w-4 hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <span className="uppercase">{loan.chromebook_id}</span>
                    {loan.reservation_id && (
                      <Badge className="h-4 px-1.5 py-0 text-[8px] font-black uppercase bg-indigo-500 text-white border-2 border-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        Reserva
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-black uppercase text-sm">{loan.student_name}</span>
                    <span className="text-xs text-muted-foreground uppercase">{loan.student_email}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs max-w-[200px] py-4">
                  <div className="p-1.5 border border-black/20 dark:border-white/20 bg-gray-50 dark:bg-zinc-800/50 uppercase font-medium truncate">
                    {loan.purpose}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs font-mono font-medium py-4">
                  {format(new Date(loan.loan_date), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell className="py-4">
                  {loan.expected_return_date ? (
                    <div className="flex flex-col items-start">
                      <span className={cn(
                        "text-xs font-mono font-bold mb-1",
                        overdueStatus ? 'text-red-700 dark:text-red-400' : dueSoonStatus ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
                      )}>
                        {format(new Date(loan.expected_return_date), "dd/MM/yy HH:mm")}
                      </span>
                      <div className={cn(
                        "text-[10px] uppercase font-black px-2 py-0.5 border border-black dark:border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_#fff]",
                        overdueStatus ? "bg-red-300 text-red-900" :
                          dueSoonStatus ? "bg-amber-300 text-amber-900" :
                            "bg-gray-100 text-gray-600"
                      )}>
                        {overdueStatus ? 'ATRASADO' : dueSoonStatus ? 'VENCE HOJE' : 'NO PRAZO'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-muted-foreground border border-black/20 px-2 py-1">Sem prazo</span>
                  )}
                </TableCell>
                <TableCell className="text-right py-4">
                  <Button
                    onClick={() => onNavigateToReturn(loan.chromebook_id)}
                    size="sm"
                    className="h-8 px-3 bg-menu-amber hover:bg-menu-amber-hover border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none text-white font-black uppercase rounded-none transition-all"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Devolver
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};