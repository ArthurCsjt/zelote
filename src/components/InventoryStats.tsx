import React from 'react';
import { Laptop, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import type { Chromebook } from "@/types/database";
import { cn } from '@/lib/utils';

interface InventoryStatsProps {
  chromebooks: Chromebook[];
  selectedFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export function InventoryStats({
  chromebooks,
  selectedFilter = 'all',
  onSelectFilter
}: InventoryStatsProps) {
  const total = chromebooks.length;
  const available = chromebooks.filter((c) => c.status === 'disponivel').length;
  const borrowed = chromebooks.filter((c) => c.status === 'emprestado').length;
  const maintenance = chromebooks.filter((c) => c.status === 'manutencao').length;
  const fixed = chromebooks.filter((c) => c.status === 'fixo').length;
  const inactive = chromebooks.filter((c) => c.status === 'fora_uso').length;

  // Neo-Brutalism Stat Card Component
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    iconBg, 
    description, 
    delay = 0,
    sticker,
    filterKey,
  }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    iconBg: string;
    description: string;
    delay?: number;
    sticker?: { text: string; color: string };
    filterKey: string;
  }) => {
    const isSelected = selectedFilter === filterKey;

    const handleClick = () => {
      if (!onSelectFilter) return;
      if (selectedFilter === filterKey && filterKey !== 'all') {
        onSelectFilter('all');
      } else {
        onSelectFilter(filterKey);
      }
    };

    return (
      <div 
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        title={`Clique para filtrar por ${title.toLowerCase()}`}
        className={cn(
          "neo-stat-card animate-fadeIn neo-pattern-dots relative overflow-hidden cursor-pointer transition-all duration-150 select-none",
          isSelected
            ? "border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] -translate-x-[2px] -translate-y-[2px] bg-yellow-100 dark:bg-yellow-950/40 ring-2 ring-black dark:ring-white"
            : "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        )} 
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* Sticker decorativo */}
        {isSelected ? (
          <div className="absolute top-2 right-2 px-2 py-0.5 font-black uppercase text-[10px] text-white bg-black dark:bg-white dark:text-black border-2 border-black dark:border-white z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
            FILTRO ATIVO ✓
          </div>
        ) : sticker ? (
          <div className={cn(
            "absolute top-2 right-2 px-2 py-0.5 font-black uppercase text-[10px] text-black border-2 border-black z-10",
            sticker.color
          )}>
            {sticker.text}
          </div>
        ) : (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 font-mono uppercase text-[9px] text-gray-500 font-bold border border-gray-400 bg-white/70 dark:bg-zinc-800/70 opacity-70 hover:opacity-100">
            FILTRAR ▾
          </div>
        )}
        
        <div className="flex flex-row items-center justify-between space-y-0 pb-3">
          <h3 className="text-xs font-black uppercase tracking-tight text-muted-foreground pr-2 leading-tight">
            {title}
          </h3>
          <div className={cn(
            "shrink-0 p-2 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
            iconBg
          )}>
            <Icon className="h-5 w-5 text-black dark:text-white" strokeWidth={2.5} />
          </div>
        </div>
        <div>
          <div className="text-3xl font-black text-black dark:text-white">{value}</div>
          <p className="text-xs text-muted-foreground font-mono font-bold mt-2 uppercase tracking-wide">
            {description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard
        title="Total de Equipamentos"
        value={total}
        icon={Laptop}
        iconBg="bg-gray-200 dark:bg-gray-700"
        description="Ver todos os itens"
        delay={0}
        sticker={{ text: "AO VIVO", color: "bg-green-400 animate-gentle-pulse" }}
        filterKey="all"
      />
      <StatCard
        title="Disponíveis"
        value={available}
        icon={CheckCircle}
        iconBg="bg-green-300 dark:bg-green-700"
        description={`${((available / (total || 1)) * 100).toFixed(0)}% do total`}
        delay={100}
        filterKey="disponivel"
      />
      <StatCard
        title="Emprestados / Fixos"
        value={borrowed + fixed}
        icon={Clock}
        iconBg="bg-purple-300 dark:bg-purple-700"
        description={`${borrowed} emprestados + ${fixed} fixos`}
        delay={200}
        filterKey="emprestado_fixo"
      />
      <StatCard
        title="Indisponíveis"
        value={maintenance + inactive}
        icon={AlertTriangle}
        iconBg="bg-red-300 dark:bg-red-700"
        description={`${maintenance} manutenção + ${inactive} inativos`}
        delay={300}
        filterKey="indisponiveis"
      />
    </div>
  );
}