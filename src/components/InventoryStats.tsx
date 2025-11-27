import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Computer, CheckCircle, Clock, AlertTriangle, MapPin, XCircle, Factory, Hash, Unlock } from 'lucide-react';
import type { Chromebook } from '@/types/database';
import { GlassCard } from './ui/GlassCard';

interface InventoryStatsProps {
  chromebooks: Chromebook[];
}

export function InventoryStats({ chromebooks }: InventoryStatsProps) {
  const total = chromebooks.length;
  
  // Calcular contagens por status
  const stats = chromebooks.reduce((acc, cb) => {
    acc[cb.status] = (acc[cb.status] || 0) + 1;
    return acc;
  }, {} as Record<Chromebook['status'], number>);

  // Contagem de Inativos (fora_uso) e Desprovisionados
  const totalForaUso = stats.fora_uso || 0;
  // const totalDeprovisioned = chromebooks.filter(cb => cb.is_deprovisioned).length; // Removido o cálculo
  
  // Contagem de mobilidade
  const totalFixo = stats.fixo || 0;
  const totalMovel = total - totalFixo - totalForaUso;

  const statItems = [
    {
      title: 'Total de Equipamentos',
      value: total,
      icon: Computer,
      color: 'text-primary',
      description: 'Inventário total'
    },
    {
      title: 'Disponíveis',
      value: stats.disponivel || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      description: 'Prontos para empréstimo'
    },
    {
      title: 'Emprestados',
      value: stats.emprestado || 0,
      icon: Clock,
      color: 'text-purple-600',
      description: 'Atualmente em uso'
    },
    {
      title: 'Manutenção',
      value: stats.manutencao || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      description: 'Aguardando reparo'
    },
    {
      title: 'Fixos',
      value: totalFixo,
      icon: MapPin,
      color: 'text-blue-600',
      description: 'Alocados em salas'
    },
    {
      title: 'Inativos (Admin)',
      value: totalForaUso,
      icon: XCircle,
      color: 'text-gray-600',
      description: 'Marcados como fora de uso'
    },
    // O card 'Desprovisionados' foi removido daqui
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <GlassCard key={index} className="border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {item.title}
              </CardTitle>
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-xl sm:text-3xl font-bold ${item.color}`}>{item.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
            </CardContent>
          </GlassCard>
        );
      })}
    </div>
  );
}