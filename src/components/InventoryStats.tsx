import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Computer, CheckCircle, Clock, AlertTriangle, MapPin, XCircle, Factory, Hash } from 'lucide-react';
import type { Chromebook } from '@/types/database';
import { GlassCard } from './ui/GlassCard';
import { Progress } from './ui/progress';

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

  // Calcular contagens de mobilidade
  const totalFixo = stats.fixo || 0;
  const totalInativo = stats.fora_uso || 0;
  // Total móvel é a soma de disponivel, emprestado e manutencao
  const totalMovel = (stats.disponivel || 0) + (stats.emprestado || 0) + (stats.manutencao || 0);

  const statItems = [
    {
      title: 'Total de Equipamentos',
      value: total,
      icon: Computer,
      color: 'text-primary',
      description: 'Inventário total',
      progressColor: 'bg-primary',
      showProgress: false,
    },
    {
      title: 'Disponíveis',
      value: stats.disponivel || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      description: 'Prontos para empréstimo',
      progressColor: 'bg-green-500',
      showProgress: true,
    },
    {
      title: 'Emprestados',
      value: stats.emprestado || 0,
      icon: Clock,
      color: 'text-purple-600',
      description: 'Atualmente em uso',
      progressColor: 'bg-purple-500',
      showProgress: true,
    },
    {
      title: 'Manutenção',
      value: stats.manutencao || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      description: 'Aguardando reparo',
      progressColor: 'bg-red-500',
      showProgress: true,
    },
    {
      title: 'Fixos',
      value: totalFixo,
      icon: MapPin,
      color: 'text-blue-600',
      description: 'Alocados em salas',
      progressColor: 'bg-blue-500',
      showProgress: true,
    },
    {
      title: 'Móveis (Disponíveis/Em Uso)',
      value: totalMovel,
      icon: Factory,
      color: 'text-orange-600',
      description: 'Em circulação',
      progressColor: 'bg-orange-500',
      showProgress: true,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        
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
              {item.showProgress && (
                <div className="mt-2">
                  <Progress 
                    value={percentage} 
                    className="h-1.5" 
                    indicatorClassName={item.progressColor}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              )}
            </CardContent>
          </GlassCard>
        );
      })}
    </div>
  );
}