import React, { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { LoanHistoryItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, User, Monitor, ArrowLeft, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format, differenceInHours } from 'date-fns';

const ITEMS_PER_PAGE = 4;

export function LongDurationLoansPanel() {
    const { getActiveLoans } = useDatabase();
    const [longDurationLoans, setLongDurationLoans] = useState<LoanHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchLoans = async () => {
            setLoading(true);
            const loans = await getActiveLoans();

            const now = new Date();

            const filteredLoans = loans.filter(loan => {
                // Verifica se o status é 'ativo' (ou 'atrasado', que também conta como ativo no sistema)
                if (loan.status === 'devolvido') return false;

                const loanDate = new Date(loan.loan_date);
                const hoursActive = differenceInHours(now, loanDate);

                // Retorna verdadeiro se o empréstimo tem mais de 24 horas
                return hoursActive >= 24;
            });

            setLongDurationLoans(filteredLoans);
            setLoading(false);
        };

        fetchLoans();
    }, [getActiveLoans]);

    if (loading || longDurationLoans.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-5xl mx-auto mt-12 animate-in slide-in-from-bottom-10 fade-in duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between bg-red-600 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6 select-none relative overflow-hidden group">
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent scale-150 group-hover:scale-125 transition-transform duration-1000" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce-slow">
                        <AlertTriangle className="h-8 w-8 text-black fill-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                            Atenção Absoluta
                        </h2>
                        <p className="text-white font-bold font-mono text-sm tracking-widest uppercase opacity-90">
                            Empréstimos Críticos ({longDurationLoans.length})
                        </p>
                    </div>
                </div>

                <div className="hidden sm:block">
                    <Badge className="bg-black text-white text-lg font-black px-6 py-2 rounded-none border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] transform -rotate-2">
                        {'>'} 24H
                    </Badge>
                </div>
            </div>

            {/* Grid of Loans - Aggressively Compacted */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {longDurationLoans
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((loan, index) => {
                        const hoursActive = differenceInHours(new Date(), new Date(loan.loan_date));

                        return (
                            <div
                                key={loan.id}
                                className="group relative bg-white dark:bg-zinc-900 border-[3px] border-black overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                            >
                                {/* "Tape" Effect on corners - Tiny */}
                                <div className="absolute -top-4 -right-4 bg-red-600 h-8 w-8 transform rotate-45 border-b-[1.5px] border-black z-10" />

                                <div className="p-2.5 relative z-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1 border-2 border-black rounded-full">
                                                <User className="h-3 w-3 text-black dark:text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-xs text-black dark:text-white uppercase leading-none truncate max-w-[100px]" title={loan.student_name}>
                                                    {loan.student_name}
                                                </h3>
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mt-0.5">
                                                    Aluno
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className="bg-red-500 text-white text-[10px] font-black border border-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] px-1 py-0 h-4">
                                            {hoursActive}H
                                        </Badge>
                                    </div>

                                    <div className="space-y-1.5 bg-gray-50 dark:bg-zinc-950/50 p-1.5 border border-dashed border-gray-300 dark:border-zinc-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Monitor className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                                                <span className="font-mono font-bold text-[10px] text-black dark:text-white">
                                                    {loan.chromebook_id}
                                                </span>
                                            </div>
                                            <div className="h-px flex-1 bg-gray-300 mx-1.5" />
                                            <span className="text-[9px] font-bold text-gray-500">ID</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                                                <span className="font-mono font-bold text-[10px] text-black dark:text-white">
                                                    {format(new Date(loan.loan_date), "dd/MM HH:mm")}
                                                </span>
                                            </div>
                                            <div className="h-px flex-1 bg-gray-300 mx-1.5" />
                                            <span className="text-[9px] font-bold text-gray-500">INÍCIO</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Strip - Ultra Compact */}
                                <div className="bg-yellow-300 border-t-[3px] border-black p-1 flex justify-center items-center gap-1.5 group-hover:bg-yellow-400 transition-colors cursor-pointer">
                                    <AlertTriangle className="h-3 w-3 text-black" />
                                    <span className="text-[9px] font-black text-black uppercase tracking-widest">
                                        Ação
                                    </span>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Pagination Controls */}
            {longDurationLoans.length > ITEMS_PER_PAGE && (
                <div className="flex justify-between items-center mt-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-none hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 font-bold uppercase gap-2 text-black dark:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Anterior
                    </Button>

                    <span className="font-black font-mono text-sm text-black dark:text-white">
                        PÁGINA {currentPage} / {Math.ceil(longDurationLoans.length / ITEMS_PER_PAGE)}
                    </span>

                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(longDurationLoans.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={currentPage >= Math.ceil(longDurationLoans.length / ITEMS_PER_PAGE)}
                        className="rounded-none hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 font-bold uppercase gap-2 text-black dark:text-white"
                    >
                        Próximo
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
