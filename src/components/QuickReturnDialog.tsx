import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, Computer, Clock, CheckCircle, AlertTriangle, RotateCcw, BookOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { LoanHistoryItem } from '@/types/database';
import type { ChromebookSearchResult } from '@/hooks/useChromebookSearch';
import {
  isOverdue,
  formatDetailedDuration,
  getOverdueStatusMessage
} from '@/utils/loanCalculations';

interface QuickReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chromebook: ChromebookSearchResult | null;
  activeLoan: LoanHistoryItem | null;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function QuickReturnDialog({
  open,
  onOpenChange,
  chromebook,
  activeLoan,
  onConfirm,
  loading = false,
}: QuickReturnDialogProps) {
  if (!chromebook || !activeLoan) return null;

  const overdue = activeLoan.expected_return_date ? isOverdue(activeLoan.expected_return_date) : false;
  const formattedDuration = formatDetailedDuration(activeLoan.loan_date);

  const formattedLoanDate = activeLoan.loan_date
    ? format(new Date(activeLoan.loan_date), "dd/MM/yyyy 'às' HH:mm")
    : 'Data não informada';

  const userTypeBadgeColor =
    activeLoan.user_type === 'professor'
      ? 'bg-purple-100 text-purple-800 border-purple-600 dark:bg-purple-950 dark:text-purple-300'
      : activeLoan.user_type === 'funcionario'
      ? 'bg-blue-100 text-blue-800 border-blue-600 dark:bg-blue-950 dark:text-blue-300'
      : 'bg-emerald-100 text-emerald-800 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300';

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent className="neo-dialog w-[92vw] max-w-md p-0 gap-0 box-border overflow-hidden">
        {/* Cabeçalho Neobrutalista Âmbar Compacto */}
        <div className="bg-amber-300 dark:bg-amber-600 p-2.5 sm:p-3 border-b-3 border-black dark:border-white w-full box-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#000]">
              <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-black dark:text-white leading-none">
                Devolução Rápida
              </h3>
              <p className="text-black/80 dark:text-white/80 font-bold uppercase text-[9px] mt-0.5 leading-none">
                Equipamento com empréstimo ativo
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo Compacto - Sem necessidade de scroll */}
        <div className="p-3 space-y-2 w-full box-border">
          {/* Card do Equipamento */}
          <div className="p-2 border-2 border-black dark:border-white bg-amber-50 dark:bg-amber-950/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] w-full box-border">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 border-2 border-black dark:border-white bg-amber-200 dark:bg-amber-800 flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_#000]">
                  <Computer className="h-4 w-4 text-black dark:text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-muted-foreground leading-none">Chromebook</p>
                  <p className="font-black text-sm uppercase text-black dark:text-white leading-tight truncate">
                    {chromebook.chromebook_id}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-2 border-black dark:border-white bg-white dark:bg-zinc-800 font-black uppercase text-[10px] shrink-0 h-5 px-1.5 truncate max-w-[110px]">
                {chromebook.model || 'Padrão'}
              </Badge>
            </div>
          </div>

          {/* Card do Solicitante Vinculado */}
          <div className="flex items-start gap-2.5 p-2 neo-card border-none shadow-none bg-violet-100 dark:bg-violet-900/30 border-l-3 border-l-violet-600 w-full box-border min-w-0">
            <User className="h-4 w-4 text-violet-700 dark:text-violet-300 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <p className="text-[9px] font-black uppercase text-violet-800 dark:text-violet-300 truncate">
                  Vinculado a
                </p>
                <Badge
                  variant="outline"
                  className={cn("text-[9px] font-black uppercase px-1.5 py-0 h-4 border leading-none shrink-0", userTypeBadgeColor)}
                >
                  {activeLoan.user_type || 'Aluno'}
                </Badge>
              </div>
              <p className="font-black text-xs uppercase text-black dark:text-white truncate">
                {activeLoan.student_name}
              </p>
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-muted-foreground mt-0.5 break-all">
                <span>{activeLoan.student_email}</span>
                {activeLoan.student_ra && (
                  <span className="font-bold">| RA: {activeLoan.student_ra}</span>
                )}
              </div>
            </div>
          </div>

          {/* Card de Informações do Empréstimo */}
          <div className="flex items-start gap-2.5 p-2 neo-card border-none shadow-none bg-blue-100 dark:bg-blue-900/30 border-l-3 border-l-blue-600 w-full box-border min-w-0">
            <Clock className="h-4 w-4 text-blue-700 dark:text-blue-300 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase text-blue-800 dark:text-blue-300">
                Histórico da Retirada
              </p>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <p className="text-[11px] font-bold text-black dark:text-white">
                  Retirado em: <span className="font-mono">{formattedLoanDate}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Tempo: <span className="font-bold text-black dark:text-white">{formattedDuration}</span>
                </p>
              </div>
              {activeLoan.purpose && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-black dark:text-white bg-white/80 dark:bg-black/40 p-1 border border-blue-300 dark:border-blue-700 w-full box-border min-w-0">
                  <BookOpen className="h-3 w-3 text-blue-600 shrink-0" />
                  <span className="truncate font-medium">Motivo: {activeLoan.purpose}</span>
                </div>
              )}
            </div>
          </div>

          {/* Alerta de Atraso (se houver) */}
          {overdue && (
            <div className="flex items-center gap-1.5 p-1.5 bg-red-100 dark:bg-red-950/40 border-2 border-red-600 text-red-900 dark:text-red-200 shadow-[2px_2px_0_0_#dc2626] w-full box-border">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 animate-bounce" />
              <div className="text-[10px] font-black uppercase truncate">
                Empréstimo Vencido! {getOverdueStatusMessage(activeLoan.expected_return_date)}
              </div>
            </div>
          )}

          {/* Chamada para Ação Compacta */}
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-black dark:border-white text-center w-full box-border">
            <p className="text-[11px] font-black uppercase text-black dark:text-white tracking-wide">
              Tornar este equipamento <span className="text-emerald-600 dark:text-emerald-400 underline">DISPONÍVEL</span> agora?
            </p>
          </div>
        </div>

        {/* Rodapé com botões compactos - Botão "NÃO" */}
        <div className="p-3 pt-0 flex gap-2 w-full box-border">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-10 border-2 border-black dark:border-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.9)] active:translate-x-[1px] active:translate-y-[1px] transition-all flex-1 shrink-0"
          >
            NÃO
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="neo-btn-green h-10 flex-[1.6] text-xs font-black tracking-tight shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="mr-1.5 h-4 w-4" />
                SIM, TORNAR DISPONÍVEL
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
