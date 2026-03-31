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
    <div className="neo-table-container">
      <div className="overflow-x-auto">
        <Table className="neo-table min-w-[900px] border-collapse">
          <TableHeader className="bg-black dark:bg-white">
            <TableRow className="hover:bg-black dark:hover:bg-white border-0">
              <TableHead className="py-5 text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em] text-center">Status</TableHead>
              <TableHead className="py-5 text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em]">Dispositivo</TableHead>
              <TableHead className="py-5 text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em]">Solicitante</TableHead>
              <TableHead className="hidden md:table-cell py-5 text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em]">Finalidade</TableHead>
              <TableHead className="py-5 text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em]">Empréstimo</TableHead>
              <TableHead className="py-5 text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em]">Devolução</TableHead>
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
                    "transition-all duration-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/50 group border-b border-zinc-200 dark:border-zinc-800",
                    isRecent && "bg-blue-50/30 dark:bg-blue-900/10"
                  )}
                >
                  <TableCell className="py-5 text-center">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 font-black uppercase text-[9px] tracking-wider border-2 border-black dark:border-white rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] [text-shadow:1px_1px_rgba(0,0,0,0.3)]",
                      statusInfo.bg,
                      statusInfo.color
                    )}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 font-bold">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                        <Monitor className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="uppercase text-sm tracking-tight">{loan.chromebook_id}</span>
                        {loan.chromebook_model && (
                          <span className="text-[10px] uppercase text-muted-foreground font-black opacity-70">{loan.chromebook_model}</span>
                        )}
                      </div>
                      {loan.reservation_id && (
                        <Badge className="h-4 px-1 py-0 text-[8px] font-black uppercase bg-indigo-500 text-white border-2 border-black rounded-full ml-1">
                          Reserva
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col">
                      <span className="font-black uppercase text-sm group-hover:text-violet-600 transition-colors">{loan.student_name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="h-4 py-0 px-1.5 text-[8px] font-black uppercase border-black/20 dark:border-white/20 text-muted-foreground rounded-full">
                          {loan.user_type}
                        </Badge>
                        {loan.student_ra && (
                          <span className="text-[9px] font-mono font-bold text-muted-foreground">RA: {loan.student_ra}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-5 max-w-[250px]">
                    {loan.purpose ? (
                      <div className="px-3 py-1.5 border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-tight text-zinc-600 dark:text-zinc-400 rounded-lg group-hover:border-violet-500 group-hover:text-violet-500 transition-all truncate">
                        {loan.purpose}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground italic uppercase opacity-40">— S/ Finalidade —</span>
                    )}
                  </TableCell>
                  <TableCell className="py-5 font-mono">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-black dark:text-white font-black text-[11px]">
                        <RotateCcw className="h-3 w-3 rotate-180" />
                        {format(new Date(loan.loan_date), "dd/MM/yyyy HH:mm")}
                      </div>
                      {loan.created_by_email && (
                        <span className="text-[9px] text-muted-foreground font-black uppercase opacity-60 tracking-tighter">por: {loan.created_by_email.split('@')[0]}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 font-mono">
                    {loan.return_date ? (
                      <div className="flex flex-col gap-1">
                        <div className={cn(
                          "flex items-center gap-1 font-black text-[11px]",
                          loan.status === 'atrasado' ? 'text-red-600' : 'text-green-600'
                        )}>
                          <RotateCcw className="h-3 w-3" />
                          {format(new Date(loan.return_date), "dd/MM/yyyy HH:mm")}
                        </div>
                        {loan.return_registered_by_email && (
                          <span className="text-[9px] text-muted-foreground font-black uppercase opacity-60 tracking-tighter">por: {loan.return_registered_by_email.split('@')[0]}</span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-black dark:border-white text-[9px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Ativo</Badge>
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