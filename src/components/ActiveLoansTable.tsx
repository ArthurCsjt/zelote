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
    <div className="border rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm shadow-lg border-border">
      <Table>
        <TableHeader className="bg-background-secondary">
          <TableRow>
            <TableHead className="w-[150px] text-foreground">ID Chromebook</TableHead>
            <TableHead className="w-[200px] text-foreground">Solicitante</TableHead>
            <TableHead className="hidden sm:table-cell text-foreground">Finalidade</TableHead>
            <TableHead className="w-[150px] hidden md:table-cell text-foreground">Empréstimo</TableHead>
            <TableHead className="w-[150px] text-foreground">Prazo</TableHead>
            <TableHead className="w-[100px] text-right text-foreground">Ações</TableHead>
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
                  "hover:bg-card-hover",
                  overdueStatus && 'bg-error-bg/50 hover:bg-error-bg/70',
                  dueSoonStatus && !overdueStatus && 'bg-warning-bg/50 hover:bg-warning-bg/70'
                )}
              >
                <TableCell className="font-medium text-sm flex items-center gap-2 text-foreground">
                  <Monitor className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  {loan.chromebook_id}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-foreground">{loan.student_name}</span>
                    <span className="text-xs text-muted-foreground">{loan.student_email}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs max-w-[200px] truncate text-muted-foreground">
                  {loan.purpose}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {format(new Date(loan.loan_date), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  {loan.expected_return_date ? (
                    <div className="flex flex-col items-start">
                      <span className={cn(
                        "text-xs font-medium",
                        overdueStatus ? 'text-error-foreground' : dueSoonStatus ? 'text-warning-foreground' : 'text-muted-foreground'
                      )}>
                        {format(new Date(loan.expected_return_date), "dd/MM/yy HH:mm")}
                      </span>
                      <Badge 
                        variant={overdueStatus ? 'destructive' : dueSoonStatus ? 'warning' : 'secondary'}
                        className={cn(
                            "mt-1 w-fit",
                            overdueStatus && "bg-error-bg text-error-foreground",
                            dueSoonStatus && !overdueStatus && "border-warning text-warning-foreground bg-warning-bg"
                        )}
                      >
                        {overdueStatus ? 'Atrasado' : dueSoonStatus ? 'Vence em breve' : 'Com prazo'}
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="secondary">Sem prazo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => onNavigateToReturn(loan.chromebook_id)}
                    size="sm"
                    // Usando a cor de devolução (menu-amber)
                    className="h-8 px-3 bg-menu-amber hover:bg-menu-amber-hover"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
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