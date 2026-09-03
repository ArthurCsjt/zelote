import React, { useState } from 'react';
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Mail, CheckCircle2, Copy, Check, ExternalLink } from "lucide-react";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { DashboardOverdueLoan } from '@/hooks/useDashboardData';

interface OverdueLoansPanelProps {
  loans: DashboardOverdueLoan[];
  className?: string;
  onOpenQuickReturn?: (chromebookId: string) => void;
}

export const OverdueLoansPanel: React.FC<OverdueLoansPanelProps> = ({
  loans,
  className,
  onOpenQuickReturn,
}) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast({
      title: "E-mail Copiado!",
      description: `${email} copiado para a área de transferência.`,
      duration: 2000,
    });
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const formatOverdueTime = (hours: number, days: number) => {
    if (days >= 1) {
      return `${days} ${days === 1 ? 'dia' : 'dias'} de atraso`;
    }
    return `${hours} ${hours === 1 ? 'hora' : 'horas'} de atraso`;
  };

  return (
    <div className={cn(
      "border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]",
      className
    )}>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-black dark:border-white bg-red-50 dark:bg-red-950/30 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
            loans.length > 0 ? "bg-red-400 text-black animate-pulse" : "bg-green-300 text-black"
          )}>
            {loans.length > 0 ? (
              <AlertTriangle className="h-6 w-6" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
            )}
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
              Empréstimos com Atraso Crítico
              <Badge className={cn(
                "font-black text-xs rounded-none border-2 border-black",
                loans.length > 0 ? "bg-red-500 text-white" : "bg-green-500 text-white"
              )}>
                {loans.length} {loans.length === 1 ? 'PENDENTE' : 'PENDENTES'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs font-mono font-bold text-muted-foreground mt-0.5">
              Equipamentos cujo prazo de devolução já expirou e continuam fora da base
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <div className="p-4 sm:p-6">
        {loans.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
            <p className="font-black uppercase text-sm text-green-800 dark:text-green-300">
              Excelente! Nenhum empréstimo em atraso no momento.
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Todos os Chromebooks emprestados estão dentro do prazo estipulado de devolução.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => {
              const isCopied = copiedEmail === loan.student_email;

              return (
                <div
                  key={loan.id}
                  className="p-4 border-2 border-black dark:border-white bg-red-50/40 dark:bg-red-950/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="px-2.5 py-1 bg-red-200 dark:bg-red-900 border-2 border-black font-mono font-black text-xs text-red-950 dark:text-red-100 shrink-0 self-start sm:self-auto">
                      {loan.chromebook_id}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm uppercase text-black dark:text-white">
                          {loan.student_name}
                        </span>
                        <span className="text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-800 border border-black">
                          {loan.user_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mt-1 flex-wrap">
                        <span>
                          Retirada: <strong>{format(new Date(loan.loan_date), 'dd/MM HH:mm')}</strong>
                        </span>
                        <span>
                          Prazo: <strong className="text-red-600 dark:text-red-400">{format(new Date(loan.expected_return_date), 'dd/MM HH:mm')}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <span className="px-2 py-1 text-xs font-black bg-red-500 text-white border border-black uppercase font-mono flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {formatOverdueTime(loan.hoursOverdue, loan.daysOverdue)}
                    </span>

                    {loan.student_email && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyEmail(loan.student_email)}
                        className="h-8 border-2 border-black text-xs font-bold uppercase rounded-none bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        title="Copiar e-mail do solicitante"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-green-600 mr-1" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 mr-1" />
                        )}
                        E-mail
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
