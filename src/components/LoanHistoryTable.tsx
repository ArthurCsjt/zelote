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
        return { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle, label: 'Devolvido' };
      case 'atrasado':
        return { color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle, label: 'Atrasado' };
      case 'ativo':
      default:
        return { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock, label: 'Ativo' };
    }
  };

  return (
    <GlassCard className="p-0 overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[150px]">ID Chromebook</TableHead>
            <TableHead className="w-[200px]">Solicitante</TableHead>
            <TableHead className="hidden md:table-cell">Finalidade</TableHead>
            <TableHead className="w-[150px]">Empréstimo</TableHead>
            <TableHead className="w-[150px]">Devolução</TableHead>
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
                  loan.status === 'atrasado' && 'bg-red-50/50 hover:bg-red-100/50',
                  isRecent && 'border-l-4 border-blue-500'
                )}
              >
                <TableCell className="font-medium text-sm py-3">
                  <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", statusInfo.bg, statusInfo.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </div>
                </TableCell>
                <TableCell className="text-sm py-3">
                  <div className="flex items-center gap-1">
                    <Monitor className="h-3 w-3 text-muted-foreground" />
                    {loan.chromebook_id}
                  </div>
                  <span className="text-xs text-muted-foreground block truncate max-w-[150px]">{loan.chromebook_model}</span>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{loan.student_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{loan.user_type}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs max-w-[250px] truncate text-muted-foreground">
                  {loan.purpose}
                </TableCell>
                <TableCell className="text-xs py-3">
                  {format(new Date(loan.loan_date), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-xs py-3">
                  {loan.return_date ? (
                    <span className={cn(
                        "font-medium",
                        loan.status === 'atrasado' ? 'text-red-600' : 'text-gray-700'
                    )}>
                        {format(new Date(loan.return_date), "dd/MM/yyyy HH:mm")}
                    </span>
                  ) : (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </GlassCard>
  );
};