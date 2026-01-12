import React from 'react';
import { Laptop, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import type { Chromebook } from "@/types/database";
import { cn } from '@/lib/utils';

interface InventoryStatsProps {
  chromebooks: Chromebook[];
}

export function InventoryStats({ chromebooks }: InventoryStatsProps) {
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
  }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    iconBg: string;
    description: string;
    delay?: number;
    sticker?: { text: string; color: string };
  }) => (
    <div 
      className={cn(
        "neo-stat-card animate-fadeIn neo-pattern-dots relative overflow-visible"
      )} 
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Sticker decorativo */}
      {sticker && (
        <div className={cn(
          "neo-sticker neo-sticker-top-right",
          sticker.color
        )}>
          {sticker.text}
        </div>
      )}
      
      <div className="flex flex-row items-center justify-between space-y-0 pb-3">
        <h3 className="text-xs font-black uppercase tracking-tight text-muted-foreground">
          {title}
        </h3>
        <div className={cn("neo-stat-icon-box", iconBg)}>
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard
        title="Total de Equipamentos"
        value={total}
        icon={Laptop}
        iconBg="bg-gray-200 dark:bg-gray-700"
        description="Inventário completo"
        delay={0}
        sticker={{ text: "AO VIVO", color: "bg-green-400 animate-gentle-pulse" }}
      />
      <StatCard
        title="Disponíveis"
        value={available}
        icon={CheckCircle}
        iconBg="bg-green-300 dark:bg-green-700"
        description={`${((available / total) * 100 || 0).toFixed(0)}% do total`}
        delay={100}
      />
      <StatCard
        title="Emprestados/Fixos"
        value={borrowed + fixed}
        icon={Clock}
        iconBg="bg-purple-300 dark:bg-purple-700"
        description={`${borrowed} emprestados + ${fixed} fixos`}
        delay={200}
      />
      <StatCard
        title="Indisponíveis"
        value={maintenance + inactive}
        icon={AlertTriangle}
        iconBg="bg-red-300 dark:bg-red-700"
        description={`${maintenance} manutenção + ${inactive} inativos`}
        delay={300}
      />
    </div>
  );
}