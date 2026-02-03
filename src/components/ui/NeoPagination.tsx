import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface NeoPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function NeoPagination({
    currentPage,
    totalPages,
    onPageChange,
    className
}: NeoPaginationProps) {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={cn(
                        "min-w-[40px] h-[40px] flex items-center justify-center font-black transition-all duration-200 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        currentPage === i
                            ? "bg-black text-white dark:bg-zinc-100 dark:text-black"
                            : "bg-white text-black dark:bg-zinc-900 dark:text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    )}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <nav className={cn("flex flex-wrap items-center justify-center gap-3 py-6 px-2", className)}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                    "px-4 h-10 flex items-center gap-2 font-black uppercase text-[10px] tracking-wider border-[3px] border-black dark:border-white transition-all duration-200",
                    "bg-white dark:bg-zinc-900 text-black dark:text-white",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none",
                    currentPage !== 1 && "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-none"
                )}
            >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2">
                {renderPageNumbers().map((pageButton, index) => {
                    // Re-rendering with better styles
                    const pageNum = (pageButton as React.ReactElement).key;
                    const isActive = currentPage === Number(pageNum);

                    return (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(Number(pageNum))}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center font-black text-xs transition-all duration-200 border-[3px] border-black dark:border-white",
                                isActive
                                    ? "bg-black text-white dark:bg-white dark:text-black shadow-[3px_3px_0px_0px_rgba(59,130,246,0.5)] transform translate-x-0.5 translate-y-0.5"
                                    : "bg-white text-black dark:bg-zinc-900 dark:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-none"
                            )}
                        >
                            {pageNum}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                    "px-4 h-10 flex items-center gap-2 font-black uppercase text-[10px] tracking-wider border-[3px] border-black dark:border-white transition-all duration-200",
                    "bg-white dark:bg-zinc-900 text-black dark:text-white",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none",
                    currentPage !== totalPages && "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-none"
                )}
            >
                <span>Próximo</span>
                <ChevronRight className="h-4 w-4" />
            </button>
        </nav>
    );
}
