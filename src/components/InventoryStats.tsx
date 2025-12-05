import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Laptop, CheckCircle, AlertTriangle, XCircle, MapPin, Clock } from 'lucide-react';
import type { Chromebook } from "@/types/database";
import { cn } from '@/lib/utils';
import { GlassCard } from './ui/GlassCard';

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

  // Neo-Brutalism Card Component
  const StatCard = ({ title, value, icon: Icon, color, description, delay = 0 }: any) => (
    <div className={cn(
      "relative p-4 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]",
      "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200",
      "animate-fadeIn"
    )} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-xs font-black uppercase tracking-tight text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <div className={cn("p-1.5 border-2 border-black dark:border-white", color)}>
          <Icon className="h-4 w-4 text-black dark:text-white" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-black text-black dark:text-white">{value}</div>
        <p className="text-xs text-muted-foreground font-mono font-bold mt-1">
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
        color="bg-gray-200"
        description="Inventário completo"
        delay={0}
      />
      <StatCard
        title="Disponíveis"
        value={available}
        icon={CheckCircle}
        color="bg-green-300"
        description={`${((available / total) * 100 || 0).toFixed(0)}% do total`}
        delay={100}
      />
      <StatCard
        title="Emprestados/Fixos"
        value={borrowed + fixed}
        icon={Clock}
        color="bg-purple-300"
        description={`${borrowed} emprestados + ${fixed} fixos`}
        delay={200}
      />
      <StatCard
        title="Indisponíveis"
        value={maintenance + inactive}
        icon={AlertTriangle}
        color="bg-red-300"
        description={`${maintenance} manutenção + ${inactive} inativos`}
        delay={300}
      />
    </div>
  );
}