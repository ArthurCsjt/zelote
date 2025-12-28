import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { Monitor, User, Clock, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
import type { LoanHistoryItem } from "@/types/database";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";

interface LoanHistoryTableProps {
  history: LoanHistoryItem[];
  isNewLoan: (loan: LoanHistoryItem) => boolean;
}

export const LoanHistoryTable: React.FC<LoanHistoryTableProps> = ({ history, isNewLoan }) => {

  const getStatusProps = (status: LoanHistoryItem['status']) => {
    switch (status) {
      case 'devolvido':
        return { color: 'text-green-900 dark:text-green-100', bg: 'bg-green-300 dark:bg-green-800', icon: CheckCircle, label: 'Devolvido' };
      case 'atrasado':
        return { color: 'text-white', bg: 'bg-red-600 dark:bg-red-700', icon: AlertTriangle, label: 'Atrasado' };
      case 'ativo':
      default:
        return { color: 'text-amber-900 dark:text-amber-100', bg: 'bg-amber-300 dark:bg-amber-700', icon: Clock, label: 'Ativo' };
    }
  };

  return (
    <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-black dark:bg-white hover:bg-black dark:hover:bg-white border-b-2 border-black dark:border-white">
              <TableHead className="w-[120px] text-white dark:text-black font-black uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-[150px] text-white dark:text-black font-black uppercase tracking-wider">ID Chromebook</TableHead>
              <TableHead className="w-[200px] text-white dark:text-black font-black uppercase tracking-wider">Solicitante</TableHead>
              <TableHead className="hidden md:table-cell text-white dark:text-black font-black uppercase tracking-wider">Finalidade</TableHead>
              <TableHead className="w-[150px] text-white dark:text-black font-black uppercase tracking-wider">Empréstimo</TableHead>
              <TableHead className="w-[150px] text-white dark:text-black font-black uppercase tracking-wider">Devolução</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((loan) => {
              const statusInfo = getStatusProps(loan.status);
              const StatusIcon = statusInfo.icon;
              const isRecent = isNewLoan(loan);

              return (
                <TableRow
                  key={loan.id}
                  className={cn(
                    "border-b-2 border-black/10 dark:border-white/10 transition-colors",
                    "hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
                    loan.status === 'atrasado' && 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30',
                    isRecent && 'bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  )}
                >
                  <TableCell className="font-medium text-sm py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 font-bold uppercase text-[10px] tracking-wide border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]",
                      statusInfo.bg,
                      statusInfo.color
                    )}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm py-4 font-bold">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="uppercase">{loan.chromebook_id}</span>
                      {loan.reservation_id && (
                        <Badge className="h-4 px-1 py-0 text-[8px] font-black uppercase bg-indigo-500 text-white border-2 border-black rounded-none">
                          Reserva
                        </Badge>
                      )}
                    </div>
                    {loan.chromebook_model && (
                      <span className="text-[10px] uppercase text-muted-foreground block mt-0.5 ml-6">{loan.chromebook_model}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-black uppercase text-sm">{loan.student_name}</span>
                      <span className="text-xs text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3" />
                        {loan.user_type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-4 max-w-[250px]">
                    <div className="p-2 border border-black/20 dark:border-white/20 bg-gray-50 dark:bg-zinc-800/50 text-xs font-medium uppercase truncate">
                      {loan.purpose}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-4 font-mono font-medium">
                    {format(new Date(loan.loan_date), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-xs py-4 font-mono font-medium">
                    {loan.return_date ? (
                      <span className={cn(
                        "px-2 py-1 border-black dark:border-white",
                        loan.status === 'atrasado' ? 'text-red-700 dark:text-red-400 font-extrabold' : 'text-green-700 dark:text-green-400 font-bold'
                      )}>
                        {format(new Date(loan.return_date), "dd/MM/yyyy HH:mm")}
                      </span>
                    ) : (
                      <Badge variant="outline" className="rounded-none border-black dark:border-white text-xs font-normal uppercase opacity-50">Background</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};